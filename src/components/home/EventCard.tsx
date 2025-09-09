import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { Colors } from '@/constants/colors';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  price: string;
  availableSpots: number;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  time,
  location,
  price,
  availableSpots,
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
      <View style={styles.cardContent}>
        <View style={styles.leftContent}>
          <Text style={[styles.title, disabled && styles.textDisabled]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.location, disabled && styles.textDisabled]} numberOfLines={1}>
            {location}
          </Text>
          <Text style={[styles.dateTime, disabled && styles.textDisabled]}>
            {date} • {time}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={[styles.price, disabled && styles.textDisabled]}>{price}</Text>
            <Text style={[styles.spots, disabled && styles.textDisabled]}>
              {availableSpots} spots left
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.selectionCircle,
            isSelected && styles.selectionCircleSelected,
            disabled && styles.selectionCircleDisabled,
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(16),
    borderWidth: 2,
    marginBottom: scaleHeight(12),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: scaleWidth(16),
  },
  cardDisabled: {
    backgroundColor: Colors.gray100,
  },
  cardSelected: {
    backgroundColor: Colors.primaryLighter,
    borderColor: theme.colors.primary.main,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  location: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(4),
  },
  dateTime: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(8),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(15),
    fontWeight: '600',
  },
  spots: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  selectionCircle: {
    backgroundColor: theme.colors.white,
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    height: scaleWidth(20),
    width: scaleWidth(20),
  },
  selectionCircleDisabled: {
    backgroundColor: Colors.gray300,
    borderColor: Colors.gray300,
  },
  selectionCircleSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  textDisabled: {
    color: theme.colors.text.secondary,
  },
});
