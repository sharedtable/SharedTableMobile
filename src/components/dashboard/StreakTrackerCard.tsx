import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface StreakTrackerCardProps {
  weeksCount: number;
  weeklyPoints: {
    description: string;
    points: number;
  };
  nextReward: {
    description: string;
  };
}

export const StreakTrackerCard: React.FC<StreakTrackerCardProps> = ({
  weeksCount,
  weeklyPoints,
  nextReward,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Streak Tracker</Text>

      <View style={styles.streakDisplay}>
        <Text style={styles.streakNumber}>{weeksCount}</Text>
        <Text style={styles.streakLabel}>Weeks Strong</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Points</Text>
          <Text style={styles.pointsValue}>+{weeklyPoints.points} pts this week</Text>
        </View>
        <Text style={styles.sectionDescription}>{weeklyPoints.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Reward</Text>
        <Text style={styles.sectionDescription}>{nextReward.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    padding: scaleWidth(20),
  },
  pointsValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.primaryLight,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(12),
    padding: scaleWidth(16),
  },
  sectionDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(4),
  },
  sectionTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  streakDisplay: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  streakLabel: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginTop: scaleHeight(4),
  },
  streakNumber: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(48),
    fontWeight: '700',
    lineHeight: scaleFont(52),
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(20),
  },
});
