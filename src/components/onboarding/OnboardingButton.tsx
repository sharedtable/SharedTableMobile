import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

import { theme } from '@/theme';
import { Colors } from '@/constants/colors';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
}

export const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.buttonContent}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? theme.colors.white : theme.colors.primary.main}
            style={styles.loadingIndicator}
          />
        )}
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'outline' && styles.outlineButtonText,
            loading && styles.loadingText,
          ]}
        >
          {label}
        </Text>
      </View>
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
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginRight: scaleWidth(8),
  },
  loadingText: {
    opacity: 0.8,
  },
  outlineButton: {
    backgroundColor: Colors.transparent,
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
