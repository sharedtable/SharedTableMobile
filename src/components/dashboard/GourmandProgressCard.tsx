import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface GourmandProgressCardProps {
  currentProgress: number;
  totalProgress: number;
  currentBenefit: string;
  nextBenefit: string;
  pointsBonus: number;
  pointsToNext: number;
}

export const GourmandProgressCard: React.FC<GourmandProgressCardProps> = ({
  currentProgress,
  totalProgress,
  currentBenefit,
  nextBenefit,
  pointsBonus,
  pointsToNext,
}) => {
  const percentage = (currentProgress / totalProgress) * 100;
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gourmand Progress</Text>
        <Text style={styles.progress}>
          {currentProgress}/{totalProgress}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.progressCircle}>
          <Svg width={110} height={110}>
            <Circle
              cx={55}
              cy={55}
              r={radius}
              stroke="#F0F0F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={55}
              cy={55}
              r={radius}
              stroke={theme.colors.primary.main}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 55 55)`}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.benefit}>
            <Text style={styles.benefitLabel}>Current Benefit</Text>
            <Text style={styles.benefitText}>{currentBenefit}</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitLabel}>Next: {nextBenefit}</Text>
            <Text style={styles.pointsText}>
              {pointsBonus} point bonus • {pointsToNext} points at favorite cuisine
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  benefit: {
    marginBottom: scaleHeight(12),
  },
  benefitLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(4),
  },
  benefitText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  container: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(20),
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  details: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(20),
  },
  percentageContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  percentageText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
  },
  pointsText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  progress: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  progressCircle: {
    marginRight: scaleWidth(20),
    position: 'relative',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
  },
});
