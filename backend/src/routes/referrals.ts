import express, { Response, Request } from 'express';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { referralService } from '../services/referralService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get user's referral dashboard
 */
router.get('/dashboard', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get user ID
    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const dashboard = await referralService.getUserReferralDashboard(userData.id);

    return res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error('Error fetching referral dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch referral dashboard',
    });
  }
});

/**
 * Get or create user's referral code
 */
router.get('/code', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get user data
    const { data: userData } = await supabaseService
      .from('users')
      .select('id, name')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const code = await referralService.generateUserReferralCode(userData.id, userData.name);

    return res.json({
      success: true,
      data: {
        code,
        shareUrl: `${process.env.APP_URL || 'https://sharedtable.app'}/join?ref=${code}`,
      },
    });
  } catch (error) {
    logger.error('Error getting referral code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get referral code',
    });
  }
});

/**
 * Track referral click (public endpoint)
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { code, source, deviceInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Referral code is required',
      });
    }

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const activityId = await referralService.trackReferralClick(
      code,
      source || 'link_copy',
      {
        ...deviceInfo,
        ipAddress,
        userAgent,
      }
    );

    // Set cookie for attribution
    res.cookie('st_ref', activityId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.json({
      success: true,
      data: {
        activityId,
        message: 'Referral tracked successfully',
      },
    });
  } catch (error) {
    logger.error('Error tracking referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track referral',
    });
  }
});

/**
 * Complete referral during signup
 */
router.post('/complete-signup', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { activityId } = req.body;

    if (!privyUserId || !activityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    // Get user data
    const { data: userData } = await supabaseService
      .from('users')
      .select('id, email')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await referralService.completeReferralSignup(
      activityId,
      userData.id,
      userData.email
    );

    return res.json({
      success: true,
      message: 'Referral signup completed',
    });
  } catch (error) {
    logger.error('Error completing referral signup:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete referral',
    });
  }
});

/**
 * Get available rewards
 */
router.get('/rewards', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get user ID
    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get available rewards
    const { data: rewards, error } = await supabaseService
      .from('referral_rewards')
      .select(`
        *,
        referral_activity:referral_activities(
          referred_user:users!referred_id(name, profile_picture_url)
        ),
        reward_tier:referral_reward_tiers(*)
      `)
      .eq('user_id', userData.id)
      .in('status', ['earned', 'claimed'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate totals
    const totalCredits = rewards?.reduce(
      (sum, r) => sum + (r.credit_amount_cents || 0),
      0
    ) || 0;

    const availableCredits = rewards?.filter(r => r.status === 'earned')
      .reduce((sum, r) => sum + (r.credit_amount_cents || 0), 0) || 0;

    return res.json({
      success: true,
      data: {
        rewards: rewards || [],
        totalCredits,
        availableCredits,
      },
    });
  } catch (error) {
    logger.error('Error fetching rewards:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards',
    });
  }
});

/**
 * Claim a reward
 */
router.post('/rewards/:rewardId/claim', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { rewardId } = req.params;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get user ID
    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify reward belongs to user and is earned
    const { data: reward, error: rewardError } = await supabaseService
      .from('referral_rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('user_id', userData.id)
      .eq('status', 'earned')
      .single();

    if (rewardError || !reward) {
      return res.status(404).json({
        success: false,
        error: 'Reward not found or not available',
      });
    }

    // Claim the reward
    const { error: updateError } = await supabaseService
      .from('referral_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (updateError) {
      throw updateError;
    }

    // Add credits to user's account
    if (reward.credit_amount_cents > 0) {
      // TODO: Integrate with payment system to add credits
      logger.info(`Added ${reward.credit_amount_cents} cents credit to user ${userData.id}`);
    }

    return res.json({
      success: true,
      message: 'Reward claimed successfully',
      data: {
        creditAmount: reward.credit_amount_cents,
        perks: reward.perks,
      },
    });
  } catch (error) {
    logger.error('Error claiming reward:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to claim reward',
    });
  }
});

/**
 * Get referral leaderboard
 */
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const { data: leaderboard, error } = await supabaseService
      .from('referral_leaderboard')
      .select('*')
      .limit(50);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: leaderboard || [],
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

/**
 * Get referral analytics (admin only)
 */
router.get('/analytics', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin check
    
    const { timeframe = 'week' } = req.query;

    // Get funnel analytics
    const { data: funnel, error: funnelError } = await supabaseService
      .from('referral_funnel')
      .select('*')
      .order('week', { ascending: false })
      .limit(timeframe === 'week' ? 1 : timeframe === 'month' ? 4 : 12);

    if (funnelError) {
      throw funnelError;
    }

    // Get top referrers
    const { data: topReferrers, error: referrersError } = await supabaseService
      .from('user_referral_stats')
      .select(`
        user_id,
        total_referrals_attended_dinner,
        conversion_rate,
        users!user_id(name, profile_picture_url)
      `)
      .order('total_referrals_attended_dinner', { ascending: false })
      .limit(10);

    if (referrersError) {
      throw referrersError;
    }

    // Get campaign performance
    const { data: campaigns, error: campaignsError } = await supabaseService
      .from('referral_campaigns')
      .select(`
        *,
        activities:referral_activities(count)
      `)
      .eq('is_active', true);

    if (campaignsError) {
      throw campaignsError;
    }

    // Get fraud metrics
    const { data: fraudMetrics, error: fraudError } = await supabaseService
      .from('referral_activities')
      .select('is_fraudulent')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (fraudError) {
      throw fraudError;
    }

    const totalActivities = fraudMetrics?.length || 0;
    const fraudulentActivities = fraudMetrics?.filter(a => a.is_fraudulent).length || 0;
    const fraudRate = totalActivities > 0 
      ? (fraudulentActivities / totalActivities * 100).toFixed(2)
      : 0;

    return res.json({
      success: true,
      data: {
        funnel: funnel || [],
        topReferrers: topReferrers || [],
        campaigns: campaigns || [],
        fraudMetrics: {
          totalActivities,
          fraudulentActivities,
          fraudRate,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

/**
 * Report suspicious referral activity
 */
router.post('/report-fraud', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, reason, evidence } = req.body;

    if (!activityId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Activity ID and reason are required',
      });
    }

    // Create investigation
    const { error } = await supabaseService
      .from('referral_fraud_investigations')
      .insert({
        referral_activity_id: activityId,
        investigation_notes: reason,
        evidence: evidence || {},
        status: 'pending',
      });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Fraud report submitted for review',
    });
  } catch (error) {
    logger.error('Error reporting fraud:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to report fraud',
    });
  }
});

export default router;