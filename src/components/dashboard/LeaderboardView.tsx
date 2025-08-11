import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type LeaderboardTab = 'dinners' | 'points' | 'monthly';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  value: number;
  unit: string;
  isCurrentUser?: boolean;
}

// Generate mock data for ranks 4-100
const generateMockEntries = (startRank: number, endRank: number, currentUserRank: number = 56): LeaderboardEntry[] => {
  const names = [
    'Marsha Fisher', 'Juanita Cormier', 'Tamara Schmidt', 'Ricardo Veum', 'Gary Sanford',
    'Becky Bartell', 'Emily Johnson', 'Michael Chen', 'Sarah Williams', 'David Brown',
    'Lisa Anderson', 'James Wilson', 'Maria Garcia', 'Robert Taylor', 'Jennifer Davis',
    'William Martinez', 'Patricia Jones', 'Christopher Lee', 'Barbara White', 'Daniel Harris',
    'Nancy Clark', 'Matthew Lewis', 'Betty Walker', 'Mark Hall', 'Sandra Young',
    'Joseph Allen', 'Helen King', 'Paul Wright', 'Karen Scott', 'Steven Green',
    'Linda Baker', 'Andrew Hill', 'Donna Adams', 'Kenneth Nelson', 'Carol Campbell',
    'Joshua Mitchell', 'Michelle Roberts', 'George Turner', 'Dorothy Phillips', 'Kevin Parker',
    'Laura Evans', 'Brian Edwards', 'Amy Collins', 'Ronald Stewart', 'Kimberly Morris',
    'Jason Rogers', 'Deborah Reed', 'Ryan Cook', 'Sharon Bailey', 'Jeffrey Bell',
    'Cynthia Cooper', 'Jacob Richardson', 'Marie Cox', 'Gary Howard', 'Angela Ward',
    'Stephen Torres', 'Brenda Peterson', 'Edward Gray', 'Rebecca Ramirez', 'Eric Watson',
    'Teresa Brooks', 'Gerald Kelly', 'Joyce Sanders', 'Harry Price', 'Frances Bennett',
    'Arthur Wood', 'Shirley Barnes', 'Peter Ross', 'Joan Henderson', 'Jack Coleman',
    'Judy Jenkins', 'Albert Perry', 'Madison Powell', 'Willie Long', 'Katherine Patterson',
    'Eugene Hughes', 'Doris Flores', 'Ralph Washington', 'Diane Butler', 'Carl Simmons',
    'Judith Foster', 'Russell Gonzales', 'Ruby Bryant', 'Roy Alexander', 'Alice Russell',
    'Philip Griffin', 'Tina Diaz', 'Bruce Hayes', 'Gloria Myers', 'Raymond Ford',
    'Lori Hamilton', 'Dennis Graham', 'Janet Sullivan', 'Henry Wallace', 'Virginia Woods',
    'Douglas Cole', 'Marilyn West', 'Aaron Jordan', 'Martha Owens', 'Jose Reynolds'
  ];

  const entries: LeaderboardEntry[] = [];
  for (let i = startRank; i <= endRank; i++) {
    const nameIndex = (i - 4) % names.length;
    const basePoints = 100 - (i - 1) * 0.7; // Gradually decreasing points
    entries.push({
      rank: i,
      name: i === currentUserRank ? 'You' : names[nameIndex],
      avatar: `https://i.pravatar.cc/150?img=${(i % 50) + 1}`,
      value: Math.max(Math.round(basePoints), 10),
      unit: 'pts',
      isCurrentUser: i === currentUserRank,
    });
  }
  return entries;
};

const mockData: Record<LeaderboardTab, LeaderboardEntry[]> = {
  dinners: [
    { rank: 1, name: 'Bryan Wolf', avatar: 'https://i.pravatar.cc/150?img=1', value: 100, unit: 'pts' },
    { rank: 2, name: 'Meghan Jess...', avatar: 'https://i.pravatar.cc/150?img=2', value: 90, unit: 'pts' },
    { rank: 3, name: 'Alex Turner', avatar: 'https://i.pravatar.cc/150?img=3', value: 88, unit: 'pts' },
    ...generateMockEntries(4, 100, 56),
  ],
  points: [
    { rank: 1, name: 'Bryan Wolf', avatar: 'https://i.pravatar.cc/150?img=1', value: 100, unit: 'pts' },
    { rank: 2, name: 'Meghan Jess...', avatar: 'https://i.pravatar.cc/150?img=2', value: 90, unit: 'pts' },
    { rank: 3, name: 'Alex Turner', avatar: 'https://i.pravatar.cc/150?img=3', value: 88, unit: 'pts' },
    ...generateMockEntries(4, 100, 42),
  ],
  monthly: [
    { rank: 1, name: 'Bryan Wolf', avatar: 'https://i.pravatar.cc/150?img=1', value: 100, unit: 'pts' },
    { rank: 2, name: 'Meghan Jess...', avatar: 'https://i.pravatar.cc/150?img=2', value: 90, unit: 'pts' },
    { rank: 3, name: 'Alex Turner', avatar: 'https://i.pravatar.cc/150?img=3', value: 88, unit: 'pts' },
    ...generateMockEntries(4, 100, 23),
  ],
};

