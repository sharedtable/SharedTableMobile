import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

interface SelectionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  label,
  selected,
  onPress,
  icon,
  compact = false,
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
        <Text style={[styles.cardText, selected && styles.selectedText]}>
          {label}
        </Text>
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
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
  },
  compactCard: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
  },
  selectedCard: {
    borderColor: theme.colors.primary.main,
    backgroundColor: 'rgba(226, 72, 73, 0.3)', // 30% of brand color
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginRight: scaleWidth(12),
  },
  cardText: {
    flex: 1,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  selectedText: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  checkmark: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleWidth(12),
  },
});