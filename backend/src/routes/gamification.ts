import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Get user's gamification stats
router.get('/stats', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    
    if (!privyUserId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    // Get the internal user ID from Privy ID
    let { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    // If user doesn't exist, create them
    if (userError || !userData) {
      logger.info('User not found, creating new user for Privy ID:', privyUserId);
      
      // Create a new user
      const { data: newUser, error: createUserError } = await supabaseService
        .from('users')
        .insert({
          external_auth_id: privyUserId,
          email: req.auth?.email || `${privyUserId}@placeholder.com`,
          full_name: req.auth?.name || 'New User',
          onboarding_status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createUserError) {
        logger.error('Failed to create user:', {
          error: createUserError,
          privyUserId
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
      }

      userData = newUser;
    }

    const userId = userData.id;

    // Get user stats
    const { data: stats, error: statsError } = await supabaseService
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      logger.error('Error fetching user stats:', {
        error: statsError,
        userId,
        code: statsError.code,
        message: statsError.message
      });
      throw statsError;
    }

    // If no stats exist, create default stats for user
    if (!stats) {
      logger.info('Creating default stats for user:', { userId });
      
      const { data: newStats, error: createError } = await supabaseService
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
        })
        .select('*')
        .single();

      if (createError) {
        logger.error('Failed to create user stats:', {
          error: createError,
          userId,
          code: createError.code,
          message: createError.message,
          details: createError.details
        });
        
        // If foreign key constraint fails, return default stats without persisting
        if (createError.code === '23503') {
          logger.warn('Foreign key constraint issue, returning default stats without persistence');
          
          // Get tier information for default stats
          const { data: tierData } = await supabaseService
            .from('tiers')
            .select('*')
            .eq('tier_level', 1)
            .single();
          
          return res.json({ 
            success: true, 
            data: {
              userId: userId,
              totalPoints: 0,
              currentTier: 1,
              currentTierName: tierData?.name || 'Newcomer',
              pointsToNextTier: tierData?.points_required || 100,
              weeklyStreak: 0,
              monthlyRank: 0,
              allTimeRank: 0,
              dinnersAttended: 0,
              totalBadges: 0,
              lastUpdated: new Date().toISOString()
            }
          });
        }
        
        throw createError;
      }

      // Get tier information
      if (newStats) {
        const { data: tierData, error: tierError } = await supabaseService
          .from('tiers')
          .select('*')
          .eq('tier_level', newStats.current_tier || 1)
          .single();
        
        if (tierError) {
          logger.error('Error fetching tier data:', {
            error: tierError,
            tierLevel: newStats.current_tier || 1
          });
        }
        
        return res.json({ 
          success: true, 
          data: {
            userId: newStats.user_id,
            totalPoints: newStats.total_points || 0,
            currentTier: newStats.current_tier || 1,
            currentTierName: tierData?.name || 'Newcomer',
            pointsToNextTier: tierData?.points_required || 100,
            weeklyStreak: newStats.current_streak || 0,
            monthlyRank: 0,
            allTimeRank: 0,
            dinnersAttended: newStats.dinners_attended || 0,
            totalBadges: 0,
            lastUpdated: newStats.updated_at || new Date().toISOString()
          }
        });
      }
    }

    // Get tier information for existing stats
    if (stats) {
      const { data: tierData, error: tierError } = await supabaseService
        .from('tiers')
        .select('*')
        .eq('tier_level', stats.current_tier || 1)
        .single();
      
      if (tierError) {
        logger.error('Error fetching tier data for existing stats:', {
          error: tierError,
          tierLevel: stats.current_tier || 1
        });
      }
      
      return res.json({ 
        success: true, 
        data: {
          userId: stats.user_id,
          totalPoints: stats.total_points || 0,
          currentTier: stats.current_tier || 1,
          currentTierName: tierData?.name || 'Newcomer',
          pointsToNextTier: tierData?.points_required || 100,
          weeklyStreak: stats.current_streak || 0,
          monthlyRank: 0,
          allTimeRank: 0,
          dinnersAttended: stats.dinners_attended || 0,
          totalBadges: 0,
          lastUpdated: stats.updated_at || new Date().toISOString()
        }
      });
    }

    // Should not reach here, but return empty stats as fallback
    return res.json({ 
      success: true, 
      data: {
        userId: userId,
        totalPoints: 0,
        currentTier: 1,
        currentTierName: 'Newcomer',
        pointsToNextTier: 100,
        weeklyStreak: 0,
        monthlyRank: 0,
        allTimeRank: 0,
        dinnersAttended: 0,
        totalBadges: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching gamification stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch gamification stats' 
    });
  }
});

// Get user's achievements
router.get('/achievements', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    
    if (!privyUserId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    // Get the internal user ID from Privy ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      logger.error('User not found for achievements:', privyUserId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userId = userData.id;
    
    // Get all achievements
    const { data: allAchievements, error: achievementsError } = await supabaseService
      .from('achievements')
      .select('*')
      .eq('active', true)
      .order('points_reward', { ascending: false });

    if (achievementsError) {
      throw achievementsError;
    }

    // Get user's unlocked achievements
    const { data: unlockedAchievements, error: unlockedError } = await supabaseService
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    if (unlockedError && unlockedError.code !== 'PGRST116') {
      throw unlockedError;
    }

    // Merge the data
    const unlockedMap = new Map(
      (unlockedAchievements || []).map(ua => [ua.achievement_id, ua.unlocked_at])
    );

    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null
    }));

    res.json({ success: true, data: achievements });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch achievements' 
    });
  }
});

