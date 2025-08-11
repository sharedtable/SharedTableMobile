import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

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
            <Text style={[styles.trend, { color: trend.startsWith('+') ? '#16A34A' : theme.colors.primary.main }]}>
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
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  content: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  trend: {
    fontSize: scaleFont(12),
    fontWeight: '600' as any,
    marginLeft: scaleWidth(4),
    fontFamily: theme.typography.fontFamily.body,
  },
  label: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: scaleHeight(2),
  },
  sublabel: {
    fontSize: scaleFont(11),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
});