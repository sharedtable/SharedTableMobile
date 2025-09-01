import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

export class GamificationService {
  /**
   * Award points when a user attends a dinner
   */
  static async onDinnerAttended(userId: string, eventId: string, _isWeekend: boolean = false, _isNewHost: boolean = false) {
    try {
      logger.info(`Awarding points for dinner attendance: ${userId} at event ${eventId}`);
      
      // Award points using the stored procedure
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'dinner_attended',
        p_reference_id: eventId,
        p_reference_type: 'event'
      });

      if (error) {
        throw error;
      }

      // Update user stats
      await supabaseService
        .from('user_stats')
        .update({ 
          dinners_attended: supabaseService.raw('dinners_attended + 1'),
          last_activity_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Check for achievements
      await this.checkAchievements(userId);
      
      // Update quest progress
      await this.updateQuestProgress(userId, 'attend_dinner', 1);

      logger.info(`Successfully awarded ${data} points to user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Error awarding points for dinner attendance:', error);
      throw error;
    }
  }

  /**
   * Award points when a user hosts a dinner
   */
  static async onDinnerHosted(userId: string, eventId: string, guestCount: number) {
    try {
      logger.info(`Awarding points for hosting dinner: ${userId} hosted event ${eventId} with ${guestCount} guests`);
      
      // Award points
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'dinner_hosted',
        p_reference_id: eventId,
        p_reference_type: 'event'
      });

      if (error) {
        throw error;
      }

      // Update user stats
      await supabaseService
        .from('user_stats')
        .update({ 
          dinners_hosted: supabaseService.raw('dinners_hosted + 1'),
          last_activity_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Check for achievements
      await this.checkAchievements(userId);
      
      // Update quest progress
      await this.updateQuestProgress(userId, 'host_dinner', 1);

      logger.info(`Successfully awarded ${data} points to user ${userId} for hosting`);
      return data;
    } catch (error) {
      logger.error('Error awarding points for hosting:', error);
      throw error;
    }
  }

  /**
   * Award points when a user writes a review
   */
  static async onReviewWritten(userId: string, reviewId: string, _eventId: string) {
    try {
      logger.info(`Awarding points for review: ${userId} wrote review ${reviewId}`);
      
      // Check daily limit for reviews
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabaseService
        .from('point_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'review_written')
        .gte('created_at', today.toISOString());

      if (count && count >= 3) {
        logger.info(`Daily review limit reached for user ${userId}`);
        return 0;
      }

      // Award points
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'review_written',
        p_reference_id: reviewId,
        p_reference_type: 'review'
      });

      if (error) {
        throw error;
      }

      // Update user stats
      await supabaseService
        .from('user_stats')
        .update({ 
          reviews_written: supabaseService.raw('reviews_written + 1'),
          last_activity_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Check for achievements
      await this.checkAchievements(userId);
      
      // Update quest progress
      await this.updateQuestProgress(userId, 'write_review', 1);

      logger.info(`Successfully awarded ${data} points to user ${userId} for review`);
      return data;
    } catch (error) {
      logger.error('Error awarding points for review:', error);
      throw error;
    }
  }

  /**
   * Award points when a referral is successful
   */
  static async onReferralSuccessful(referrerId: string, referredUserId: string) {
    try {
      logger.info(`Awarding points for referral: ${referrerId} referred ${referredUserId}`);
      
      // Award points to referrer
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: referrerId,
        p_action_type: 'referral_successful',
        p_reference_id: referredUserId,
        p_reference_type: 'user'
      });

      if (error) {
        throw error;
      }

      // Update referrer stats
      await supabaseService
        .from('user_stats')
        .update({ 
          referrals_made: supabaseService.raw('referrals_made + 1'),
          last_activity_date: new Date().toISOString()
        })
        .eq('user_id', referrerId);

      // Give bonus points to the new user
      await supabaseService.rpc('add_points_to_user', {
        p_user_id: referredUserId,
        p_action_type: 'referral_bonus',
        p_base_points: 25,
        p_reference_id: referrerId,
        p_reference_type: 'user'
      });

      // Check for achievements
      await this.checkAchievements(referrerId);
      
      logger.info(`Successfully awarded ${data} points to referrer ${referrerId}`);
      return data;
    } catch (error) {
      logger.error('Error awarding points for referral:', error);
      throw error;
    }
  }

  /**
   * Award points for daily login
   */
  static async onDailyLogin(userId: string) {
    try {
      // Check if already logged in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existing } = await supabaseService
        .from('point_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', 'daily_login')
        .gte('created_at', today.toISOString())
        .single();

      if (existing) {
        logger.info(`User ${userId} already received daily login points`);
        return 0;
      }

      // Award points
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'daily_login',
        p_reference_type: 'daily'
      });

      if (error) {
        throw error;
      }

      // Update streak
      await this.updateStreak(userId);
      
      // Update quest progress
      await this.updateQuestProgress(userId, 'daily_login', 1);

      logger.info(`Successfully awarded ${data} daily login points to user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Error awarding daily login points:', error);
      throw error;
    }
  }

  /**
   * Update user's activity streak
   */
  private static async updateStreak(userId: string) {
    try {
      const { data: stats, error } = await supabaseService
        .from('user_stats')
        .select('last_activity_date, current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      const lastActivity = stats?.last_activity_date ? new Date(stats.last_activity_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = stats?.current_streak || 0;

      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
        
        if (lastActivity.getTime() === yesterday.getTime()) {
          // Continuing streak
          newStreak = (stats?.current_streak || 0) + 1;
        } else if (lastActivity.getTime() < yesterday.getTime()) {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // First activity
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, stats?.longest_streak || 0);

      await supabaseService
        .from('user_stats')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Check for streak achievements
      await this.checkAchievements(userId);
      
    } catch (error) {
      logger.error('Error updating streak:', error);
    }
  }

  /**
   * Check and award achievements for a user
   */
  private static async checkAchievements(userId: string) {
    try {
      const { data } = await supabaseService.rpc('check_achievements_for_user', {
        p_user_id: userId
      });

      if (data && data.length > 0) {
        logger.info(`Awarded ${data.length} achievements to user ${userId}:`, data);
        
        // Could send push notifications for new achievements here
        for (const achievement of data) {
          if (achievement.awarded) {
            // Send achievement notification
            logger.info(`New achievement unlocked for ${userId}: ${achievement.achievement_key}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking achievements:', error);
    }
  }

  /**
   * Update quest progress for a user
   */
  private static async updateQuestProgress(userId: string, action: string, value: number = 1) {
    try {
      // Get active quests
      const { data: quests } = await supabaseService
        .from('quests')
        .select('*')
        .eq('active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString());

      if (!quests || quests.length === 0) {
        return;
      }

      for (const quest of quests) {
        // Check if quest criteria includes this action
        if (quest.criteria && quest.criteria[action]) {
          await supabaseService.rpc('update_quest_progress', {
            p_user_id: userId,
            p_quest_type: quest.type,
            p_action: action,
            p_value: value
          });
        }
      }
    } catch (error) {
      logger.error('Error updating quest progress:', error);
    }
  }

  /**
   * Initialize user stats for a new user
   */
  static async initializeUserStats(userId: string) {
    try {
      const { error } = await supabaseService
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: 0,
          current_tier: 1,
          dinners_attended: 0,
          dinners_hosted: 0,
          referrals_made: 0,
          reviews_written: 0,
          current_streak: 0,
          longest_streak: 0,
          points_this_month: 0,
          points_this_week: 0
        });

      if (error && error.code !== '23505') { // Ignore unique violation
        throw error;
      }

      logger.info(`Initialized gamification stats for user ${userId}`);
    } catch (error) {
      logger.error('Error initializing user stats:', error);
    }
  }

  /**
   * Update leaderboards (should be run periodically)
   */
  static async updateLeaderboards() {
    try {
      const { error } = await supabaseService.rpc('update_leaderboards');
      
      if (error) {
        throw error;
      }

      logger.info('Successfully updated leaderboards');
    } catch (error) {
      logger.error('Error updating leaderboards:', error);
    }
  }

  /**
   * Award points for completing profile
   */
  static async onProfileCompleted(userId: string) {
    try {
      // Check if already awarded
      const { data: existing } = await supabaseService
        .from('point_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', 'profile_completed')
        .single();

      if (existing) {
        logger.info(`User ${userId} already received profile completion points`);
        return 0;
      }

      // Award points
      const { data, error } = await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'profile_completed',
        p_reference_type: 'profile'
      });

      if (error) {
        throw error;
      }

      logger.info(`Successfully awarded ${data} points to user ${userId} for profile completion`);
      return data;
    } catch (error) {
      logger.error('Error awarding profile completion points:', error);
      throw error;
    }
  }
}

export default GamificationService;