export const LeaderboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('dinners');
  const data = mockData[activeTab];
  const topThree = data.slice(0, 3);
  const restOfList = data.slice(3);

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Podium Section */}
        <View style={styles.podiumContainer}>
          <View style={styles.podiumWrapper}>
            {/* Second Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.avatarContainer, styles.secondPlace]}>
                <Image source={{ uri: topThree[1]?.avatar }} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>2</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1]?.name}
              </Text>
              <Text style={styles.podiumPoints}>
                {topThree[1]?.value} {topThree[1]?.unit}
              </Text>
            </View>

            {/* First Place */}
            <View style={[styles.podiumItem, styles.firstPlaceItem]}>
              <View style={styles.crownContainer}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
              <View style={[styles.avatarContainer, styles.firstPlace]}>
                <Image source={{ uri: topThree[0]?.avatar }} style={styles.avatarLarge} />
                <View style={[styles.rankBadge, styles.firstRankBadge]}>
                  <Text style={styles.rankText}>1</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[0]?.name}
              </Text>
              <Text style={styles.podiumPoints}>
                {topThree[0]?.value} {topThree[0]?.unit}
              </Text>
            </View>

            {/* Third Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.avatarContainer, styles.thirdPlace]}>
                <Image source={{ uri: topThree[2]?.avatar }} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>3</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[2]?.name}
              </Text>
              <Text style={styles.podiumPoints}>
                {topThree[2]?.value} {topThree[2]?.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          {restOfList.map((entry) => (
            <View
              key={entry.rank}
              style={[
                styles.listItem,
                entry.isCurrentUser && styles.currentUserItem,
              ]}
            >
              <Text style={[styles.listRank, entry.isCurrentUser && styles.currentUserText]}>
                {entry.rank}
              </Text>
              <Image source={{ uri: entry.avatar }} style={styles.listAvatar} />
              <Text style={[styles.listName, entry.isCurrentUser && styles.currentUserText]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={[styles.listPoints, entry.isCurrentUser && styles.currentUserText]}>
                {entry.value} {entry.unit}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(24),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    paddingVertical: scaleHeight(12),
    marginRight: scaleWidth(24),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: '600' as any,
  },
  podiumContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: scaleHeight(40),
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  podiumWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: scaleWidth(20),
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: scaleWidth(15),
  },
  firstPlaceItem: {
    marginBottom: scaleHeight(20),
  },
  crownContainer: {
    position: 'absolute',
    top: scaleHeight(-25),
    zIndex: 1,
  },
  crownEmoji: {
    fontSize: scaleFont(30),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: scaleHeight(8),
  },
  firstPlace: {
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(40),
    padding: scaleWidth(3),
  },
  secondPlace: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    padding: scaleWidth(2),
  },
  thirdPlace: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    padding: scaleWidth(2),
  },
  avatar: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
  },
  avatarLarge: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
  },
  rankBadge: {
    position: 'absolute',
    bottom: scaleHeight(-5),
    right: scaleWidth(-5),
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  firstRankBadge: {
    backgroundColor: theme.colors.primary.main,
  },
  rankText: {
    color: theme.colors.white,
    fontSize: scaleFont(12),
    fontWeight: '700' as any,
    fontFamily: theme.typography.fontFamily.bold,
  },
  podiumName: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
    maxWidth: scaleWidth(80),
  },
  podiumPoints: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  listContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(27),
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  currentUserItem: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: scaleWidth(-16),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(27),
  },
  listRank: {
    width: scaleWidth(30),
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  listAvatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    marginHorizontal: scaleWidth(12),
  },
  listName: {
    flex: 1,
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  listPoints: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  currentUserText: {
    color: theme.colors.white,
    fontWeight: '600' as any,
  },
});