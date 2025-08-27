/**
 * Production-grade preference selector component
 * Reusable component for selecting preferences with icons
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

export interface PreferenceOption {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  description?: string;
}

interface PreferenceSelectorProps {
  options: PreferenceOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
  columns?: number;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
}

export const PreferenceSelector: React.FC<PreferenceSelectorProps> = ({
  options,
  selectedIds,
  onToggle,
  multiSelect = true,
  columns = 2,
  style,
  itemStyle,
}) => {
  const handlePress = (id: string) => {
    if (!multiSelect && selectedIds.length > 0 && !selectedIds.includes(id)) {
      // In single-select mode, deselect previous before selecting new
      selectedIds.forEach(prevId => {
        if (prevId !== id) onToggle(prevId);
      });
    }
    onToggle(id);
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        
        return (
          <Pressable
            key={option.id}
            onPress={() => handlePress(option.id)}
            style={({ pressed }) => [
              styles.option,
              { width: `${100 / columns - 2}%` },
              isSelected && styles.optionSelected,
              pressed && styles.optionPressed,
              itemStyle,
            ]}
          >
            <View style={styles.optionContent}>
              {option.icon && (
                <View
                  style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                    option.color && { backgroundColor: `${option.color}20` },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={scaleWidth(24)}
                    color={
                      isSelected
                        ? theme.colors.white
                        : option.color || theme.colors.gray[600]
                    }
                  />
                </View>
              )}
              
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
                numberOfLines={2}
              >
                {option.label}
              </Text>
              
              {option.description && (
                <Text
                  style={[
                    styles.description,
                    isSelected && styles.descriptionSelected,
                  ]}
                  numberOfLines={2}
                >
                  {option.description}
                </Text>
              )}

              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons
                    name="checkmark-circle"
                    size={scaleWidth(20)}
                    color={theme.colors.primary[500]}
                  />
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    minHeight: scaleHeight(100),
  },
  optionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  optionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
    backgroundColor: theme.colors.gray[100],
  },
  iconContainerSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  labelSelected: {
    color: theme.colors.primary[700],
    fontWeight: '700',
  },
  description: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleHeight(4),
  },
  descriptionSelected: {
    color: theme.colors.primary[600],
  },
  checkmark: {
    position: 'absolute',
    top: -scaleHeight(8),
    right: -scaleWidth(8),
  },
});