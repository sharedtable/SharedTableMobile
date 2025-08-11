import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: any;
}

export const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          variant === 'outline' && styles.outlineButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
  },
  disabled: {
    opacity: 0.5,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
  },
  outlineButtonText: {
    color: theme.colors.primary.main,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
  },
  primaryButtonText: {
    color: theme.colors.white,
  },
  secondaryButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  secondaryButtonText: {
    color: theme.colors.white,
  },
});
