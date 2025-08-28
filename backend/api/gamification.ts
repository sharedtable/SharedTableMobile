/**
 * Gamification API Endpoints
 * 
 * This file implements all gamification-related API endpoints for SharedTable
 * including points, achievements, quests, leaderboards, and loyalty shop
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// Types and Schemas
// ============================================================================

const ApiResponse = <T>(success: boolean, data?: T, error?: string) => ({
  success,
  data,
  error,
});

// ============================================================================
// Helper Functions
// ============================================================================

async function getUserFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

async function executeQuery(query: string, params: any[] = []) {
  return prisma.$queryRawUnsafe(query, ...params);
}

// ============================================================================
// Main Stats Endpoint
// ============================================================================

export async function getGamificationStats(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  try {
    // Get user stats
    const stats = await prisma.$queryRaw`
      SELECT 
        s.*,
        CASE 
          WHEN s.current_tier < 5 THEN (
            SELECT points_required FROM (
              VALUES (1, 0), (2, 100), (3, 500), (4, 1500), (5, 4000)
            ) AS tiers(tier, points_required)
            WHERE tier = s.current_tier + 1
          ) - s.total_points
          ELSE 0
        END AS points_to_next_tier,
        CASE
          WHEN s.current_tier = 1 THEN 'Newcomer'
          WHEN s.current_tier = 2 THEN 'Regular'
          WHEN s.current_tier = 3 THEN 'Enthusiast'
          WHEN s.current_tier = 4 THEN 'Gourmand'
          WHEN s.current_tier = 5 THEN 'Connoisseur'
        END AS current_tier_name,
        COALESCE(lp.rank, 9999) AS all_time_rank,
        COALESCE(lm.rank, 9999) AS monthly_rank,
        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.unlocked_at IS NOT NULL) AS total_badges
      FROM user_gamification_stats s
      LEFT JOIN leaderboard_cache lp ON s.user_id = lp.user_id AND lp.leaderboard_type = 'points'
      LEFT JOIN leaderboard_cache lm ON s.user_id = lm.user_id 
        AND lm.leaderboard_type = 'monthly' 
        AND lm.period_start = DATE_TRUNC('month', CURRENT_DATE)
      LEFT JOIN user_achievements ua ON s.user_id = ua.user_id
      WHERE s.user_id = ${user.id}
      GROUP BY s.id, s.user_id, s.total_points, s.current_tier, s.dinners_attended,
               s.dinners_hosted, s.reviews_posted, s.referrals_successful,
               s.total_points_earned, s.total_points_spent, s.created_at, s.updated_at,
               lp.rank, lm.rank
    `;

    if (!stats || stats.length === 0) {
      // Initialize user if not exists
      await executeQuery('SELECT initialize_user_gamification($1)', [user.id]);
      
      // Return default stats
      return res.status(200).json(ApiResponse(true, {
        userId: user.id,
        totalPoints: 0,
        currentTier: 1,
        currentTierName: 'Newcomer',
        pointsToNextTier: 100,
        weeklyStreak: 0,
        monthlyRank: 9999,
        allTimeRank: 9999,
        dinnersAttended: 0,
        totalBadges: 0,
        lastUpdated: new Date().toISOString(),
      }));
    }

    return res.status(200).json(ApiResponse(true, {
      ...stats[0],
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch stats'));
  }
}

// ============================================================================
// Achievements Endpoints
// ============================================================================

export async function getAchievements(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  try {
    const achievements = await prisma.$queryRaw`
      SELECT 
        a.*,
        COALESCE(ua.current_progress, 0) AS progress,
        ua.unlocked_at,
        a.max_progress
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${user.id}
      WHERE a.is_active = true
      ORDER BY 
        CASE WHEN ua.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
        a.category,
        a.points DESC
    `;

    return res.status(200).json(ApiResponse(true, achievements));
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch achievements'));
  }
}

export async function trackAchievementProgress(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { achievementId } = req.query;
  const { progress } = req.body;

  try {
    // Update achievement progress
    await prisma.$queryRaw`
      INSERT INTO user_achievements (user_id, achievement_id, current_progress)
      VALUES (${user.id}, ${achievementId}, ${progress})
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET 
        current_progress = ${progress},
        updated_at = NOW()
    `;

    // Check if achievement should be unlocked
    await executeQuery('SELECT check_achievements_for_user($1)', [user.id]);

    // Get updated achievement
    const achievement = await prisma.$queryRaw`
      SELECT 
        a.*,
        ua.current_progress AS progress,
        ua.unlocked_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE a.id = ${achievementId} AND ua.user_id = ${user.id}
    `;

    return res.status(200).json(ApiResponse(true, achievement[0]));
  } catch (error) {
    console.error('Error tracking achievement progress:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to track progress'));
  }
}

// ============================================================================
// Quest Endpoints
// ============================================================================

export async function getQuests(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { type } = req.query;

  try {
    // Get active quests for user
    const quests = await prisma.$queryRaw`
      SELECT 
        q.id,
        qt.name AS title,
        qt.description,
        qt.quest_type AS type,
        q.expires_at,
        q.completed_at,
        CASE 
          WHEN q.completed_at IS NOT NULL THEN qt.total_points
          ELSE 0
        END AS points_earned,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', t.id,
            'text', t.task_text,
            'points', t.points,
            'completed', COALESCE(qp.completed, false)
          ) ORDER BY t.order_index
        ) AS tasks
      FROM user_quests q
      JOIN quest_templates qt ON q.quest_template_id = qt.id
      JOIN quest_tasks t ON qt.id = t.quest_template_id
      LEFT JOIN user_quest_progress qp ON q.id = qp.user_quest_id AND t.id = qp.quest_task_id
      WHERE q.user_id = ${user.id}
        AND q.expires_at > NOW()
        ${type ? `AND qt.quest_type = ${type}` : ''}
      GROUP BY q.id, qt.name, qt.description, qt.quest_type, qt.total_points, q.expires_at, q.completed_at
      ORDER BY q.expires_at ASC
    `;

    // If no active quests, create new ones
    if (quests.length === 0) {
      await createQuestsForUser(user.id, type as string);
      return getQuests(req, res); // Recursive call to get newly created quests
    }

    return res.status(200).json(ApiResponse(true, quests));
  } catch (error) {
    console.error('Error fetching quests:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch quests'));
  }
}

export async function completeQuestTask(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { questId, taskId } = req.query;

  try {
    // Mark task as completed
    await prisma.$queryRaw`
      UPDATE user_quest_progress
      SET completed = true, completed_at = NOW()
      WHERE user_quest_id = ${questId}
      AND quest_task_id = ${taskId}
      AND user_quest_id IN (
        SELECT id FROM user_quests WHERE user_id = ${user.id}
      )
    `;

    // Check if all tasks are completed
    const questStatus = await prisma.$queryRaw`
      SELECT 
        COUNT(*) FILTER (WHERE qp.completed = true) AS completed_tasks,
        COUNT(*) AS total_tasks,
        SUM(t.points) FILTER (WHERE qp.completed = true) AS points_earned
      FROM user_quests q
      JOIN quest_templates qt ON q.quest_template_id = qt.id
      JOIN quest_tasks t ON qt.id = t.quest_template_id
      LEFT JOIN user_quest_progress qp ON q.id = qp.user_quest_id AND t.id = qp.quest_task_id
      WHERE q.id = ${questId} AND q.user_id = ${user.id}
    `;

    const status = questStatus[0];
    let totalPointsEarned = status.points_earned || 0;

    // If all tasks completed, mark quest as completed and award bonus
    if (status.completed_tasks === status.total_tasks) {
      await prisma.$queryRaw`
        UPDATE user_quests
        SET completed_at = NOW()
        WHERE id = ${questId} AND user_id = ${user.id}
      `;

      // Award quest completion bonus
      const questBonus = await prisma.$queryRaw`
        SELECT total_points FROM quest_templates
        WHERE id = (SELECT quest_template_id FROM user_quests WHERE id = ${questId})
      `;

      if (questBonus[0]) {
        await executeQuery(
          'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
          [user.id, questBonus[0].total_points, 'quest_completed', 'Quest completed', questId, 'quest']
        );
        totalPointsEarned = questBonus[0].total_points;
      }
    }

    // Get updated quest
    const updatedQuest = await getQuestById(questId as string, user.id);

    return res.status(200).json(ApiResponse(true, {
      quest: updatedQuest,
      pointsEarned: totalPointsEarned,
    }));
  } catch (error) {
    console.error('Error completing quest task:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to complete task'));
  }
}

// ============================================================================
// Leaderboard Endpoints
// ============================================================================

export async function getLeaderboard(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { type = 'points' } = req.query;

  try {
    // Update leaderboard cache
    await executeQuery('SELECT update_leaderboard_cache()');

    // Get leaderboard data
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        lc.rank,
        lc.user_id,
        u.name AS user_name,
        u.image AS user_avatar,
        lc.value AS ${type === 'dinners' ? 'dinners_attended' : 'points'},
        CASE WHEN lc.user_id = ${user.id} THEN true ELSE false END AS is_current_user
      FROM leaderboard_cache lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.leaderboard_type = ${type}
        ${type === 'monthly' ? `AND lc.period_start = DATE_TRUNC('month', CURRENT_DATE)` : ''}
      ORDER BY lc.rank
      LIMIT 100
    `;

    // Format response based on type
    const formattedData = {
      [type as string]: leaderboard.map((entry: any) => ({
        rank: entry.rank,
        userId: entry.user_id,
        userName: entry.user_name,
        userAvatar: entry.user_avatar,
        points: entry.points || 0,
        dinnersAttended: entry.dinners_attended || 0,
        isCurrentUser: entry.is_current_user,
      })),
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json(ApiResponse(true, formattedData));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch leaderboard'));
  }
}

// ============================================================================
// Point Transaction Endpoints
// ============================================================================

export async function getPointTransactions(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { limit = 50 } = req.query;

  try {
    const transactions = await prisma.$queryRaw`
      SELECT 
        id,
        user_id,
        points,
        transaction_type AS type,
        description,
        metadata,
        created_at
      FROM point_transactions
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit as string)}
    `;

    return res.status(200).json(ApiResponse(true, transactions));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch transactions'));
  }
}

// ============================================================================
// Loyalty Shop Endpoints
// ============================================================================

export async function getLoyaltyShopItems(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  try {
    const items = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        description,
        cost,
        category,
        image_url,
        available,
        stock_quantity,
        expires_at
      FROM loyalty_items
      WHERE available = true OR expires_at > NOW()
      ORDER BY 
        CASE 
          WHEN category = 'discount' THEN 1
          WHEN category = 'experience' THEN 2
          WHEN category = 'merchandise' THEN 3
          WHEN category = 'charity' THEN 4
        END,
        cost ASC
    `;

    return res.status(200).json(ApiResponse(true, items));
  } catch (error) {
    console.error('Error fetching loyalty items:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch items'));
  }
}

export async function redeemLoyaltyItem(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  const { itemId } = req.query;

  try {
    // Check item availability and user points
    const validation = await prisma.$queryRaw`
      SELECT 
        li.id,
        li.name,
        li.cost,
        li.available,
        li.stock_quantity,
        s.total_points AS user_points
      FROM loyalty_items li
      CROSS JOIN user_gamification_stats s
      WHERE li.id = ${itemId}
        AND s.user_id = ${user.id}
    `;

    if (!validation[0]) {
      return res.status(404).json(ApiResponse(false, null, 'Item not found'));
    }

    const item = validation[0];

    if (!item.available) {
      return res.status(400).json(ApiResponse(false, null, 'Item not available'));
    }

    if (item.user_points < item.cost) {
      return res.status(400).json(ApiResponse(false, null, 'Insufficient points'));
    }

    if (item.stock_quantity !== null && item.stock_quantity <= 0) {
      return res.status(400).json(ApiResponse(false, null, 'Item out of stock'));
    }

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      // Deduct points
      await executeQuery(
        'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
        [user.id, -item.cost, 'loyalty_redemption', `Redeemed: ${item.name}`, itemId, 'loyalty_item']
      );

      // Create redemption record
      const redemptionCode = generateRedemptionCode();
      await tx.$queryRaw`
        INSERT INTO loyalty_redemptions (user_id, item_id, points_spent, redemption_code)
        VALUES (${user.id}, ${itemId}, ${item.cost}, ${redemptionCode})
      `;

      // Update stock if applicable
      if (item.stock_quantity !== null) {
        await tx.$queryRaw`
          UPDATE loyalty_items
          SET stock_quantity = stock_quantity - 1
          WHERE id = ${itemId}
        `;
      }
    });

    // Get updated points
    const updatedStats = await prisma.$queryRaw`
      SELECT total_points FROM user_gamification_stats WHERE user_id = ${user.id}
    `;

    return res.status(200).json(ApiResponse(true, {
      success: true,
      remainingPoints: updatedStats[0].total_points,
    }));
  } catch (error) {
    console.error('Error redeeming item:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to redeem item'));
  }
}

// ============================================================================
// Streak Endpoints
// ============================================================================

export async function getStreakInfo(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  try {
    const streakInfo = await prisma.$queryRaw`
      SELECT 
        current_streak,
        longest_streak,
        weekly_points_earned AS weekly_points,
        next_milestone,
        last_activity_date
      FROM user_streaks
      WHERE user_id = ${user.id}
    `;

    if (!streakInfo[0]) {
      // Initialize streak for user
      await prisma.$queryRaw`
        INSERT INTO user_streaks (user_id)
        VALUES (${user.id})
        ON CONFLICT (user_id) DO NOTHING
      `;

      return res.status(200).json(ApiResponse(true, {
        currentStreak: 0,
        longestStreak: 0,
        weeklyPoints: 0,
        nextMilestone: 3,
        lastActivityDate: null,
      }));
    }

    return res.status(200).json(ApiResponse(true, streakInfo[0]));
  } catch (error) {
    console.error('Error fetching streak info:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to fetch streak info'));
  }
}

export async function claimStreakBonus(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) {
    return res.status(401).json(ApiResponse(false, null, 'Unauthorized'));
  }

  try {
    // Check if eligible for streak bonus
    const streakInfo = await prisma.$queryRaw`
      SELECT 
        current_streak,
        last_activity_week,
        last_activity_year
      FROM user_streaks
      WHERE user_id = ${user.id}
    `;

    if (!streakInfo[0]) {
      return res.status(400).json(ApiResponse(false, null, 'No streak found'));
    }

    const currentWeek = new Date().getWeek();
    const currentYear = new Date().getFullYear();

    // Check if already claimed this week
    if (streakInfo[0].last_activity_week === currentWeek && 
        streakInfo[0].last_activity_year === currentYear) {
      return res.status(400).json(ApiResponse(false, null, 'Already claimed this week'));
    }

    // Award streak bonus
    const bonusPoints = 50; // Base weekly streak bonus
    await executeQuery(
      'SELECT add_points_to_user($1, $2, $3, $4)',
      [user.id, bonusPoints, 'weekly_streak', 'Weekly streak bonus']
    );

    // Update streak
    await prisma.$queryRaw`
      UPDATE user_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = CURRENT_DATE,
        last_activity_week = ${currentWeek},
        last_activity_year = ${currentYear},
        weekly_points_earned = weekly_points_earned + ${bonusPoints},
        total_streak_bonuses_claimed = total_streak_bonuses_claimed + 1
      WHERE user_id = ${user.id}
    `;

    return res.status(200).json(ApiResponse(true, {
      pointsEarned: bonusPoints,
      newStreak: streakInfo[0].current_streak + 1,
    }));
  } catch (error) {
    console.error('Error claiming streak bonus:', error);
    return res.status(500).json(ApiResponse(false, null, 'Failed to claim bonus'));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function createQuestsForUser(userId: string, questType?: string) {
  // Logic to create new quests for user based on type
  const templates = await prisma.$queryRaw`
    SELECT * FROM quest_templates 
    WHERE is_active = true 
    ${questType ? `AND quest_type = ${questType}` : ''}
  `;

  for (const template of templates as any[]) {
    const expiresAt = calculateQuestExpiry(template.quest_type);
    
    await prisma.$queryRaw`
      INSERT INTO user_quests (user_id, quest_template_id, expires_at)
      VALUES (${userId}, ${template.id}, ${expiresAt})
    `;
  }
}

async function getQuestById(questId: string, userId: string) {
  const quest = await prisma.$queryRaw`
    SELECT 
      q.id,
      qt.name AS title,
      qt.description,
      qt.quest_type AS type,
      q.expires_at,
      q.completed_at,
      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'id', t.id,
          'text', t.task_text,
          'points', t.points,
          'completed', COALESCE(qp.completed, false)
        ) ORDER BY t.order_index
      ) AS tasks
    FROM user_quests q
    JOIN quest_templates qt ON q.quest_template_id = qt.id
    JOIN quest_tasks t ON qt.id = t.quest_template_id
    LEFT JOIN user_quest_progress qp ON q.id = qp.user_quest_id AND t.id = qp.quest_task_id
    WHERE q.id = ${questId} AND q.user_id = ${userId}
    GROUP BY q.id, qt.name, qt.description, qt.quest_type, q.expires_at, q.completed_at
  `;

  return quest[0];
}

function calculateQuestExpiry(questType: string): Date {
  const now = new Date();
  switch (questType) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'biweekly':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth;
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

function generateRedemptionCode(): string {
  return 'RDM' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Add getWeek method to Date prototype for week calculation
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

// ============================================================================
// Event Handlers for Point Awards
// ============================================================================

export async function onBookingCompleted(userId: string, bookingId: string, guestCount: number) {
  // Award base points
  await executeQuery(
    'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
    [userId, 50, 'booking_completed', 'Dinner booking completed', bookingId, 'booking']
  );

  // Award group bonus
  if (guestCount > 1) {
    const groupBonus = (guestCount - 1) * 5;
    await executeQuery(
      'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
      [userId, groupBonus, 'group_bonus', `Group bonus for ${guestCount} guests`, bookingId, 'booking']
    );
  }

  // Update stats
  await prisma.$queryRaw`
    UPDATE user_gamification_stats
    SET dinners_attended = dinners_attended + 1
    WHERE user_id = ${userId}
  `;

  // Check achievements
  await executeQuery('SELECT check_achievements_for_user($1)', [userId]);
}

export async function onReviewPosted(userId: string, reviewId: string) {
  // Award points
  await executeQuery(
    'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
    [userId, 20, 'review_posted', 'Review posted', reviewId, 'review']
  );

  // Update stats
  await prisma.$queryRaw`
    UPDATE user_gamification_stats
    SET reviews_posted = reviews_posted + 1
    WHERE user_id = ${userId}
  `;

  // Check achievements
  await executeQuery('SELECT check_achievements_for_user($1)', [userId]);
}

export async function onReferralSuccess(referrerId: string, referredUserId: string) {
  // Award points to referrer
  await executeQuery(
    'SELECT add_points_to_user($1, $2, $3, $4, $5, $6)',
    [referrerId, 100, 'referral_success', 'Successful referral', referredUserId, 'referral']
  );

  // Update stats
  await prisma.$queryRaw`
    UPDATE user_gamification_stats
    SET referrals_successful = referrals_successful + 1
    WHERE user_id = ${referrerId}
  `;

  // Award first-timer bonus to referred user
  await executeQuery(
    'SELECT add_points_to_user($1, $2, $3, $4)',
    [referredUserId, 25, 'first_dinner', 'Welcome bonus']
  );

  // Check achievements for both users
  await executeQuery('SELECT check_achievements_for_user($1)', [referrerId]);
  await executeQuery('SELECT check_achievements_for_user($1)', [referredUserId]);
}