// Get active quests
router.get('/quests/:type?', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const questType = req.params.type;

    let query = supabaseService
      .from('quests')
      .select('*')
      .eq('active', true)
      .gte('ends_at', new Date().toISOString())
      .lte('starts_at', new Date().toISOString());

    if (questType && ['daily', 'weekly', 'special'].includes(questType)) {
      query = query.eq('type', questType);
    }

    const { data: quests, error: questsError } = await query;

    if (questsError) {
      throw questsError;
    }

    // Get user's progress for these quests
    if (userId && quests && quests.length > 0) {
      const questIds = quests.map(q => q.id);
      
      const { data: userQuests, error: userQuestsError } = await supabaseService
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .in('quest_id', questIds);

      if (userQuestsError && userQuestsError.code !== 'PGRST116') {
        throw userQuestsError;
      }

      // Merge quest progress
      const progressMap = new Map(
        (userQuests || []).map(uq => [uq.quest_id, uq])
      );

      const questsWithProgress = quests.map(quest => ({
        ...quest,
        progress: progressMap.get(quest.id)?.progress || {},
        completedCount: progressMap.get(quest.id)?.completed_count || 0,
        lastCompletedAt: progressMap.get(quest.id)?.last_completed_at || null
      }));

      return res.json({ success: true, data: questsWithProgress });
    }

    res.json({ success: true, data: quests || [] });
  } catch (error) {
    logger.error('Error fetching quests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quests' 
    });
  }
});

// Get leaderboard
router.get('/leaderboard/:period', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const period = req.params.period;
    
    if (!['all_time', 'monthly', 'weekly'].includes(period)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid period. Use: all_time, monthly, or weekly' 
      });
    }

    // Determine period start date
    let periodStart: Date;
    if (period === 'weekly') {
      periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodStart.getDay());
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart = new Date('2024-01-01');
    }

    const { data: leaderboard, error } = await supabaseService
      .from('leaderboards')
      .select(`
        *,
        user:auth.users!user_id(
          id,
          raw_user_meta_data
        )
      `)
      .eq('period_type', period)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .order('rank', { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    // Format the response
    const formattedLeaderboard = (leaderboard || []).map(entry => ({
      rank: entry.rank,
      userId: entry.user_id,
      username: entry.user?.raw_user_meta_data?.username || 'Anonymous',
      profilePicture: entry.user?.raw_user_meta_data?.profile_picture,
      points: entry.points,
      dinnersCount: entry.dinners_count,
      periodType: entry.period_type,
      periodStart: entry.period_start
    }));

    res.json({ success: true, data: formattedLeaderboard });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard' 
    });
  }
});

