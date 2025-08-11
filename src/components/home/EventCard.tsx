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
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.dateTime, disabled && styles.textDisabled]}>
        {date} {time}
      </Text>
      <View style={[
        styles.selectionCircle,
        isSelected && styles.selectionCircleSelected,
        disabled && styles.selectionCircleDisabled,
      ]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(24),
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: scaleHeight(12),
  },
  cardSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
  },
  cardDisabled: {
    backgroundColor: '#F5F5F5',
  },
  dateTime: {
    fontSize: scaleFont(14),
    fontWeight: '500' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  textDisabled: {
    color: theme.colors.text.secondary,
  },
  selectionCircle: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: theme.colors.white,
  },
  selectionCircleSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.main,
  },
  selectionCircleDisabled: {
    backgroundColor: '#E5E5E5',
    borderColor: '#E5E5E5',
  },
});