import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface SelectionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
  fullWidth?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  label,
  selected,
  onPress,
  icon,
  compact = false,
  fullWidth: _fullWidth = false,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact && styles.compactCard,
        selected && styles.selectedCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.cardText, selected && styles.selectedText]}>{label}</Text>
        {selected && (
          <View style={styles.checkmark}>
            <Icon name="checkmark" size={20} color={theme.colors.white} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: 'transparent',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16), // 10% of brand color
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  checkmark: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleWidth(24),
    justifyContent: 'center',
    marginLeft: scaleWidth(12),
    width: scaleWidth(24),
  },
  compactCard: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  iconContainer: {
    marginRight: scaleWidth(12),
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  selectedCard: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)',
    borderColor: theme.colors.primary.main, // 30% of brand color
  },
  selectedText: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
});
