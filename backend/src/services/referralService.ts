import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { createHash } from 'crypto';

interface ReferralActivity {
  id: string;
  referrer_id: string;
  referred_id?: string;
  status: string;
  source_channel?: string;
  device_fingerprint?: string;
  ip_address?: string;
}

interface ReferralReward {
  user_id: string;
  referral_activity_id: string;
  reward_type: string;
  credit_amount_cents: number;
  percentage_discount?: number;
  perks?: string[];
  status: string;
}

interface FraudCheckResult {
  isPotentialFraud: boolean;
  fraudScore: number;
  fraudFlags: string[];
  shouldBlock: boolean;
}

/**
 * Production-grade referral service with fraud detection,
 * reward management, and comprehensive tracking
 */
export class ReferralService {
  private readonly REFERRAL_COOKIE_NAME = 'st_ref';
  private readonly REFERRAL_EXPIRY_DAYS = 30;
  
  /**
   * Generate a unique, readable referral code for a user
   */
  async generateUserReferralCode(userId: string, userName: string): Promise<string> {
    try {
      // Check if user already has a code
      const { data: existingCode } = await supabaseService
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existingCode) {
        return existingCode.code;
      }

      // Generate new code
      const baseName = userName.split(' ')[0].toUpperCase().slice(0, 6);
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      let code = `${baseName}-${randomSuffix}`;
      
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const { data: exists } = await supabaseService
          .from('referral_codes')
          .select('id')
          .eq('code', code)
          .single();

        if (!exists) {
          break;
        }
        
        code = `${baseName}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        attempts++;
      }

      // Save the code
      const { data, error } = await supabaseService
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data.code;
    } catch (error) {
      logger.error('Error generating referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }

  /**
   * Track a referral click/visit
   */
  async trackReferralClick(
    referralCode: string,
    sourceChannel: string = 'link_copy',
    deviceInfo?: {
      fingerprint?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    try {
      // Validate referral code
      const { data: referralCodeData, error: codeError } = await supabaseService
        .from('referral_codes')
        .select('id, user_id')
        .eq('code', referralCode)
        .eq('is_active', true)
        .single();

      if (codeError || !referralCodeData) {
        throw new Error('Invalid referral code');
      }

      // Create device fingerprint if not provided
      const deviceFingerprint = deviceInfo?.fingerprint || 
        this.generateDeviceFingerprint(deviceInfo?.userAgent, deviceInfo?.ipAddress);

      // Check for existing activity from this device
      const { data: existingActivity } = await supabaseService
        .from('referral_activities')
        .select('id')
        .eq('referral_code_id', referralCodeData.id)
        .eq('device_fingerprint', deviceFingerprint)
        .eq('status', 'clicked')
        .single();

      if (existingActivity) {
        return existingActivity.id;
      }

      // Create new referral activity
      const { data: activity, error: activityError } = await supabaseService
        .from('referral_activities')
        .insert({
          referrer_id: referralCodeData.user_id,
          referral_code_id: referralCodeData.id,
          status: 'clicked',
          source_channel: sourceChannel,
          device_fingerprint: deviceFingerprint,
          ip_address: deviceInfo?.ipAddress,
          user_agent: deviceInfo?.userAgent,
          clicked_at: new Date().toISOString()
        })
        .select()
        .single();

      if (activityError) {
        throw activityError;
      }

      // Update referral code usage count
      await supabaseService
        .from('referral_codes')
        .update({ 
          uses_count: referralCodeData.uses_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', referralCodeData.id);

      return activity.id;
    } catch (error) {
      logger.error('Error tracking referral click:', error);
      throw error;
    }
  }

  /**
   * Complete referral signup
   */
  async completeReferralSignup(
    activityId: string,
    newUserId: string,
    userEmail: string
  ): Promise<void> {
    try {
      // Get activity details
      const { data: activity, error: activityError } = await supabaseService
        .from('referral_activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        throw new Error('Invalid referral activity');
      }

      // Run fraud checks
      const fraudCheck = await this.checkForFraud(activity, userEmail);
      
      if (fraudCheck.shouldBlock) {
        await this.flagAsFraudulent(activityId, fraudCheck.fraudFlags);
        throw new Error('Referral blocked due to suspicious activity');
      }

      // Update activity with new user
      await supabaseService
        .from('referral_activities')
        .update({
          referred_id: newUserId,
          referred_email: userEmail,
          status: 'signup_completed',
          signup_completed_at: new Date().toISOString(),
          fraud_score: fraudCheck.fraudScore,
          fraud_flags: fraudCheck.fraudFlags
        })
        .eq('id', activityId);

      // Update referred user's record
      await supabaseService
        .from('users')
        .update({
          referred_by_user_id: activity.referrer_id,
          signup_source: 'friend_invitation'
        })
        .eq('id', newUserId);

      // Award initial rewards (pending status)
      await this.awardSignupRewards(activityId, activity.referrer_id, newUserId);

      // Update stats
      await this.updateReferralStats(activity.referrer_id);

      // Send notifications
      await this.sendReferralNotifications(activity.referrer_id, newUserId, 'signup');

    } catch (error) {
      logger.error('Error completing referral signup:', error);
      throw error;
    }
  }

  /**
   * Check for fraudulent activity
   */
  private async checkForFraud(
    activity: ReferralActivity,
    userEmail: string
  ): Promise<FraudCheckResult> {
    const fraudFlags: string[] = [];
    let fraudScore = 0;

    try {
      // 1. Velocity check - too many referrals from same referrer
      const { count: recentReferrals } = await supabaseService
        .from('referral_activities')
        .select('id', { count: 'exact' })
        .eq('referrer_id', activity.referrer_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentReferrals && recentReferrals > 5) {
        fraudFlags.push('high_velocity');
        fraudScore += 0.3;
      }

      // 2. Device fingerprint check - same device multiple signups
      if (activity.device_fingerprint) {
        const { count: deviceSignups } = await supabaseService
          .from('referral_activities')
          .select('id', { count: 'exact' })
          .eq('device_fingerprint', activity.device_fingerprint)
          .eq('status', 'signup_completed')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (deviceSignups && deviceSignups > 2) {
          fraudFlags.push('duplicate_device');
          fraudScore += 0.4;
        }
      }

      // 3. Email pattern check - similar emails
      const emailDomain = userEmail.split('@')[1];
      const emailPrefix = userEmail.split('@')[0];
      
      // Check for numbered emails (user1@, user2@, etc.)
      if (/\d+$/.test(emailPrefix)) {
        const basePrefix = emailPrefix.replace(/\d+$/, '');
        const { count: similarEmails } = await supabaseService
          .from('users')
          .select('id', { count: 'exact' })
          .like('email', `${basePrefix}%@${emailDomain}`);

        if (similarEmails && similarEmails > 3) {
          fraudFlags.push('suspicious_email_pattern');
          fraudScore += 0.3;
        }
      }

      // 4. IP address check - VPN/datacenter detection
      if (activity.ip_address) {
        // In production, integrate with IP intelligence API
        // For now, basic check for known VPN ranges
        const suspiciousIP = await this.checkSuspiciousIP(activity.ip_address);
        if (suspiciousIP) {
          fraudFlags.push('suspicious_ip');
          fraudScore += 0.2;
        }
      }

      // 5. Time pattern check - all signups at odd hours
      const hour = new Date().getHours();
      if (hour >= 2 && hour <= 5) {
        fraudFlags.push('odd_hour_signup');
        fraudScore += 0.1;
      }

      return {
        isPotentialFraud: fraudScore > 0.5,
        fraudScore: Math.min(fraudScore, 1.0),
        fraudFlags,
        shouldBlock: fraudScore > 0.7
      };
    } catch (error) {
      logger.error('Error in fraud detection:', error);
      // Don't block on error, but flag for review
      return {
        isPotentialFraud: false,
        fraudScore: 0,
        fraudFlags: ['fraud_check_error'],
        shouldBlock: false
      };
    }
  }

  /**
   * Award referral rewards
   */
  private async awardSignupRewards(
    activityId: string,
    referrerId: string,
    referredId: string
  ): Promise<void> {
    try {
      // Get active campaign bonuses if any
      const { data: activeCampaign } = await supabaseService
        .from('referral_campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .single();

      const referrerBonus = activeCampaign 
        ? 1000 * (activeCampaign.referrer_bonus_multiplier || 1)
        : 1000; // $10 base

      const referredBonus = activeCampaign
        ? 500 * (activeCampaign.referred_bonus_multiplier || 1)
        : 500; // $5 base

      // Create rewards (pending until first dinner)
      const rewards = [
        {
          user_id: referrerId,
          referral_activity_id: activityId,
          reward_type: 'referrer_bonus',
          credit_amount_cents: referrerBonus,
          status: 'pending',
          campaign_id: activeCampaign?.id,
          earning_conditions: {
            required: 'referred_user_first_dinner'
          }
        },
        {
          user_id: referredId,
          referral_activity_id: activityId,
          reward_type: 'referred_bonus',
          credit_amount_cents: referredBonus,
          status: 'earned', // Immediately available for referred user
          campaign_id: activeCampaign?.id
        }
      ];

      const { error } = await supabaseService
        .from('referral_rewards')
        .insert(rewards);

      if (error) {
        logger.error('Error creating rewards:', error);
      }
    } catch (error) {
      logger.error('Error awarding signup rewards:', error);
    }
  }

  /**
   * Update user referral statistics
   */
  private async updateReferralStats(userId: string): Promise<void> {
    try {
      // Calculate stats
      const { data: activities } = await supabaseService
        .from('referral_activities')
        .select('status')
        .eq('referrer_id', userId)
        .eq('is_fraudulent', false);

      if (!activities) return;

      const stats = {
        total_referrals_sent: activities.length,
        total_referrals_clicked: activities.filter(a => 
          ['clicked', 'signup_started', 'signup_completed', 'onboarding_completed', 'first_booking_made', 'first_dinner_attended']
          .includes(a.status)
        ).length,
        total_referrals_signed_up: activities.filter(a => 
          ['signup_completed', 'onboarding_completed', 'first_booking_made', 'first_dinner_attended']
          .includes(a.status)
        ).length,
        total_referrals_attended_dinner: activities.filter(a => 
          a.status === 'first_dinner_attended'
        ).length,
        last_referral_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Calculate rewards
      const { data: rewards } = await supabaseService
        .from('referral_rewards')
        .select('credit_amount_cents, status')
        .eq('user_id', userId);

      if (rewards) {
        stats['total_credits_earned_cents'] = rewards
          .filter(r => ['earned', 'claimed', 'applied'].includes(r.status))
          .reduce((sum, r) => sum + (r.credit_amount_cents || 0), 0);
        
        stats['total_credits_used_cents'] = rewards
          .filter(r => r.status === 'applied')
          .reduce((sum, r) => sum + (r.credit_amount_cents || 0), 0);
      }

      // Determine tier
      const { data: tier } = await supabaseService
        .from('referral_reward_tiers')
        .select('id')
        .lte('referrals_required', stats.total_referrals_attended_dinner)
        .order('tier_level', { ascending: false })
        .limit(1)
        .single();

      if (tier) {
        stats['current_reward_tier_id'] = tier.id;
      }

      // Upsert stats
      await supabaseService
        .from('user_referral_stats')
        .upsert({
          user_id: userId,
          ...stats
        });

      // Update leaderboard rankings
      await this.updateLeaderboardRankings();

    } catch (error) {
      logger.error('Error updating referral stats:', error);
    }
  }

  /**
   * Update leaderboard rankings
   */
  private async updateLeaderboardRankings(): Promise<void> {
    try {
      // Simple ranking by total successful referrals
      const { data: allStats } = await supabaseService
        .from('user_referral_stats')
        .select('user_id, total_referrals_attended_dinner')
        .order('total_referrals_attended_dinner', { ascending: false });

      if (!allStats) return;

      // Update ranks
      for (let i = 0; i < allStats.length; i++) {
        const percentile = ((allStats.length - i) / allStats.length) * 100;
        
        await supabaseService
          .from('user_referral_stats')
          .update({
            leaderboard_rank: i + 1,
            leaderboard_percentile: percentile
          })
          .eq('user_id', allStats[i].user_id);
      }
    } catch (error) {
      logger.error('Error updating leaderboard:', error);
    }
  }

  /**
   * Send referral notifications
   */
  private async sendReferralNotifications(
    referrerId: string,
    referredId: string,
    type: 'signup' | 'first_dinner' | 'reward'
  ): Promise<void> {
    try {
      let title: string;
      let message: string;
      
      switch (type) {
        case 'signup':
          title = '🎉 Your friend joined SharedTable!';
          message = 'Your friend has signed up using your referral. You\'ll earn rewards when they attend their first dinner!';
          break;
        case 'first_dinner':
          title = '💰 Referral reward unlocked!';
          message = 'Your friend attended their first dinner. Your referral bonus is now available!';
          break;
        case 'reward':
          title = '🏆 New reward tier reached!';
          message = 'Congratulations! You\'ve unlocked a new referral tier with better rewards!';
          break;
      }

      await supabaseService
        .from('notifications')
        .insert({
          user_id: referrerId,
          type: 'referral',
          title,
          message,
          metadata: {
            referred_user_id: referredId,
            notification_type: type
          }
        });

      // TODO: Send push notification
      // TODO: Send email notification

    } catch (error) {
      logger.error('Error sending referral notification:', error);
    }
  }

  /**
   * Flag activity as fraudulent
   */
  private async flagAsFraudulent(
    activityId: string,
    fraudFlags: string[]
  ): Promise<void> {
    try {
      await supabaseService
        .from('referral_activities')
        .update({
          status: 'fraudulent',
          is_fraudulent: true,
          fraud_flags: fraudFlags,
          fraud_checked_at: new Date().toISOString()
        })
        .eq('id', activityId);

      // Create investigation record
      await supabaseService
        .from('referral_fraud_investigations')
        .insert({
          referral_activity_id: activityId,
          fraud_patterns_detected: fraudFlags,
          status: 'pending',
          evidence: { auto_flagged: true, flags: fraudFlags }
        });

    } catch (error) {
      logger.error('Error flagging as fraudulent:', error);
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(userAgent?: string, ipAddress?: string): string {
    const data = `${userAgent || 'unknown'}:${ipAddress || 'unknown'}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Check if IP is suspicious (basic implementation)
   */
  private async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    // In production, use IP intelligence API like IPQualityScore or MaxMind
    // This is a simplified check
    const vpnRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];
    