// Get point history
router.get('/points/history', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: transactions, error, count } = await supabaseService
      .from('point_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      data: transactions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    logger.error('Error fetching point history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch point history' 
    });
  }
});

// Get loyalty shop items
router.get('/loyalty/items', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const category = req.query.category as string;

    // Get user's tier
    const { data: userStats } = await supabaseService
      .from('user_stats')
      .select('current_tier, total_points')
      .eq('user_id', userId)
      .single();

    const userTier = userStats?.current_tier || 1;
    const userPoints = userStats?.total_points || 0;

    let query = supabaseService
      .from('loyalty_items')
      .select('*')
      .eq('active', true)
      .lte('tier_required', userTier)
      .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString());

    if (category) {
      query = query.eq('category', category);
    }

    const { data: items, error } = await query.order('points_cost', { ascending: true });

    if (error) {
      throw error;
    }

    // Add affordability info
    const itemsWithAffordability = (items || []).map(item => ({
      ...item,
      canAfford: userPoints >= item.points_cost
    }));

    res.json({ success: true, data: itemsWithAffordability });
  } catch (error) {
    logger.error('Error fetching loyalty items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch loyalty items' 
    });
  }
});

// Redeem loyalty item
router.post('/loyalty/redeem', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item ID required' 
      });
    }

    // Start a transaction
    // Get user stats and item details
    const { data: userStats, error: statsError } = await supabaseService
      .from('user_stats')
      .select('total_points, current_tier')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      throw statsError;
    }

    const { data: item, error: itemError } = await supabaseService
      .from('loyalty_items')
      .select('*')
      .eq('id', itemId)
      .eq('active', true)
      .single();

    if (itemError) {
      throw itemError;
    }

    // Validate redemption
    if (userStats.total_points < item.points_cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient points' 
      });
    }

    if (userStats.current_tier < item.tier_required) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tier requirement not met' 
      });
    }

    // Check stock
    if (!item.unlimited && item.stock_quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item out of stock' 
      });
    }

    // Generate redemption code
    const redemptionCode = `RDM${Date.now().toString(36).toUpperCase()}`;

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabaseService
      .from('loyalty_redemptions')
      .insert({
        user_id: userId,
        item_id: itemId,
        points_spent: item.points_cost,
        status: 'approved',
        redemption_code: redemptionCode,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: item.metadata
      })
      .select()
      .single();

    if (redemptionError) {
      throw redemptionError;
    }

    // Deduct points
    const { error: pointsError } = await supabaseService
      .from('user_stats')
      .update({ 
        total_points: userStats.total_points - item.points_cost 
      })
      .eq('user_id', userId);

    if (pointsError) {
      throw pointsError;
    }

    // Update stock if not unlimited
    if (!item.unlimited) {
      await supabaseService
        .from('loyalty_items')
        .update({ 
          stock_quantity: item.stock_quantity - 1 
        })
        .eq('id', itemId);
    }

    // Record point transaction
    await supabaseService
      .from('point_transactions')
      .insert({
        user_id: userId,
        action_type: 'loyalty_redemption',
        points: -item.points_cost,
        reference_id: redemption.id,
        reference_type: 'redemption',
        description: `Redeemed: ${item.name}`
      });

    res.json({ 
      success: true, 
      data: redemption,
      message: 'Item redeemed successfully'
    });
  } catch (error) {
    logger.error('Error redeeming loyalty item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to redeem item' 
    });
  }
});

