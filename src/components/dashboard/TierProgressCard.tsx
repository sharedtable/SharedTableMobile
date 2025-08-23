import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

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
          <Text style={styles.levelText}>
            {level} • {dinnersAttended} dinners attended
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(35),
    marginBottom: scaleHeight(16),
    padding: scaleWidth(20),
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: scaleHeight(4),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(16),
  },
  levelText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    opacity: 0.9,
  },
  percentBadge: {
    backgroundColor: Colors.backgroundWhiteOverlay,
    borderRadius: scaleWidth(12),
    marginLeft: scaleWidth(12),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
  },
  percentText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600' as any,
  },
  textContent: {
    flex: 1,
  },
  tierText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(18),
    fontWeight: '700' as any,
  },
});
