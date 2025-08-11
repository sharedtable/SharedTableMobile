import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(20),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(20),
  },
  streakDisplay: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
  },
  streakNumber: {
    fontSize: scaleFont(48),
    fontWeight: '700' as any,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    lineHeight: scaleFont(52),
  },
  streakLabel: {
    fontSize: scaleFont(16),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: scaleHeight(4),
  },
  section: {
    backgroundColor: 'rgba(226, 72, 73, 0.05)',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  pointsValue: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  sectionDescription: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
});