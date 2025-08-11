import * as Haptics from 'expo-haptics';
import React, { memo, useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet, Text, Platform } from 'react-native';

import { theme } from '@/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  trackColor?: {
    false: string;
    true: string;
  };
  thumbColor?: string;
}

export const Switch = memo<SwitchProps>(
  ({
    value,
    onValueChange,
    disabled = false,
    label,
    labelPosition = 'left',
    size = 'medium',
    trackColor = {
      false: theme.colors.gray['2'],
      true: theme.colors.brand.primary,
    },
    thumbColor = theme.colors.white,
  }) => {
    const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

    const sizeConfig = {
      small: { width: 36, height: 20, thumbSize: 16, padding: 2 },
      medium: { width: 48, height: 28, thumbSize: 24, padding: 2 },
      large: { width: 60, height: 34, thumbSize: 30, padding: 2 },
    };

    const config = sizeConfig[size];
    const thumbTranslateX = translateX.interpolate({
      inputRange: [0, 1],
      outputRange: [config.padding, config.width - config.thumbSize - config.padding],
    });

    useEffect(() => {
      Animated.timing(translateX, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [value, translateX]);

    const handlePress = () => {
      if (disabled) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onValueChange(!value);
    };

    const switchElement = (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.track,
          {
            width: config.width,
            height: config.height,
            backgroundColor: value ? trackColor.true : trackColor.false,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: config.thumbSize,
              height: config.thumbSize,
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      </Pressable>
    );

    if (!label) {
      return switchElement;
    }

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[styles.container, labelPosition === 'right' && styles.containerReverse]}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {switchElement}
      </Pressable>
    );
  }
);

Switch.displayName = 'Switch';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  containerReverse: {
    flexDirection: 'row-reverse',
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
  },
  labelDisabled: {
    color: theme.colors.gray['3'],
  },
  thumb: {
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  track: {
    borderRadius: 999,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
