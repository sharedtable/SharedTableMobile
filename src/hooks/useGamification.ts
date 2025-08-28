import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useGamificationStore } from '@/store/gamificationStore';
import type { 
  GamificationStats, 
  Achievement, 
  Quest,
  PointTransaction,
  LoyaltyItem,
  StreakInfo
} from '@/types/gamification';

export const useGamificationStats = () => {
  const { setStats, setLoading, setError } = useGamificationStore();
  
  const query = useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const response = await api.getGamificationStats();
      if (!response.success) throw new Error(response.error);
      return response.data as GamificationStats;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setStats(query.data);
    }
    if (query.error) {
      setError(query.error.message);
    }
    setLoading(query.isLoading);
  }, [query.data, query.error, query.isLoading, setStats, setError, setLoading]);

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useAchievements = () => {
  const { setAchievements, unlockAchievement } = useGamificationStore();
  
  const query = useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: async () => {
      const response = await api.getAchievements();
      if (!response.success) throw new Error(response.error);
      return response.data as Achievement[];
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.data) {
      setAchievements(query.data);
    }
  }, [query.data, setAchievements]);

  const trackProgress = useCallback(async (achievementId: string, progress: number) => {
    try {
      const response = await api.trackAchievementProgress(achievementId, progress);
      if (response.success && response.data?.unlockedAt) {
        unlockAchievement(achievementId);
      }
    } catch (error) {
      console.error('Failed to track achievement progress:', error);
    }
  }, [unlockAchievement]);

  return {
    achievements: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    trackProgress,
    refetch: query.refetch,
  };
};

export const useQuests = (type?: 'daily' | 'weekly' | 'biweekly' | 'monthly') => {
  const { setQuests, completeQuestTask, updatePoints } = useGamificationStore();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['gamification', 'quests', type],
    queryFn: async () => {
      const response = await api.getQuests(type);
      if (!response.success) throw new Error(response.error);
      return response.data as Quest[];
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.data) {
      setQuests(query.data);
    }
  }, [query.data, setQuests]);

  const completeTask = useMutation({
    mutationFn: async ({ questId, taskId }: { questId: string; taskId: string }) => {
      const response = await api.completeQuestTask(questId, taskId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data, variables) => {
      completeQuestTask(variables.questId, variables.taskId);
      if (data?.pointsEarned) {
        updatePoints(data.pointsEarned);
      }
      queryClient.invalidateQueries({ queryKey: ['gamification', 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
    },
  });

  return {
    quests: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    completeTask: completeTask.mutate,
    isCompletingTask: completeTask.isPending,
    refetch: query.refetch,
  };
};

export const useLeaderboard = () => {
  const { setLeaderboard } = useGamificationStore();
  
  const fetchLeaderboard = useCallback(async (type: 'dinners' | 'points' | 'monthly' = 'points') => {
    try {
      const response = await api.getLeaderboard(type);
      if (response.success && response.data) {
        setLeaderboard(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      throw error;
    }
  }, [setLeaderboard]);

  const query = useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: () => fetchLeaderboard('points'),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    leaderboard: query.data,
    isLoading: query.isLoading,
    error: query.error,
    fetchLeaderboard,
    refetch: query.refetch,
  };
};

export const usePointTransactions = () => {
  const { addTransaction } = useGamificationStore();
  
  const query = useQuery({
    queryKey: ['gamification', 'transactions'],
    queryFn: async () => {
      const response = await api.getPointTransactions(50);
      if (!response.success) throw new Error(response.error);
      return response.data as PointTransaction[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      // Add only the most recent transaction to the store
      addTransaction(query.data[0]);
    }
  }, [query.data, addTransaction]);

  return {
    transactions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useLoyaltyShop = () => {
  const queryClient = useQueryClient();
  const { updatePoints } = useGamificationStore();
  
  const query = useQuery({
    queryKey: ['gamification', 'loyalty', 'items'],
    queryFn: async () => {
      const response = await api.getLoyaltyShopItems();
      if (!response.success) throw new Error(response.error);
      return response.data as LoyaltyItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const redeemItem = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.redeemLoyaltyItem(itemId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.remainingPoints !== undefined) {
        // Update points in store (negative to subtract)
        const currentStats = queryClient.getQueryData(['gamification', 'stats']) as GamificationStats;
        if (currentStats) {
          const pointsUsed = currentStats.totalPoints - data.remainingPoints;
          updatePoints(-pointsUsed);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'loyalty'] });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    redeemItem: redeemItem.mutate,
    isRedeeming: redeemItem.isPending,
    refetch: query.refetch,
  };
};

export const useStreak = () => {
  const { setStreakInfo, incrementStreak, updatePoints } = useGamificationStore();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: async () => {
      const response = await api.getStreakInfo();
      if (!response.success) throw new Error(response.error);
      return response.data as StreakInfo;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.data) {
      setStreakInfo(query.data);
    }
  }, [query.data, setStreakInfo]);

  const claimBonus = useMutation({
    mutationFn: async () => {
      const response = await api.claimStreakBonus();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        incrementStreak();
        if (data.pointsEarned) {
          updatePoints(data.pointsEarned);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['gamification', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
    },
  });

  return {
    streakInfo: query.data,
    isLoading: query.isLoading,
    error: query.error,
    claimBonus: claimBonus.mutate,
    isClaiming: claimBonus.isPending,
    refetch: query.refetch,
  };
};

export const useGamificationSync = () => {
  const { 
    stats, 
    isLoading: storeLoading,
  } = useGamificationStore((state) => ({
    stats: state.stats,
    isLoading: state.isLoading,
  }));

  const { refetch: refetchStats } = useGamificationStats();
  const { refetch: refetchAchievements } = useAchievements();
  const { refetch: refetchQuests } = useQuests();
  const { refetch: refetchStreak } = useStreak();

  const syncAll = useCallback(async () => {
    try {
      await Promise.all([
        refetchStats(),
        refetchAchievements(),
        refetchQuests(),
        refetchStreak(),
      ]);
    } catch (error) {
      console.error('Failed to sync gamification data:', error);
    }
  }, [refetchStats, refetchAchievements, refetchQuests, refetchStreak]);

  useEffect(() => {
    // Sync on mount
    syncAll();
  }, []);

  return {
    stats,
    isLoading: storeLoading,
    syncAll,
  };
};