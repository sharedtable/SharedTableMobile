import * as Haptics from 'expo-haptics';
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

export const Button = memo<ButtonProps>(
  ({
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
        const baseStyle: (ViewStyle | false | undefined)[] = [
          styles.base,
          variant === 'text' ? styles.textVariant : (styles as any)[variant],
          (styles as any)[size],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          isDisabled && (styles as any)[`${variant}Disabled`],
          pressed && styles.pressed,
          style,
        ];

        return baseStyle.filter(Boolean) as ViewStyle[];
      },
      [variant, size, fullWidth, isDisabled, style]
    );

    const getTextStyle = useCallback((): TextStyle[] => {
      const textStyles: (TextStyle | false | undefined)[] = [
        styles.text,
        (styles as any)[`${variant}Text`],
        (styles as any)[`${size}Text`],
        isDisabled && styles.disabledText,
        textStyle,
      ];
      return textStyles.filter(Boolean) as TextStyle[];
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
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
    ...createShadow('sm'),
  },

  // All styles in alphabetical order
  danger: {
    backgroundColor: theme.colors.error.main,
  },
  dangerDisabled: {
    backgroundColor: theme.colors.gray['2'],
  },
  dangerText: {
    color: theme.colors.neutral.white,
  },
  disabled: {
    opacity: designTokens.opacity.disabled,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  fullWidth: {
    width: '100%',
  },
  large: {
    gap: theme.spacing.sm,
    height: designTokens.components.button.height.large,
    paddingHorizontal: theme.spacing.xl,
  },
  largeText: {
    fontSize: theme.typography.fontSize.lg,
  },
  medium: {
    gap: theme.spacing.sm,
    height: designTokens.components.button.height.medium,
    paddingHorizontal: theme.spacing.lg,
  },
  mediumText: {
    fontSize: theme.typography.fontSize.base,
  },
  pressed: {
    opacity: designTokens.opacity.pressed,
    transform: [{ scale: designTokens.touch.pressScale }],
  },
  primary: {
    backgroundColor: theme.colors.brand.primary,
  },
  primaryDisabled: {
    backgroundColor: theme.colors.gray['2'],
  },
  primaryText: {
    color: theme.colors.primary.contrast,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.brand.primary,
    borderWidth: 1,
  },
  secondaryDisabled: {
    borderColor: theme.colors.gray['2'],
  },
  secondaryText: {
    color: theme.colors.brand.primary,
  },
  small: {
    gap: theme.spacing.xs,
    height: designTokens.components.button.height.small,
    paddingHorizontal: theme.spacing.md,
  },
  smallText: {
    fontSize: theme.typography.fontSize.sm,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  textDisabled: {},
  textText: {
    color: theme.colors.brand.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
});
