import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { Logo } from '@/components/base/Logo';
import { theme } from '@/theme';
import { scaleHeight, scaleFont } from '@/utils/responsive';

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  showSettings?: boolean;
  notificationCount?: number;
  onBack?: () => void;
  onMenu?: () => void;
  onSearch?: () => void;
  onNotification?: () => void;
  onSettings?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  variant?: 'light' | 'dark' | 'transparent';
}

export const TopBar = memo<TopBarProps>(
  ({
    title,
    showLogo = false,
    showBack = false,
    showMenu = false,
    showSearch = false,
    showNotification = false,
    showSettings = false,
    notificationCount = 0,
    onBack,
    onMenu,
    onSearch,
    onNotification,
    onSettings,
    rightAction,
    transparent = false,
    variant = 'light',
  }) => {
    const insets = useSafeAreaInsets();

    const handlePress = (callback?: () => void) => {
      if (!callback) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      callback();
    };

    const getColors = () => {
      switch (variant) {
        case 'dark':
          return {
            background: theme.colors.black['2'],
            text: theme.colors.white,
            icon: theme.colors.white,
          };
        case 'transparent':
          return {
            background: 'transparent',
            text: theme.colors.white,
            icon: theme.colors.white,
          };
        default:
          return {
            background: theme.colors.white,
            text: theme.colors.text.primary,
            icon: theme.colors.text.primary,
          };
      }
    };

    const colors = getColors();

    return (
      <>
        <StatusBar
          barStyle={variant === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={transparent ? 'transparent' : colors.background}
          translucent={transparent}
        />
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              backgroundColor: colors.background,
            },
            transparent && styles.transparent,
            !transparent && variant === 'light' && styles.shadow,
          ]}
        >
          <View style={styles.content}>
            {/* Left Section */}
            <View style={styles.leftSection}>
              {showBack && onBack && (
                <Pressable
                  onPress={() => handlePress(onBack)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Icon name="back" size={24} color={colors.icon} />
                </Pressable>
              )}

              {showMenu && onMenu && (
                <Pressable
                  onPress={() => handlePress(onMenu)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Open menu"
                >
                  <Icon name="menu" size={24} color={colors.icon} />
                </Pressable>
              )}

              {showLogo && !showBack && !showMenu && <Logo size="small" />}
            </View>

            {/* Center Section */}
            <View style={styles.centerSection}>
              {(() => {
                if (title) {
                  return (
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                  );
                }
                if (showLogo && (showBack || showMenu)) {
                  return <Logo size="small" />;
                }
                return null;
              })()}
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              {showSearch && onSearch && (
                <Pressable
                  onPress={() => handlePress(onSearch)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                >
                  <Icon name="search" size={24} color={colors.icon} />
                </Pressable>
              )}

              {showNotification && onNotification && (
                <Pressable
                  onPress={() => handlePress(onNotification)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount} new` : ''}`}
                >
                  <Icon name="bell" size={24} color={colors.icon} />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}

              {showSettings && onSettings && (
                <Pressable
                  onPress={() => handlePress(onSettings)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                >
                  <Icon name="settings" size={24} color={colors.icon} />
                </Pressable>
              )}

              {rightAction}
            </View>
          </View>
        </View>
      </>
    );
  }
);

TopBar.displayName = 'TopBar';

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: 10,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  centerSection: {
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 0,
    elevation: 4, // For Android
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: scaleHeight(56),
    paddingHorizontal: theme.spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconPressed: {
    backgroundColor: `${theme.colors.gray['1']}50`,
  },
  leftSection: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black['1'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
  },
  transparent: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
