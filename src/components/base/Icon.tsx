import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { theme, designTokens } from '@/theme';
import * as Haptics from 'expo-haptics';

// Icon Configuration following Figma design rules
const ICON_CONFIG = {
  strokeWeight: 1.5, // Following 1-2 stroke weight rule
  defaultSize: 24,
  padding: 8, // Consistent padding for visual balance
  touchTargetSize: 44, // Minimum touch target
} as const;

// Icon sets from Figma design guide - matching the shown icons
export type IconName = 
  // Core UI Icons (from Figma)
  | 'light-bulb'     // 💡 Ideas/Tips
  | 'settings'       // ⚙️ Settings
  | 'bell'          // 🔔 Notifications
  | 'mail'          // ✉️ Messages
  | 'star'          // ⭐ Favorites
  | 'calendar'      // 📅 Events
  | 'search'        // 🔍 Search
  | 'heart'         // ❤️ Likes
  | 'trash'         // 🗑️ Delete
  | 'trophy'        // 🏆 Achievements
  | 'flame'         // 🔥 Trending/Hot
  
  // Navigation
  | 'home'
  | 'menu'
  | 'close'
  | 'back'
  | 'forward'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  
  // Actions
  | 'add'
  | 'plus'
  | 'edit'
  | 'save'
  | 'share'
  | 'filter'
  | 'sort'
  | 'refresh'
  | 'more-horizontal'
  | 'more-vertical'
  
  // Status & Feedback
  | 'check'
  | 'x'
  | 'alert-circle'
  | 'info'
  | 'check-circle'
  | 'x-circle'
  
  // User & Social
  | 'user'
  | 'users'
  | 'user-plus'
  | 'user-check'
  | 'message-circle'
  | 'camera'
  | 'image'
  
  // Location & Time
  | 'map-pin'
  | 'map'
  | 'clock'
  | 'calendar'
  
  // Charts & Analytics
  | 'bar-chart-2'
  
  // Food & Dining (custom)
  | 'restaurant'
  | 'coffee'
  
  // Booking & Payment
  | 'ticket'
  | 'credit-card'
  | 'gift'
  | 'shopping-bag'
  
  // Communication
  | 'phone'
  | 'mail'
  | 'message-square'
  | 'send'
  
  // Authentication
  | 'eye'
  | 'eye-off'
  | 'logo-google'
  | 'logo-apple'
  | 'checkmark';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
  withPadding?: boolean;
}

