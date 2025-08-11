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
    height: scaleHeight(52),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  primaryButtonText: {
    color: theme.colors.white,
  },
  secondaryButtonText: {
    color: theme.colors.white,
  },
  outlineButtonText: {
    color: theme.colors.primary.main,
  },
});