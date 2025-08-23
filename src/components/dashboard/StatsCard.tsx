import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface StatsCardProps {
  icon: string;
  iconColor?: string;
  value: string | number;
  label: string;
  sublabel?: string;
  trend?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  iconColor = theme.colors.primary.main,
  value,
  label,
  sublabel,
  trend,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {trend && (
            <Text
              style={[
                styles.trend,
                trend.startsWith('+') && styles.trendPositive,
              ]}
            >
              {trend}
            </Text>
          )}
        </View>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    padding: scaleWidth(16),
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLighter,
    borderRadius: scaleWidth(18),
    height: scaleWidth(36),
    justifyContent: 'center',
    marginRight: scaleWidth(12),
    width: scaleWidth(36),
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(2),
  },
  sublabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    opacity: 0.8,
  },
  trend: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600' as any,
    marginLeft: scaleWidth(4),
    color: theme.colors.primary.main,
  },
  value: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  trendPositive: {
    color: Colors.success,
  },
});
