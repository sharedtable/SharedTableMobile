import * as Haptics from 'expo-haptics';
import React, { memo, ReactNode } from 'react';
import { Pressable, Text, StyleSheet, View, Platform, ViewStyle, TextStyle } from 'react-native';

import { theme } from '@/theme';
// import { /* designTokens } from '@/theme/designTokens';
import { createShadow } from '@/theme/styleUtils';

// Base button props that all variants share
interface BaseButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children: string | ReactNode;
}

// Square/Rectangular Button (like "Grab a Spot" in design)
interface SquareButtonProps extends BaseButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const SquareButton = memo<SquareButtonProps>(
  ({
    onPress,
    disabled = false,
    loading = false,
    fullWidth = false,
    size = 'medium',
    variant = 'outline',
    leftIcon,
    rightIcon,
    style,
    textStyle,
    children,
  }) => {
    const handlePress = () => {
      if (disabled || loading) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onPress();
    };

    const sizeStyles = {
      small: { height: 36, paddingHorizontal: 12, fontSize: 14 },
      medium: { height: 44, paddingHorizontal: 20, fontSize: 16 },
      large: { height: 52, paddingHorizontal: 24, fontSize: 18 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.brand.primary,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.white,
      },
      secondary: {
        backgroundColor: theme.colors.state.action,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.white,
      },
      outline: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.gray['1'],
        textColor: theme.colors.text.primary,
      },
      ghost: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.text.primary,
      },
    };

    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.squareButton,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: currentVariant.backgroundColor,
            borderWidth: currentVariant.borderWidth,
            borderColor: currentVariant.borderColor,
          },
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}

        {typeof children === 'string' ? (
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: currentVariant.textColor,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}

        {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
      </Pressable>
    );
  }
);

SquareButton.displayName = 'SquareButton';

// Rounded/Pill Button (like "Back to top" in design)
interface RoundedButtonProps extends BaseButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const RoundedButton = memo<RoundedButtonProps>(
  ({
    onPress,
    disabled = false,
    loading = false,
    size = 'small',
    variant = 'outline',
    leftIcon,
    rightIcon,
    style,
    textStyle,
    children,
  }) => {
    const handlePress = () => {
      if (disabled || loading) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onPress();
    };

    const sizeStyles = {
      small: { height: 32, paddingHorizontal: 16, fontSize: 12 },
      medium: { height: 40, paddingHorizontal: 20, fontSize: 14 },
      large: { height: 48, paddingHorizontal: 24, fontSize: 16 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.brand.primary,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.white,
      },
      secondary: {
        backgroundColor: theme.colors.state.action,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.white,
      },
      outline: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.gray['1'],
        textColor: theme.colors.gray['4'],
      },
      ghost: {
        backgroundColor: theme.colors.transparent,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
        textColor: theme.colors.text.primary,
      },
    };

    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.roundedButton,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: currentVariant.backgroundColor,
            borderWidth: currentVariant.borderWidth,
            borderColor: currentVariant.borderColor,
          },
          pressed && styles.roundedPressed,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {leftIcon && <View style={styles.iconWrapperSmall}>{leftIcon}</View>}

        {typeof children === 'string' ? (
          <Text
            style={[
              styles.roundedText,
              {
                fontSize: currentSize.fontSize,
                color: currentVariant.textColor,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}

        {rightIcon && <View style={styles.iconWrapperSmall}>{rightIcon}</View>}
      </Pressable>
    );
  }
);

RoundedButton.displayName = 'RoundedButton';

// Floating Action Button (FAB) - circular button
interface FABProps {
  onPress: () => void;
  icon: ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export const FAB = memo<FABProps>(
  ({ onPress, icon, size = 'medium', variant = 'primary', disabled = false, style }) => {
    const handlePress = () => {
      if (disabled) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      onPress();
    };

    const sizeStyles = {
      small: 40,
      medium: 56,
      large: 72,
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.brand.primary,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
      },
      secondary: {
        backgroundColor: theme.colors.state.action,
        borderWidth: 0,
        borderColor: theme.colors.transparent,
      },
      outline: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.gray['1'],
      },
    };

    const buttonSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.fab,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: currentVariant.backgroundColor,
            borderWidth: currentVariant.borderWidth,
            borderColor: currentVariant.borderColor,
          },
          pressed && styles.fabPressed,
          disabled && styles.disabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {icon}
      </Pressable>
    );
  }
);

FAB.displayName = 'FAB';

const styles = StyleSheet.create({
  // Common Styles
  disabled: {
    opacity: 0.5,
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow('lg'),
  },
  fabPressed: {
    transform: [{ scale: 0.9 }],
  },
  fullWidth: {
    width: '100%',
  },
  iconWrapper: {
    marginHorizontal: 4,
  },
  iconWrapperSmall: {
    marginHorizontal: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  roundedButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    ...createShadow('sm'),
  },
  roundedPressed: {
    transform: [{ scale: 0.95 }],
  },
  roundedText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: theme.typography.fontWeight.medium,
  },
  squareButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    ...createShadow('sm'),
  },
  text: {
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
