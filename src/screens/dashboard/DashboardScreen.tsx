import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';

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

interface DashboardScreenProps {
  navigation?: any;
  route?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

type DashboardTab = 'overview' | 'leaderboard' | 'quest' | 'loyalty';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  navigation: _navigation,
  route: _route,
  onNavigate: _onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  // Removed activeNavTab - navigation is now handled by React Navigation's tab bar

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome back, John!</Text>
              <Text style={styles.welcomeSubtitle}>Track your food journey, unlock rewards.</Text>
            </View>

            {/* Tier Progress */}
            <TierProgressCard
              tier={4}
              level="Gourmand Level"
              dinnersAttended={45}
              percentComplete={20}
            />

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <StatsCard
                icon="star"
                iconColor="#FFB800"
                value="900"
                label="Total Points"
                trend="+20%"
              />
              <View style={{ width: scaleWidth(12) }} />
              <StatsCard
                icon="trophy"
                iconColor="#4A90E2"
                value="# 5"
                label="Monthly Special"
                trend="+5%"
              />
            </View>

            {/* Gourmand Progress */}
            <GourmandProgressCard
              currentProgress={25}
              totalProgress={50}
              currentBenefit="10% point bonus • Restaurant discounts"
              nextBenefit="dddafeed"
              pointsBonus={25}
              pointsToNext={24}
            />

            {/* Streak Tracker */}
            <StreakTrackerCard
              weeksCount={6}
              weeklyPoints={{
                description: 'Maintain your streak to earn 50 bonus points per week',
                points: 200,
              }}
              nextReward={{
                description:
                  "Mystery reward unlocks every 3 weeks! Keep your streak to find out what's waiting for you",
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
        onNotification={() => console.log('Notifications')}
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
    fontWeight: '600' as any,
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
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
    borderBottomColor: '#E5E5E5',
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
    fontWeight: '700' as any,
    marginBottom: scaleHeight(4),
  },
});
