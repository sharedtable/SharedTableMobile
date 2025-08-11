import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  isSelected,
  onPress,
  icon,
  style,
  textStyle,
  testID,
}) => {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected, style]}
      onPress={onPress}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.label, isSelected && styles.labelSelected, textStyle]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderColor: 'transparent',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: scaleHeight(52),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  cardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)', // 30% of brand color
    borderColor: theme.colors.primary.main,
  },
  iconContainer: {
    marginBottom: scaleHeight(8),
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
    textAlign: 'center',
  },
  labelSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
});
