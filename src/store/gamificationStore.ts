import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  GamificationStats, 
  Achievement, 
  Quest, 
  LeaderboardData,
  PointTransaction,
  StreakInfo 
} from '@/types/gamification';

interface GamificationState {
  stats: GamificationStats | null;
  achievements: Achievement[];
  quests: Quest[];
  leaderboard: LeaderboardData | null;
  recentTransactions: PointTransaction[];
  streakInfo: StreakInfo | null;
  isLoading: boolean;
  error: string | null;
  
  setStats: (stats: GamificationStats) => void;
  updatePoints: (points: number) => void;
  setAchievements: (achievements: Achievement[]) => void;
  unlockAchievement: (achievementId: string) => void;
  setQuests: (quests: Quest[]) => void;
  completeQuestTask: (questId: string, taskId: string) => void;
  setLeaderboard: (leaderboard: LeaderboardData) => void;
  addTransaction: (transaction: PointTransaction) => void;
  setStreakInfo: (streakInfo: StreakInfo) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  stats: null,
  achievements: [],
  quests: [],
  leaderboard: null,
  recentTransactions: [],
  streakInfo: null,
  isLoading: false,
  error: null,
};

export const useGamificationStore = create<GamificationState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setStats: (stats) => 
          set((state) => ({ 
            ...state, 
            stats,
            error: null 
          })),

        updatePoints: (points) =>
          set((state) => ({
            ...state,
            stats: state.stats ? {
              ...state.stats,
              totalPoints: state.stats.totalPoints + points,
              lastUpdated: new Date().toISOString(),
            } : null,
          })),

        setAchievements: (achievements) =>
          set((state) => ({ 
            ...state, 
            achievements,
            error: null 
          })),

        unlockAchievement: (achievementId) =>
          set((state) => ({
            ...state,
            achievements: state.achievements.map((achievement) =>
              achievement.id === achievementId
                ? { ...achievement, unlockedAt: new Date().toISOString() }
                : achievement
            ),
          })),

        setQuests: (quests) =>
          set((state) => ({ 
            ...state, 
            quests,
            error: null 
          })),

        completeQuestTask: (questId, taskId) =>
          set((state) => ({
            ...state,
            quests: state.quests.map((quest) =>
              quest.id === questId
                ? {
                    ...quest,
                    tasks: quest.tasks.map((task) =>
                      task.id === taskId
                        ? { ...task, completed: true }
                        : task
                    ),
                    completedAt: quest.tasks.every(t => 
                      t.id === taskId ? true : t.completed
                    ) ? new Date().toISOString() : undefined,
                  }
                : quest
            ),
          })),

        setLeaderboard: (leaderboard) =>
          set((state) => ({ 
            ...state, 
            leaderboard,
            error: null 
          })),

        addTransaction: (transaction) =>
          set((state) => ({
            ...state,
            recentTransactions: [
              transaction,
              ...state.recentTransactions.slice(0, 49), // Keep last 50 transactions
            ],
          })),

        setStreakInfo: (streakInfo) =>
          set((state) => ({ 
            ...state, 
            streakInfo,
            error: null 
          })),

        incrementStreak: () =>
          set((state) => ({
            ...state,
            streakInfo: state.streakInfo ? {
              ...state.streakInfo,
              currentStreak: state.streakInfo.currentStreak + 1,
              longestStreak: Math.max(
                state.streakInfo.longestStreak,
                state.streakInfo.currentStreak + 1
              ),
              lastActivityDate: new Date().toISOString(),
            } : null,
          })),

        resetStreak: () =>
          set((state) => ({
            ...state,
            streakInfo: state.streakInfo ? {
              ...state.streakInfo,
              currentStreak: 0,
              weeklyPoints: 0,
              lastActivityDate: new Date().toISOString(),
            } : null,
          })),

        setLoading: (isLoading) =>
          set((state) => ({ ...state, isLoading })),

        setError: (error) =>
          set((state) => ({ ...state, error, isLoading: false })),

        reset: () => set(initialState),
      }),
      {
        name: 'gamification-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          stats: state.stats,
          achievements: state.achievements,
          streakInfo: state.streakInfo,
          recentTransactions: state.recentTransactions.slice(0, 10), // Only persist last 10
        }),
      }
    ),
    {
      name: 'gamification-store',
    }
  )
);