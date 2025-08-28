export interface GamificationStats {
  userId: string;
  totalPoints: number;
  currentTier: number;
  currentTierName: string;
  pointsToNextTier: number;
  weeklyStreak: number;
  monthlyRank: number;
  allTimeRank: number;
  dinnersAttended: number;
  totalBadges: number;
  lastUpdated: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  type: PointTransactionType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type PointTransactionType = 
  | 'booking_completed'
  | 'early_bird'
  | 'group_bonus'
  | 'review_posted'
  | 'streak_bonus'
  | 'referral'
  | 'host_dinner'
  | 'achievement_unlocked'
  | 'loyalty_redemption'
  | 'penalty';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  category: AchievementCategory;
}

export type AchievementCategory = 
  | 'dining'
  | 'social'
  | 'exploration'
  | 'loyalty'
  | 'hosting'
  | 'special';

export interface Quest {
  id: string;
  title: string;
  description: string;
  tasks: QuestTask[];
  reward: QuestReward;
  expiresAt?: string;
  completedAt?: string;
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

export interface QuestTask {
  id: string;
  text: string;
  completed: boolean;
  points: number;
}

export interface QuestReward {
  points: number;
  badge?: string;
  loyaltyTokens?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  dinnersAttended?: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  dinners: LeaderboardEntry[];
  points: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  lastUpdated: string;
}

export interface LoyaltyItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'discount' | 'experience' | 'merchandise' | 'charity';
  imageUrl?: string;
  available: boolean;
  expiresAt?: string;
}

export interface TierBenefit {
  tier: number;
  name: string;
  benefits: string[];
  pointsRequired: number;
  color: string;
  icon: string;
}

export const TIER_CONFIG: TierBenefit[] = [
  {
    tier: 1,
    name: 'Newcomer',
    benefits: ['Access to events', 'Basic support'],
    pointsRequired: 0,
    color: '#9CA3AF',
    icon: 'seedling',
  },
  {
    tier: 2,
    name: 'Regular',
    benefits: ['5% point bonus', 'Priority waitlist'],
    pointsRequired: 100,
    color: '#10B981',
    icon: 'leaf',
  },
  {
    tier: 3,
    name: 'Enthusiast',
    benefits: ['10% point bonus', 'Early access to events', 'Monthly surprise'],
    pointsRequired: 500,
    color: '#3B82F6',
    icon: 'star',
  },
  {
    tier: 4,
    name: 'Gourmand',
    benefits: ['15% point bonus', 'Restaurant discounts', 'VIP support', 'Exclusive events'],
    pointsRequired: 1500,
    color: '#8B5CF6',
    icon: 'crown',
  },
  {
    tier: 5,
    name: 'Connoisseur',
    benefits: ['20% point bonus', 'Free monthly dinner', 'Personal concierge', 'Partner perks'],
    pointsRequired: 4000,
    color: '#F59E0B',
    icon: 'gem',
  },
];

export const POINT_RULES = {
  BOOKING_COMPLETED: 50,
  EARLY_BIRD: 10,
  GROUP_BONUS_PER_GUEST: 5,
  REVIEW_POSTED: 20,
  WEEKLY_STREAK: 50,
  REFERRAL_SUCCESS: 100,
  HOST_DINNER: 100,
  FIRST_DINNER: 25,
  ACHIEVEMENT_BASE: 25,
} as const;

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  weeklyPoints: number;
  nextMilestone: number;
  lastActivityDate: string;
}