// Prioritize Feather icons for consistent stroke weight (2px)
const iconMap: Record<IconName, { library: string; name: string }> = {
  // Core UI Icons (matching Figma)
  'light-bulb': { library: 'Feather', name: 'zap' }, // Using zap as alternative
  'settings': { library: 'Feather', name: 'settings' },
  'bell': { library: 'Feather', name: 'bell' },
  'mail': { library: 'Feather', name: 'mail' },
  'star': { library: 'Feather', name: 'star' },
  'calendar': { library: 'Feather', name: 'calendar' },
  'search': { library: 'Feather', name: 'search' },
  'heart': { library: 'Feather', name: 'heart' },
  'trash': { library: 'Feather', name: 'trash-2' },
  'trophy': { library: 'Feather', name: 'award' },
  'flame': { library: 'Ionicons', name: 'flame' }, // Fallback to Ionicons
  
  // Navigation
  'home': { library: 'Feather', name: 'home' },
  'menu': { library: 'Feather', name: 'menu' },
  'close': { library: 'Feather', name: 'x' },
  'back': { library: 'Feather', name: 'arrow-left' },
  'forward': { library: 'Feather', name: 'arrow-right' },
  'chevron-down': { library: 'Feather', name: 'chevron-down' },
  'chevron-up': { library: 'Feather', name: 'chevron-up' },
  'chevron-left': { library: 'Feather', name: 'chevron-left' },
  'chevron-right': { library: 'Feather', name: 'chevron-right' },
  
  // Actions
  'add': { library: 'Feather', name: 'plus' },
  'plus': { library: 'Feather', name: 'plus' },
  'edit': { library: 'Feather', name: 'edit-2' },
  'save': { library: 'Feather', name: 'save' },
  'share': { library: 'Feather', name: 'share-2' },
  'filter': { library: 'Feather', name: 'filter' },
  'sort': { library: 'Feather', name: 'list' },
  'refresh': { library: 'Feather', name: 'refresh-cw' },
  'more-horizontal': { library: 'Feather', name: 'more-horizontal' },
  'more-vertical': { library: 'Feather', name: 'more-vertical' },
  
  // Status & Feedback
  'check': { library: 'Feather', name: 'check' },
  'x': { library: 'Feather', name: 'x' },
  'alert-circle': { library: 'Feather', name: 'alert-circle' },
  'info': { library: 'Feather', name: 'info' },
  'check-circle': { library: 'Feather', name: 'check-circle' },
  'x-circle': { library: 'Feather', name: 'x-circle' },
  
  // User & Social
  'user': { library: 'Feather', name: 'user' },
  'users': { library: 'Feather', name: 'users' },
  'user-plus': { library: 'Feather', name: 'user-plus' },
  'user-check': { library: 'Feather', name: 'user-check' },
  'message-circle': { library: 'Feather', name: 'message-circle' },
  'camera': { library: 'Feather', name: 'camera' },
  'image': { library: 'Feather', name: 'image' },
  
  // Location & Time
  'map-pin': { library: 'Feather', name: 'map-pin' },
  'map': { library: 'Feather', name: 'map' },
  'clock': { library: 'Feather', name: 'clock' },
  
  // Charts & Analytics
  'bar-chart-2': { library: 'Feather', name: 'bar-chart-2' },
  
  // Food & Dining (fallback to other libraries)
  'restaurant': { library: 'Ionicons', name: 'restaurant' },
  'coffee': { library: 'Feather', name: 'coffee' },
  
  // Booking & Payment
  'ticket': { library: 'Feather', name: 'tag' },
  'credit-card': { library: 'Feather', name: 'credit-card' },
  'gift': { library: 'Feather', name: 'gift' },
  'shopping-bag': { library: 'Feather', name: 'shopping-bag' },
  
  // Communication
  'phone': { library: 'Feather', name: 'phone' },
  'message-square': { library: 'Feather', name: 'message-square' },
  'send': { library: 'Feather', name: 'send' },
  
  // Authentication
  'eye': { library: 'Feather', name: 'eye' },
  'eye-off': { library: 'Feather', name: 'eye-off' },
  'logo-google': { library: 'Ionicons', name: 'logo-google' },
  'logo-apple': { library: 'Ionicons', name: 'logo-apple' },
  'checkmark': { library: 'Ionicons', name: 'checkmark' },
};

export const Icon = memo<IconProps>(({ 
  name, 
  size = ICON_CONFIG.defaultSize, 
  color = theme.colors.text.primary,
  strokeWidth = ICON_CONFIG.strokeWeight,
  style,
  withPadding = false,
}) => {
  const iconConfig = iconMap[name];
  
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  const iconElement = (() => {
    const baseProps = {
      name: iconConfig.name,
      size,
      color,
      style,
    };

    // Feather icons support strokeWidth prop
    const featherProps = {
      ...baseProps,
      strokeWidth: iconConfig.library === 'Feather' ? strokeWidth : undefined,
    };

    switch (iconConfig.library) {
      case 'Ionicons':
        return <Ionicons {...baseProps} />;
      case 'MaterialIcons':
        return <MaterialIcons {...baseProps} />;
      case 'Feather':
        return <Feather {...featherProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...baseProps} />;
      default:
        return <Ionicons {...baseProps} />;
    }
  })();

  // Add consistent padding if requested
  if (withPadding) {
    return (
      <View style={[styles.iconContainer, { padding: ICON_CONFIG.padding }]}>
        {iconElement}
      </View>
    );
  }

  return iconElement;
});

Icon.displayName = 'Icon';

// Icon button variant with touch feedback
interface IconButtonProps extends Omit<IconProps, 'withPadding'> {
  onPress?: () => void;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  disabled?: boolean;
  haptic?: boolean;
}

export const IconButton = memo<IconButtonProps>(({
  onPress,
  backgroundColor,
  padding = ICON_CONFIG.padding,
  borderRadius = theme.borderRadius.full,
  disabled = false,
  haptic = true,
  ...iconProps
}) => {
  const handlePress = () => {
    if (disabled || !onPress) return;
    
    if (haptic && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        {
          padding,
          borderRadius,
          backgroundColor: backgroundColor || 'transparent',
          opacity: pressed ? 0.7 : disabled ? 0.3 : 1,
          minWidth: ICON_CONFIG.touchTargetSize,
          minHeight: ICON_CONFIG.touchTargetSize,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Icon {...iconProps} withPadding={false} />
    </Pressable>
  );
});

IconButton.displayName = 'IconButton';

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});