    // Basic private IP check (often VPNs)
    return vpnRanges.some(range => {
      const [rangeIP] = range.split('/');
      return ipAddress.startsWith(rangeIP.split('.').slice(0, 2).join('.'));
    });
  }

  /**
   * Get user's referral dashboard data
   */
  async getUserReferralDashboard(userId: string): Promise<any> {
    try {
      // Get user's referral code
      const { data: referralCode } = await supabaseService
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Get stats
      const { data: stats } = await supabaseService
        .from('user_referral_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get recent activities
      const { data: recentActivities } = await supabaseService
        .from('referral_activities')
        .select(`
          *,
          referred_user:users!referred_id(name, profile_picture_url)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get available rewards
      const { data: rewards } = await supabaseService
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['earned', 'claimed']);

      // Get current tier
      const { data: currentTier } = await supabaseService
        .from('referral_reward_tiers')
        .select('*')
        .eq('id', stats?.current_reward_tier_id)
        .single();

      // Get next tier
      const { data: nextTier } = await supabaseService
        .from('referral_reward_tiers')
        .select('*')
        .gt('tier_level', currentTier?.tier_level || 0)
        .order('tier_level', { ascending: true })
        .limit(1)
        .single();

      return {
        referralCode: referralCode?.code,
        referralLink: `${process.env.APP_URL}/join?ref=${referralCode?.code}`,
        stats: stats || {
          total_referrals_sent: 0,
          total_referrals_signed_up: 0,
          total_referrals_attended_dinner: 0,
          conversion_rate: 0,
          total_credits_earned_cents: 0,
          total_credits_used_cents: 0
        },
        currentTier,
        nextTier,
        progressToNextTier: nextTier ? {
          current: stats?.total_referrals_attended_dinner || 0,
          required: nextTier.referrals_required,
          percentage: ((stats?.total_referrals_attended_dinner || 0) / nextTier.referrals_required) * 100
        } : null,
        recentActivities,
        availableRewards: rewards,
        leaderboardPosition: stats?.leaderboard_rank,
        leaderboardPercentile: stats?.leaderboard_percentile
      };
    } catch (error) {
      logger.error('Error getting referral dashboard:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const referralService = new ReferralService();