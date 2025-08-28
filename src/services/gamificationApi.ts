import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// =====================================================
// TYPES
// =====================================================

export interface UserStats {
  userId: string;
  totalPoints: number;
  currentTier: number;
  weeklyPoints: number;
  monthlyPoints: number;
  lifetimePoints: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  pointsReward: number;
  category: string;
  tier: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  pointReward: number;
  tierRequired: number;
  progressTarget: number;
  progressCurrent: number;
  status: 'active' | 'completed' | 'expired';
  startedAt: string;
  completedAt: string | null;
}

export interface LoyaltyItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  tierRequired: number;
  imageUrl?: string;
  canAfford: boolean;
  stockQuantity?: number;
  unlimited: boolean;
}

export interface PointTransaction {
  id: string;
  userId: string;
  actionType: string;
  points: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  points: number;
  tier: number;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

export interface RedemptionResponse {
  redemptionId: string;
  redemptionCode: string;
  remainingPoints: number;
}

export type ActionType =
  | 'dinner_attended'
  | 'dinner_hosted'
  | 'dinner_cancelled'
  | 'profile_completed'
  | 'first_dinner'
  | 'friend_referred'
  | 'review_posted'
  | 'photo_uploaded'
  | 'streak_maintained'
  | 'early_booking'
  | 'group_booking'
  | 'community_contribution';

// =====================================================
// API CLIENT
// =====================================================

class GamificationAPI {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    const baseURL = Platform.select({
      ios: Constants.expoConfig?.extra?.apiUrl,
      android: Constants.expoConfig?.extra?.apiUrl,
      default: 'http://localhost:3000',
    });

    this.client = axios.create({
      baseURL: `${baseURL}/api/gamification`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.authToken) {
          this.authToken = await AsyncStorage.getItem('auth_token');
        }
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear and redirect to login
          await this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // =====================================================
  // POINTS MANAGEMENT
  // =====================================================

  async addPoints(
    userId: string,
    actionType: ActionType,
    referenceId?: string,
    referenceType?: string,
    metadata?: Record<string, any>
  ): Promise<{
    transactionId: string;
    newTotalPoints: number;
    newTier: number;
    achievementsUnlocked: any[];
  }> {
    const response = await this.client.post('/points/add', {
      userId,
      actionType,
      referenceId,
      referenceType,
      metadata,
    });
    return response.data.data;
  }

  async getUserStats(userId: string): Promise<{
    stats: UserStats;
    achievements: Achievement[];
    activeQuests: Quest[];
    recentTransactions: PointTransaction[];
  }> {
    const response = await this.client.get(`/stats/${userId}`);
    return response.data.data;
  }

  // =====================================================
  // LEADERBOARD
  // =====================================================

  async getLeaderboard(
    period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
    period: string;
  }> {
    const response = await this.client.get('/leaderboard', {
      params: { period, limit, offset },
    });
    return response.data.data;
  }

  // =====================================================
  // ACHIEVEMENTS
  // =====================================================

  async getAchievements(): Promise<{
    achievements: Achievement[];
    totalEarned: number;
    totalAvailable: number;
  }> {
    const response = await this.client.get('/achievements');
    return response.data.data;
  }

  // =====================================================
  // QUESTS
  // =====================================================

  async updateQuestProgress(
    userId: string,
    questId: string,
    progress: number,
    completed?: boolean
  ): Promise<Quest> {
    const response = await this.client.post('/quests/update', {
      userId,
      questId,
      progress,
      completed,
    });
    return response.data.data;
  }

  // =====================================================
  // LOYALTY PROGRAM
  // =====================================================

  async getLoyaltyItems(): Promise<{
    items: LoyaltyItem[];
    userTier: number;
    userPoints: number;
  }> {
    const response = await this.client.get('/loyalty/items');
    return response.data.data;
  }

  async redeemLoyaltyItem(
    userId: string,
    itemId: string
  ): Promise<RedemptionResponse> {
    const response = await this.client.post('/loyalty/redeem', {
      userId,
      itemId,
    });
    return response.data.data;
  }

  // =====================================================
  // EVENT TRACKING HELPERS
  // =====================================================

  async trackDinnerAttended(
    userId: string,
    eventId: string
  ): Promise<void> {
    await this.addPoints(
      userId,
      'dinner_attended',
      eventId,
      'event'
    );
  }

  async trackDinnerHosted(
    userId: string,
    eventId: string
  ): Promise<void> {
    await this.addPoints(
      userId,
      'dinner_hosted',
      eventId,
      'event'
    );
  }

  async trackProfileCompleted(userId: string): Promise<void> {
    await this.addPoints(
      userId,
      'profile_completed',
      userId,
      'user'
    );
  }

  async trackReviewPosted(
    userId: string,
    reviewId: string
  ): Promise<void> {
    await this.addPoints(
      userId,
      'review_posted',
      reviewId,
      'review'
    );
  }

  async trackPhotoUploaded(
    userId: string,
    photoId: string
  ): Promise<void> {
    await this.addPoints(
      userId,
      'photo_uploaded',
      photoId,
      'photo'
    );
  }

  async trackStreakMaintained(
    userId: string,
    streakDays: number
  ): Promise<void> {
    await this.addPoints(
      userId,
      'streak_maintained',
      streakDays.toString(),
      'streak',
      { streakDays }
    );
  }

  async trackFriendReferred(
    userId: string,
    referredUserId: string
  ): Promise<void> {
    await this.addPoints(
      userId,
      'friend_referred',
      referredUserId,
      'referral'
    );
  }

  async trackEarlyBooking(
    userId: string,
    bookingId: string,
    daysInAdvance: number
  ): Promise<void> {
    await this.addPoints(
      userId,
      'early_booking',
      bookingId,
      'booking',
      { daysInAdvance }
    );
  }

  async trackGroupBooking(
    userId: string,
    bookingId: string,
    groupSize: number
  ): Promise<void> {
    await this.addPoints(
      userId,
      'group_booking',
      bookingId,
      'booking',
      { groupSize }
    );
  }

  // =====================================================
  // CACHING
  // =====================================================

  private cacheKey(key: string): string {
    return `gamification_cache_${key}`;
  }

  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey(key));
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch {
      // Cache read failed, continue to fetch
    }

    const data = await fetcher();
    
    try {
      await AsyncStorage.setItem(
        this.cacheKey(key),
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Cache write failed, not critical
    }

    return data;
  }

  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('gamification_cache_'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }
}

// Export singleton instance
export const gamificationApi = new GamificationAPI();