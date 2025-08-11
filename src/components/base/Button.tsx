import React, { memo, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PressableProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/theme';
import { designTokens } from '@/theme/designTokens';
import { createShadow } from '@/theme/styleUtils';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button = memo<ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
  testID,
  ...pressableProps
}) => {
  const isDisabled = disabled || loading;

  const handlePress = useCallback(() => {
    if (isDisabled || !onPress) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  }, [isDisabled, onPress]);

  const getButtonStyle = useCallback(
    (pressed: boolean): ViewStyle[] => {
      const baseStyle: ViewStyle[] = [
        styles.base,
        variant === 'text' ? styles.textVariant : styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        isDisabled && styles[`${variant}Disabled`],
        pressed && styles.pressed,
        style,
      ];

      return baseStyle.filter(Boolean) as ViewStyle[];
    },
    [variant, size, fullWidth, isDisabled, style]
  );

  const getTextStyle = useCallback((): TextStyle[] => {
    return [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      isDisabled && styles.disabledText,
      textStyle,
    ].filter(Boolean) as TextStyle[];
  }, [variant, size, isDisabled, textStyle]);

  return (
    <Pressable
      style={({ pressed }) => getButtonStyle(pressed)}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.white : theme.colors.brand.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={getTextStyle()} numberOfLines={1}>
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...createShadow('sm'),
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.brand.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: theme.colors.error.main,
  },

  // Sizes
  small: {
    height: designTokens.components.button.height.small,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  medium: {
    height: designTokens.components.button.height.medium,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  large: {
    height: designTokens.components.button.height.large,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },

  // States
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: designTokens.opacity.pressed,
    transform: [{ scale: designTokens.touch.pressScale }],
  },
  disabled: {
    opacity: designTokens.opacity.disabled,
  },

  // Disabled variants
  primaryDisabled: {
    backgroundColor: theme.colors.gray['2'],
  },
  secondaryDisabled: {
    borderColor: theme.colors.gray['2'],
  },
  textDisabled: {},
  dangerDisabled: {
    backgroundColor: theme.colors.gray['2'],
  },

  // Text styles
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  primaryText: {
    color: theme.colors.primary.contrast,
  },
  secondaryText: {
    color: theme.colors.brand.primary,
  },
  textText: {
    color: theme.colors.brand.primary,
  },
  dangerText: {
    color: theme.colors.neutral.white,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },

  // Text sizes
  smallText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.typography.fontSize.base,
  },
  largeText: {
    fontSize: theme.typography.fontSize.lg,
  },
});