// Get user's redemptions
router.get('/loyalty/redemptions', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const { data: redemptions, error } = await supabaseService
      .from('loyalty_redemptions')
      .select(`
        *,
        item:loyalty_items(*)
      `)
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: redemptions || [] });
  } catch (error) {
    logger.error('Error fetching redemptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch redemptions' 
    });
  }
});

// Award points (admin or system use)
router.post('/points/award', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, actionType, points, referenceId, referenceType } = req.body;

    if (!userId || !actionType) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and actionType required' 
      });
    }

    // Call the stored procedure to add points
    const { data, error } = await supabaseService.rpc('add_points_to_user', {
      p_user_id: userId,
      p_action_type: actionType,
      p_base_points: points,
      p_reference_id: referenceId,
      p_reference_type: referenceType
    });

    if (error) {
      throw error;
    }

    // Check for new achievements
    await supabaseService.rpc('check_achievements_for_user', {
      p_user_id: userId
    });

    res.json({ 
      success: true, 
      data: { pointsAwarded: data },
      message: 'Points awarded successfully'
    });
  } catch (error) {
    logger.error('Error awarding points:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to award points' 
    });
  }
});

// Update quest progress
router.post('/quests/progress', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { questId, action, value } = req.body;

    if (!questId || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'questId and action required' 
      });
    }

    // Get quest details
    const { data: quest, error: questError } = await supabaseService
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (questError) {
      throw questError;
    }

    // Get or create user quest record
    const { data: userQuest, error: _getError } = await supabaseService
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    const currentProgress = userQuest?.progress || {};
    
    // Update progress
    currentProgress[action] = (currentProgress[action] || 0) + (value || 1);

    // Check if quest is complete
    const isComplete = Object.entries(quest.criteria).every(([key, requiredValue]) => {
      return currentProgress[key] >= (requiredValue as number);
    });

    // Update or insert user quest
    if (userQuest) {
      const updateData: any = {
        progress: currentProgress,
        updated_at: new Date().toISOString()
      };

      if (isComplete && userQuest.completed_count < quest.max_completions) {
        updateData.completed_count = userQuest.completed_count + 1;
        updateData.last_completed_at = new Date().toISOString();
        
        // Reset progress for repeatable quests
        if (quest.type === 'daily' || quest.type === 'weekly') {
          updateData.progress = {};
        }
      }

      const { error: updateError } = await supabaseService
        .from('user_quests')
        .update(updateData)
        .eq('id', userQuest.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabaseService
        .from('user_quests')
        .insert({
          user_id: userId,
          quest_id: questId,
          progress: currentProgress,
          completed_count: isComplete ? 1 : 0,
          last_completed_at: isComplete ? new Date().toISOString() : null
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Award points if complete
    if (isComplete) {
      await supabaseService.rpc('add_points_to_user', {
        p_user_id: userId,
        p_action_type: 'quest_completed',
        p_base_points: quest.reward_points,
        p_reference_id: questId,
        p_reference_type: 'quest'
      });
    }

    res.json({ 
      success: true, 
      data: {
        progress: currentProgress,
        isComplete
      }
    });
  } catch (error) {
    logger.error('Error updating quest progress:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update quest progress' 
    });
  }
});

// Get user's streak
router.get('/streak', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    
    if (!privyUserId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    // Get the internal user ID from Privy ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user stats for streak information
    const { data: stats, error: statsError } = await supabaseService
      .from('user_stats')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userData.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    // If no stats, return default streak data
    if (!stats) {
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        currentStreak: stats.current_streak || 0,
        longestStreak: stats.longest_streak || 0,
        lastActivityDate: stats.last_activity_date
      }
    });
  } catch (error) {
    logger.error('Error fetching streak:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch streak' 
    });
  }
});

// Get tier benefits
router.get('/tiers', async (_req: AuthRequest, res: Response) => {
  try {
    const { data: tiers, error } = await supabaseService
      .from('tiers')
      .select('*')
      .order('tier_level', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: tiers || [] });
  } catch (error) {
    logger.error('Error fetching tiers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tiers' 
    });
  }
});

export default router;