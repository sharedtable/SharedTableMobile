import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

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
  pointsToNext: _pointsToNext,
}) => {
  const percentage = Math.min((currentProgress / totalProgress) * 100, 100);
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gourmand Progress</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.progressCircle}>
          <Svg width={100} height={100}>
            <Circle
              cx={50}
              cy={50}
              r={radius}
              stroke={theme.colors.ui.lightGray}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={50}
              cy={50}
              r={radius}
              stroke={theme.colors.brand.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 50 50)`}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{Math.round(percentage).toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.benefitSection}>
            <Text style={styles.benefitLabel}>Current Benefit</Text>
            <Text style={styles.benefitValue}>{pointsBonus}% point bonus • {currentBenefit}</Text>
          </View>
          
          <View style={styles.benefitSection}>
            <Text style={styles.benefitLabel}>Next: {nextBenefit}</Text>
            <Text style={styles.benefitValue}>{pointsBonus + 5}% point bonus • 2x points at favorite cuisine</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'relative',
    marginRight: scaleWidth(20),
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  details: {
    flex: 1,
  },
  benefitSection: {
    marginBottom: scaleHeight(12),
  },
  benefitLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  benefitValue: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(16),
  },
});
