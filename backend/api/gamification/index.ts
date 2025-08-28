import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const AddPointsSchema = z.object({
  userId: z.string().uuid(),
  actionType: z.enum([
    'dinner_attended',
    'dinner_hosted',
    'dinner_cancelled',
    'profile_completed',
    'first_dinner',
    'friend_referred',
    'review_posted',
    'photo_uploaded',
    'streak_maintained',
    'early_booking',
    'group_booking',
    'community_contribution'
  ]),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const RedeemLoyaltyItemSchema = z.object({
  userId: z.string().uuid(),
  itemId: z.string().uuid()
});

const UpdateQuestProgressSchema = z.object({
  userId: z.string().uuid(),
  questId: z.string().uuid(),
  progress: z.number().int().positive(),
  completed: z.boolean().optional()
});

const GetLeaderboardSchema = z.object({
  period: z.enum(['weekly', 'monthly', 'all_time']),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0)
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function verifyUserAuth(req: NextApiRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch {
    return null;
  }
}

async function handleApiError(error: any, res: NextApiResponse) {
  console.error('API Error:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
  
  if (error.code === 'PGRST116') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

// =====================================================
// API ENDPOINTS
// =====================================================

// POST /api/gamification/points/add
export async function addPoints(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Validate request body
    const body = AddPointsSchema.parse(req.body);
    
    // Verify user can add points (admin or same user for certain actions)
    const isAdmin = await checkUserAdmin(authUserId);
    const isSelfAction = authUserId === body.userId && 
                        ['profile_completed', 'review_posted', 'photo_uploaded'].includes(body.actionType);
    
    if (!isAdmin && !isSelfAction) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot add points for this action'
      });
    }

    // Call the secure backend function
    const { data, error } = await supabase.rpc('backend_add_points', {
      p_user_id: body.userId,
      p_action_type: body.actionType,
      p_points: null, // Let the function determine points based on rules
      p_reference_id: body.referenceId,
      p_reference_type: body.referenceType,
      p_description: `Points for ${body.actionType}`
    });

    if (error) {
      throw error;
    }

    // Send push notification for achievement unlocks
    if (data?.achievements_unlocked?.length > 0) {
      await sendAchievementNotifications(body.userId, data.achievements_unlocked);
    }

    return res.status(200).json({
      success: true,
      data: {
        transactionId: data.transaction_id,
        newTotalPoints: data.new_total_points,
        newTier: data.new_tier,
        achievementsUnlocked: data.achievements_unlocked || []
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// POST /api/gamification/loyalty/redeem
export async function redeemLoyaltyItem(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Validate request body
    const body = RedeemLoyaltyItemSchema.parse(req.body);
    
    // Verify user is redeeming for themselves
    if (authUserId !== body.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot redeem items for other users'
      });
    }

    // Call the secure backend function
    const { data, error } = await supabase.rpc('backend_redeem_loyalty_item', {
      p_user_id: body.userId,
      p_item_id: body.itemId
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      return res.status(400).json({
        success: false,
        error: data.error
      });
    }

    // Send confirmation notification
    await sendRedemptionNotification(body.userId, data.redemption_code);

    return res.status(200).json({
      success: true,
      data: {
        redemptionId: data.redemption_id,
        redemptionCode: data.redemption_code,
        remainingPoints: data.remaining_points
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// GET /api/gamification/stats/:userId
export async function getUserStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const userId = req.query.userId as string;

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    // Get user achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (achievementsError) {
      throw achievementsError;
    }

    // Get active quests
    const { data: quests, error: questsError } = await supabase
      .from('user_quests')
      .select(`
        *,
        quest:quests(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (questsError) {
      throw questsError;
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      throw transactionsError;
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: stats || {
          userId,
          totalPoints: 0,
          currentTier: 1,
          weeklyPoints: 0,
          monthlyPoints: 0,
          lifetimePoints: 0
        },
        achievements,
        activeQuests: quests,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// GET /api/gamification/leaderboard
export async function getLeaderboard(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Validate query parameters
    const query = GetLeaderboardSchema.parse(req.query);

    let column: string;
    switch (query.period) {
      case 'weekly':
        column = 'weekly_points';
        break;
      case 'monthly':
        column = 'monthly_points';
        break;
      default:
        column = 'lifetime_points';
    }

    // Get leaderboard
    const { data: leaderboard, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        ${column},
        current_tier,
        users:user_id(
          name,
          avatar_url
        )
      `)
      .order(column, { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (error) {
      throw error;
    }

    // Get current user's rank
    const { data: userRank, error: rankError } = await supabase
      .rpc('calculate_leaderboard_rank', {
        p_user_id: authUserId,
        p_period: query.period
      });

    if (rankError) {
      throw rankError;
    }

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: query.offset + index + 1,
          userId: entry.user_id,
          points: entry[column],
          tier: entry.current_tier,
          user: entry.users
        })),
        currentUserRank: userRank,
        period: query.period
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// POST /api/gamification/quests/update
export async function updateQuestProgress(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Validate request body
    const body = UpdateQuestProgressSchema.parse(req.body);
    
    // Verify admin or system role
    const isAdmin = await checkUserAdmin(authUserId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only admins can update quest progress'
      });
    }

    // Update quest progress
    const { data, error } = await supabase
      .from('user_quests')
      .update({
        progress_current: body.progress,
        status: body.completed ? 'completed' : 'active',
        completed_at: body.completed ? new Date().toISOString() : null
      })
      .eq('user_id', body.userId)
      .eq('quest_id', body.questId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If quest completed, award points
    if (body.completed) {
      const { data: quest } = await supabase
        .from('quests')
        .select('point_reward, name')
        .eq('id', body.questId)
        .single();

      if (quest?.point_reward) {
        await supabase.rpc('backend_add_points', {
          p_user_id: body.userId,
          p_action_type: 'quest_completed',
          p_points: quest.point_reward,
          p_reference_id: body.questId,
          p_reference_type: 'quest',
          p_description: `Completed quest: ${quest.name}`
        });

        // Send completion notification
        await sendQuestCompletionNotification(body.userId, quest.name, quest.point_reward);
      }
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// GET /api/gamification/loyalty/items
export async function getLoyaltyItems(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get user's tier
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('current_tier, total_points')
      .eq('user_id', authUserId)
      .single();

    const userTier = userStats?.current_tier || 1;
    const userPoints = userStats?.total_points || 0;

    // Get available loyalty items
    const { data: items, error } = await supabase
      .from('loyalty_items')
      .select('*')
      .eq('active', true)
      .lte('tier_required', userTier)
      .or('unlimited.eq.true,stock_quantity.gt.0')
      .order('points_cost', { ascending: true });

    if (error) {
      throw error;
    }

    // Add affordability flag
    const itemsWithAffordability = items.map(item => ({
      ...item,
      canAfford: userPoints >= item.points_cost,
      userPoints
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: itemsWithAffordability,
        userTier,
        userPoints
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// GET /api/gamification/achievements
export async function getAchievements(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authUserId = await verifyUserAuth(req);
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (achievementsError) {
      throw achievementsError;
    }

    // Get user's earned achievements
    const { data: userAchievements, error: userError } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', authUserId);

    if (userError) {
      throw userError;
    }

    const earnedMap = new Map(
      userAchievements.map(ua => [ua.achievement_id, ua.earned_at])
    );

    // Combine data
    const achievementsWithStatus = achievements.map(achievement => ({
      ...achievement,
      earned: earnedMap.has(achievement.id),
      earnedAt: earnedMap.get(achievement.id) || null
    }));

    return res.status(200).json({
      success: true,
      data: {
        achievements: achievementsWithStatus,
        totalEarned: userAchievements.length,
        totalAvailable: achievements.length
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function checkUserAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === 'admin';
}

async function sendAchievementNotifications(userId: string, achievements: any[]) {
  // This would integrate with your notification service
  console.log(`Sending achievement notifications to ${userId}:`, achievements);
}

async function sendRedemptionNotification(userId: string, redemptionCode: string) {
  // This would integrate with your notification service
  console.log(`Sending redemption notification to ${userId}: ${redemptionCode}`);
}

async function sendQuestCompletionNotification(userId: string, questName: string, points: number) {
  // This would integrate with your notification service
  console.log(`Quest completed notification for ${userId}: ${questName} (+${points} points)`);
}

// =====================================================
// API ROUTE HANDLER
// =====================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Route to appropriate handler based on path and method
  const { method } = req;
  const path = req.query.path as string[];

  if (!path || path.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Not found'
    });
  }

  // Points endpoints
  if (path[0] === 'points') {
    if (path[1] === 'add' && method === 'POST') {
      return addPoints(req, res);
    }
  }

  // Loyalty endpoints
  if (path[0] === 'loyalty') {
    if (path[1] === 'redeem' && method === 'POST') {
      return redeemLoyaltyItem(req, res);
    }
    if (path[1] === 'items' && method === 'GET') {
      return getLoyaltyItems(req, res);
    }
  }

  // Stats endpoints
  if (path[0] === 'stats' && path[1] && method === 'GET') {
    req.query.userId = path[1];
    return getUserStats(req, res);
  }

  // Leaderboard endpoint
  if (path[0] === 'leaderboard' && method === 'GET') {
    return getLeaderboard(req, res);
  }

  // Quest endpoints
  if (path[0] === 'quests') {
    if (path[1] === 'update' && method === 'POST') {
      return updateQuestProgress(req, res);
    }
  }

  // Achievements endpoint
  if (path[0] === 'achievements' && method === 'GET') {
    return getAchievements(req, res);
  }

  return res.status(404).json({
    success: false,
    error: 'Not found'
  });
}