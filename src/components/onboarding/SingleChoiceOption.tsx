import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface SingleChoiceOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  special?: boolean; // For "Prefer not to say" style options
}

export const SingleChoiceOption: React.FC<SingleChoiceOptionProps> = ({
  label,
  selected,
  onPress,
  special = false,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        special && styles.specialContainer,
        selected && (special ? styles.specialSelected : styles.selected),
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.label,
        selected && styles.labelSelected,
      ]}>
        {label}
      </Text>
      {selected && (
        <Ionicons 
          name="checkmark-circle" 
          size={24} 
          color={theme.colors.primary.main} 
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(18),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: scaleHeight(12),
  },
  selected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: Colors.primaryLight,
  },
  specialContainer: {
    backgroundColor: Colors.pinkBackground,
    borderColor: Colors.pinkBorder,
  },
  specialSelected: {
    backgroundColor: Colors.primaryLighter,
    borderColor: theme.colors.primary.main,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: scaleFont(16),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  labelSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
});