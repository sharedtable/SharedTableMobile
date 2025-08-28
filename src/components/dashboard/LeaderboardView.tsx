import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';

import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useLeaderboard } from '@/hooks/useGamification';
import type { LeaderboardEntry } from '@/types/gamification';

type LeaderboardTab = 'dinners' | 'points' | 'monthly';

// Fallback mock data for when API is unavailable
const generateMockEntries = (
  startRank: number,
  endRank: number,
  currentUserRank: number = 56
): LeaderboardEntry[] => {
  const names = [
    'Marsha Fisher',
    'Juanita Cormier',
    'Tamara Schmidt',
    'Ricardo Veum',
    'Gary Sanford',
    'Becky Bartell',
    'Emily Johnson',
    'Michael Chen',
    'Sarah Williams',
    'David Brown',
    'Lisa Anderson',
    'James Wilson',
    'Maria Garcia',
    'Robert Taylor',
    'Jennifer Davis',
    'William Martinez',
    'Patricia Jones',
    'Christopher Lee',
    'Barbara White',
    'Daniel Harris',
    'Nancy Clark',
    'Matthew Lewis',
    'Betty Walker',
    'Mark Hall',
    'Sandra Young',
    'Joseph Allen',
    'Helen King',
    'Paul Wright',
    'Karen Scott',
    'Steven Green',
    'Linda Baker',
    'Andrew Hill',
    'Donna Adams',
    'Kenneth Nelson',
    'Carol Campbell',
    'Joshua Mitchell',
    'Michelle Roberts',
    'George Turner',
    'Dorothy Phillips',
    'Kevin Parker',
    'Laura Evans',
    'Brian Edwards',
    'Amy Collins',
    'Ronald Stewart',
    'Kimberly Morris',
    'Jason Rogers',
    'Deborah Reed',
    'Ryan Cook',
    'Sharon Bailey',
    'Jeffrey Bell',
    'Cynthia Cooper',
    'Jacob Richardson',
    'Marie Cox',
    'Gary Howard',
    'Angela Ward',
    'Stephen Torres',
    'Brenda Peterson',
    'Edward Gray',
    'Rebecca Ramirez',
    'Eric Watson',
    'Teresa Brooks',
    'Gerald Kelly',
    'Joyce Sanders',
    'Harry Price',
    'Frances Bennett',
    'Arthur Wood',
    'Shirley Barnes',
    'Peter Ross',
    'Joan Henderson',
    'Jack Coleman',
    'Judy Jenkins',
    'Albert Perry',
    'Madison Powell',
    'Willie Long',
    'Katherine Patterson',
    'Eugene Hughes',
    'Doris Flores',
    'Ralph Washington',
    'Diane Butler',
    'Carl Simmons',
    'Judith Foster',
    'Russell Gonzales',
    'Ruby Bryant',
    'Roy Alexander',
    'Alice Russell',
    'Philip Griffin',
    'Tina Diaz',
    'Bruce Hayes',
    'Gloria Myers',
    'Raymond Ford',
    'Lori Hamilton',
    'Dennis Graham',
    'Janet Sullivan',
    'Henry Wallace',
    'Virginia Woods',
    'Douglas Cole',
    'Marilyn West',
    'Aaron Jordan',
    'Martha Owens',
    'Jose Reynolds',
  ];

  const entries: LeaderboardEntry[] = [];
  for (let i = startRank; i <= endRank; i++) {
    const nameIndex = (i - 4) % names.length;
    const basePoints = 100 - (i - 1) * 0.7; // Gradually decreasing points
    entries.push({
      rank: i,
      userId: `user-${i}`,
      userName: i === currentUserRank ? 'You' : names[nameIndex],
      userAvatar: `https://i.pravatar.cc/150?img=${(i % 50) + 1}`,
      points: Math.max(Math.round(basePoints), 10),
      dinnersAttended: Math.floor(Math.random() * 50) + 1,
      isCurrentUser: i === currentUserRank,
    });
  }
  return entries;
};

// Default mock data for fallback
const createMockData = (): Record<LeaderboardTab, LeaderboardEntry[]> => {
  const createTopThree = () => [
    {
      rank: 1,
      userId: '1',
      userName: 'Bryan Wolf',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      points: 2500,
      dinnersAttended: 45,
      isCurrentUser: false,
    },
    {
      rank: 2,
      userId: '2',
      userName: 'Meghan Jessica',
      userAvatar: 'https://i.pravatar.cc/150?img=2',
      points: 2200,
      dinnersAttended: 38,
      isCurrentUser: false,
    },
    {
      rank: 3,
      userId: '3',
      userName: 'Alex Turner',
      userAvatar: 'https://i.pravatar.cc/150?img=3',
      points: 2000,
      dinnersAttended: 35,
      isCurrentUser: false,
    },
  ];

  return {
    dinners: [...createTopThree(), ...generateMockEntries(4, 100, 56)],
    points: [...createTopThree(), ...generateMockEntries(4, 100, 42)],
    monthly: [...createTopThree(), ...generateMockEntries(4, 100, 23)],
  };
};

