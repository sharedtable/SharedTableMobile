import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View, Platform, Image } from 'react-native';

import { theme } from '@/theme';

interface GoogleCalendarButtonProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'full';
  disabled?: boolean;
}

export const GoogleCalendarButton = memo<GoogleCalendarButtonProps>(
  ({ onPress, size = 'medium', variant = 'icon', disabled = false }) => {
    const handlePress = () => {
      if (disabled) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onPress();
    };

    const sizeConfig = {
      small: { iconSize: 20, buttonSize: 36 },
      medium: { iconSize: 24, buttonSize: 44 },
      large: { iconSize: 32, buttonSize: 56 },
    };

    const config = sizeConfig[size];

    if (variant === 'icon') {
      return (
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.iconButton,
            {
              width: config.buttonSize,
              height: config.buttonSize,
            },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open Google Calendar"
          accessibilityState={{ disabled }}
        >
          <MaterialCommunityIcons name="google" size={config.iconSize} color="#4285F4" />
        </Pressable>
      );
    }

    // Full Google Calendar logo/icon
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.fullButton,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add to Google Calendar"
        accessibilityState={{ disabled }}
      >
        <View style={styles.calendarIconContainer}>
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
            }}
            style={styles.calendarImage}
            resizeMode="contain"
          />
        </View>
      </Pressable>
    );
  }
);

GoogleCalendarButton.displayName = 'GoogleCalendarButton';

// Alternative: Calendar icon in brand colors
export const CalendarIcon = memo<{ size?: number; color?: string }>(
  ({ size = 24, color = theme.colors.brand.primary }) => {
    return <MaterialCommunityIcons name="calendar-month" size={size} color={color} />;
  }
);

CalendarIcon.displayName = 'CalendarIcon';

const styles = StyleSheet.create({
  calendarIconContainer: {
    height: 24,
    width: 24,
  },
  calendarImage: {
    height: '100%',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  fullButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black['1'],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.transparent,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
