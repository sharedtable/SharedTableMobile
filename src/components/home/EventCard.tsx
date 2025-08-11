import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface EventCardProps {
  date: string;
  time: string;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  date,
  time,
  isSelected = false,
  onPress,
  disabled = false,
}) => {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.dateTime, disabled && styles.textDisabled]}>
        {date} {time}
      </Text>
      <View
        style={[
          styles.selectionCircle,
          isSelected && styles.selectionCircleSelected,
          disabled && styles.selectionCircleDisabled,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(24),
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  cardDisabled: {
    backgroundColor: '#F5F5F5',
  },
  cardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main, // 10% of brand color
  },
  dateTime: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500' as any,
  },
  selectionCircle: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    height: scaleWidth(20),
    width: scaleWidth(20),
  },
  selectionCircleDisabled: {
    backgroundColor: '#E5E5E5',
    borderColor: '#E5E5E5',
  },
  selectionCircleSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  textDisabled: {
    color: theme.colors.text.secondary,
  },
});
