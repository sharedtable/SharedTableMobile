import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';

import { GourmandProgressCard } from '@/components/dashboard/GourmandProgressCard';
import { LeaderboardView } from '@/components/dashboard/LeaderboardView';
import { LoyaltyShopView } from '@/components/dashboard/LoyaltyShopView';
import { MyQuestView } from '@/components/dashboard/MyQuestView';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StreakTrackerCard } from '@/components/dashboard/StreakTrackerCard';
import { TierProgressCard } from '@/components/dashboard/TierProgressCard';
// Removed BottomTabBar - now using React Navigation's tab bar
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useGamificationStats, useStreak, useGamificationSync } from '@/hooks/useGamification';
import { TIER_CONFIG } from '@/types/gamification';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserData } from '@/hooks/useUserData';
import { getUserDisplayName } from '@/utils/getUserDisplayName';

interface DashboardScreenProps {
  navigation?: NavigationProp<any>;
  route?: RouteProp<any>;
  onNavigate?: (screen: string, data?: unknown) => void;
}

type DashboardTab = 'overview' | 'leaderboard' | 'quest' | 'loyalty';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  navigation: _navigation,
  route: _route,
  onNavigate: _onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  
  const profile = useAuthStore((state) => state.privyUser);
  const { userData } = useUserData();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { stats, isLoading: statsLoading } = useGamificationStats();
  const { streakInfo } = useStreak();
  const { syncAll } = useGamificationSync();
  
  const currentTier = stats ? TIER_CONFIG.find(t => t.tier === Math.min(stats.currentTier, 5)) : TIER_CONFIG[0];
  const nextTier = stats && stats.currentTier < 5 ? TIER_CONFIG[stats.currentTier] : null;
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncAll();
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Initial data fetch
    syncAll();
    loadNotifications();
  }, []);
  
  const handleNotificationPress = () => {
    navigation.navigate('NotificationsList');
  };

  const renderTabContent = () => {
    if (statsLoading && !stats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      );
    }
    
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Welcome back, {getUserDisplayName({
                  ...userData,
                  nickname: userData?.displayName,
                  name: userData?.name || profile?.name
                }, 'Foodie')}!
              </Text>
              <Text style={styles.welcomeSubtitle}>Track your food journey, unlock rewards.</Text>
            </View>

            {/* Tier Progress */}
            <TierProgressCard
              tier={stats?.currentTier || 1}
              level={currentTier?.name || 'Newcomer'}
              dinnersAttended={stats?.dinnersAttended || 0}
              percentComplete={stats?.pointsToNextTier && nextTier && currentTier
                ? Math.round(((stats.totalPoints - currentTier.pointsRequired) / 
                  (nextTier.pointsRequired - currentTier.pointsRequired)) * 100)
                : 100
              }
            />

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <StatsCard
                icon="star"
                iconColor="#FFB800"
                value={stats?.totalPoints?.toString() || '0'}
                label="Total Points"
                trend={stats?.totalPoints && stats.totalPoints > 0 ? '+20%' : undefined}
              />
              <View style={{ width: scaleWidth(12) }} />
              <StatsCard
                icon="trophy"
                iconColor="#4A90E2"
                value={stats?.monthlyRank ? `#${stats.monthlyRank}` : 'N/A'}
                label="Monthly Rank"
                trend={stats?.monthlyRank && stats.monthlyRank <= 10 ? 'Top 10!' : undefined}
              />
            </View>

            {/* Gourmand Progress */}
            <GourmandProgressCard
              currentProgress={stats?.totalPoints || 0}
              totalProgress={nextTier?.pointsRequired || currentTier?.pointsRequired || 100}
              currentBenefit={currentTier?.benefits.join(' • ') || 'Start your journey'}
              nextBenefit={nextTier?.benefits[0] || 'Max tier reached!'}
              pointsBonus={currentTier?.tier ? (currentTier.tier - 1) * 5 : 0}
              pointsToNext={stats?.pointsToNextTier || 0}
            />

            {/* Streak Tracker */}
            <StreakTrackerCard
              weeksCount={streakInfo?.currentStreak || 0}
              weeklyPoints={{
                description: 'Maintain your streak to earn 50 bonus points per week',
                points: streakInfo?.weeklyPoints || 0,
              }}
              nextReward={{
                description:
                  streakInfo?.nextMilestone 
                    ? `${streakInfo.nextMilestone - (streakInfo.currentStreak || 0)} weeks until next milestone reward!`
                    : "Mystery reward unlocks every 3 weeks! Keep your streak to find out what's waiting for you",
              }}
            />
          </>
        );
      case 'leaderboard':
        return <LeaderboardView />;
      case 'quest':
        return <MyQuestView />;
      case 'loyalty':
        return <LoyaltyShopView />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Top Bar */}
      <TopBar
        title="Dashboard"
        showNotification
        notificationCount={unreadCount}
        onNotification={handleNotificationPress}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <Pressable
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
              Leaderboard
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'quest' && styles.activeTab]}
            onPress={() => setActiveTab('quest')}
          >
            <Text style={[styles.tabText, activeTab === 'quest' && styles.activeTabText]}>
              My Quest
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'loyalty' && styles.activeTab]}
            onPress={() => setActiveTab('loyalty')}
          >
            <Text style={[styles.tabText, activeTab === 'loyalty' && styles.activeTabText]}>
              Loyalty Shop
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {renderTabContent()}
        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      {/* Bottom Tab Bar removed - using React Navigation's tab bar */}
    </View>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    borderBottomColor: theme.colors.primary.main,
    borderBottomWidth: 2,
  },
  activeTabText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: scaleHeight(400),
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(12),
  },
  // Unused styles - kept for future use
  // placeholderContainer: {
  //   alignItems: 'center',
  //   flex: 1,
  //   justifyContent: 'center',
  //   minHeight: scaleHeight(400),
  // },
  // placeholderText: {
  //   color: theme.colors.text.secondary,
  //   fontFamily: theme.typography.fontFamily.body,
  //   fontSize: scaleFont(16),
  // },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(20),
  },
  scrollView: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: scaleHeight(16),
  },
  tab: {
    marginRight: scaleWidth(24),
    paddingVertical: scaleHeight(12),
  },
  tabContainer: {
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.ui.lightGray,
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: scaleWidth(24),
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  welcomeSection: {
    marginBottom: scaleHeight(24),
  },
  welcomeSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  welcomeTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(4),
  },
});