export const LeaderboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('points');
  const [refreshing, setRefreshing] = useState(false);
  const [localData, setLocalData] = useState<Record<LeaderboardTab, LeaderboardEntry[]>>(createMockData());
  
  const { leaderboard, isLoading, fetchLeaderboard, refetch } = useLeaderboard();
  
  useEffect(() => {
    // Fetch leaderboard data for active tab
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);
  
  useEffect(() => {
    // Update local data when leaderboard changes
    if (leaderboard) {
      setLocalData(prev => ({
        ...prev,
        ...leaderboard,
      }));
    }
  }, [leaderboard]);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await fetchLeaderboard(activeTab);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, fetchLeaderboard, refetch]);
  
  const currentData = localData[activeTab] || [];
  const topThree = currentData.slice(0, 3);
  const restOfList = currentData.slice(3);

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'dinners' && styles.activeTab]}
          onPress={() => setActiveTab('dinners')}
        >
          <Text style={[styles.tabText, activeTab === 'dinners' && styles.activeTabText]}>
            Dinners
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'points' && styles.activeTab]}
          onPress={() => setActiveTab('points')}
        >
          <Text style={[styles.tabText, activeTab === 'points' && styles.activeTabText]}>
            Points
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
            Monthly Special
          </Text>
        </Pressable>
      </View>

      <ScrollView 
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
        {isLoading && !refreshing && currentData.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        )}
        {/* Podium Section */}
        <View style={styles.podiumContainer}>
          <View style={styles.podiumWrapper}>
            {/* Second Place */}
            {topThree[1] && (
              <View style={styles.podiumItem}>
                <View style={[styles.avatarContainer, styles.secondPlace]}>
                  <Image source={{ uri: topThree[1]?.userAvatar || 'https://i.pravatar.cc/150?img=2' }} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>2</Text>
                </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[1]?.userName}
                </Text>
                <Text style={styles.podiumPoints}>
                  {topThree[1]?.points} pts
                </Text>
              </View>
            )}

            {/* First Place */}
            {topThree[0] && (
              <View style={[styles.podiumItem, styles.firstPlaceItem]}>
                <View style={styles.crownContainer}>
                  <Text style={styles.crownEmoji}>👑</Text>
                </View>
                <View style={[styles.avatarContainer, styles.firstPlace]}>
                  <Image source={{ uri: topThree[0]?.userAvatar || 'https://i.pravatar.cc/150?img=1' }} style={styles.avatarLarge} />
                <View style={[styles.rankBadge, styles.firstRankBadge]}>
                  <Text style={styles.rankText}>1</Text>
                </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[0]?.userName}
                </Text>
                <Text style={styles.podiumPoints}>
                  {topThree[0]?.points} pts
                </Text>
              </View>
            )}

            {/* Third Place */}
            {topThree[2] && (
              <View style={styles.podiumItem}>
                <View style={[styles.avatarContainer, styles.thirdPlace]}>
                  <Image source={{ uri: topThree[2]?.userAvatar || 'https://i.pravatar.cc/150?img=3' }} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>3</Text>
                </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[2]?.userName}
                </Text>
                <Text style={styles.podiumPoints}>
                  {topThree[2]?.points} pts
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          {restOfList.map((entry) => (
            <View
              key={entry.rank}
              style={[styles.listItem, entry.isCurrentUser && styles.currentUserItem]}
            >
              <Text style={[styles.listRank, entry.isCurrentUser && styles.currentUserText]}>
                {entry.rank}
              </Text>
              <Image source={{ uri: entry.userAvatar || `https://i.pravatar.cc/150?img=${entry.rank}` }} style={styles.listAvatar} />
              <Text
                style={[styles.listName, entry.isCurrentUser && styles.currentUserText]}
                numberOfLines={1}
              >
                {entry.userName}
              </Text>
              <Text style={[styles.listPoints, entry.isCurrentUser && styles.currentUserText]}>
                {activeTab === 'dinners' ? `${entry.dinnersAttended} dinners` : `${entry.points} pts`}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    borderBottomColor: theme.colors.primary.main,
    borderBottomWidth: 2,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  avatar: {
    borderRadius: scaleWidth(30),
    height: scaleWidth(60),
    width: scaleWidth(60),
  },
  avatarContainer: {
    marginBottom: scaleHeight(8),
    position: 'relative',
  },
  avatarLarge: {
    borderRadius: scaleWidth(35),
    height: scaleWidth(70),
    width: scaleWidth(70),
  },
  container: {
    backgroundColor: Colors.backgroundLight,
    flex: 1,
  },
  crownContainer: {
    position: 'absolute',
    top: scaleHeight(-25),
    zIndex: 1,
  },
  crownEmoji: {
    fontSize: scaleFont(30),
  },
  currentUserItem: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    marginHorizontal: scaleWidth(-16),
    paddingHorizontal: scaleWidth(16),
  },
  currentUserText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  firstPlace: {
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(40),
    borderWidth: 3,
    padding: scaleWidth(3),
  },
  firstPlaceItem: {
    marginBottom: scaleHeight(20),
  },
  firstRankBadge: {
    backgroundColor: theme.colors.primary.main,
  },
  listAvatar: {
    borderRadius: scaleWidth(20),
    height: scaleWidth(40),
    marginHorizontal: scaleWidth(12),
    width: scaleWidth(40),
  },
  listContainer: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  listItem: {
    alignItems: 'center',
    borderBottomColor: Colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: scaleHeight(12),
  },
  listName: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  listPoints: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(40),
  },
  listRank: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    width: scaleWidth(30),
  },
  podiumContainer: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(40),
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: scaleWidth(15),
  },
  podiumName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
    maxWidth: scaleWidth(80),
  },
  podiumPoints: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  podiumWrapper: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    bottom: scaleHeight(-5),
    height: scaleWidth(24),
    justifyContent: 'center',
    position: 'absolute',
    right: scaleWidth(-5),
    width: scaleWidth(24),
  },
  rankText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  secondPlace: {
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    borderWidth: 2,
    padding: scaleWidth(2),
  },
  tab: {
    marginRight: scaleWidth(24),
    paddingVertical: scaleHeight(12),
  },
  tabContainer: {
    backgroundColor: theme.colors.white,
    borderBottomColor: Colors.gray300,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(24),
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  thirdPlace: {
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    borderWidth: 2,
    padding: scaleWidth(2),
  },
});
