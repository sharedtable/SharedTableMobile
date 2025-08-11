import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

interface TierProgressCardProps {
  tier: number;
  level: string;
  dinnersAttended: number;
  percentComplete: number;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({
  tier,
  level,
  dinnersAttended,
  percentComplete,
}) => {
  return (
    <LinearGradient
      colors={['#E24849', '#F5A5A6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="trophy" size={36} color={theme.colors.white} />
        </View>
        <View style={styles.textContent}>
          <View style={styles.header}>
            <Text style={styles.tierText}>Tier {tier}</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>⬆ {percentComplete}%</Text>
            </View>
          </View>
          <Text style={styles.levelText}>{level} • {dinnersAttended} dinners attended</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: scaleWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  tierText: {
    fontSize: scaleFont(18),
    fontWeight: '700' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
  },
  percentBadge: {
    marginLeft: scaleWidth(12),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(12),
  },
  percentText: {
    fontSize: scaleFont(12),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  levelText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.9,
  },
});