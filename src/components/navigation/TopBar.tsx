import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/base/Icon';
import { Logo } from '@/components/base/Logo';
import { theme, designTokens } from '@/theme';

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
  onBack?: () => void;
  onMenu?: () => void;
  onSearch?: () => void;
  onNotification?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  variant?: 'light' | 'dark' | 'transparent';
}

export const TopBar = memo<TopBarProps>(({
  title,
  showLogo = false,
  showBack = false,
  showMenu = false,
  showSearch = false,
  showNotification = false,
  notificationCount = 0,
  onBack,
  onMenu,
  onSearch,
  onNotification,
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
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon name="back" size={24} color={colors.icon} />
              </Pressable>
            )}
            
            {showMenu && onMenu && (
              <Pressable
                onPress={() => handlePress(onMenu)}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <Icon name="menu" size={24} color={colors.icon} />
              </Pressable>
            )}

            {showLogo && !showBack && !showMenu && (
              <Logo size="small" />
            )}
          </View>

          {/* Center Section */}
          <View style={styles.centerSection}>
            {title ? (
              <Text 
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : showLogo && (showBack || showMenu) ? (
              <Logo size="small" />
            ) : null}
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {showSearch && onSearch && (
              <Pressable
                onPress={() => handlePress(onSearch)}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Icon name="search" size={24} color={colors.icon} />
              </Pressable>
            )}

            {showNotification && onNotification && (
              <Pressable
                onPress={() => handlePress(onNotification)}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconPressed,
                ]}
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

            {rightAction}
          </View>
        </View>
      </View>
    </>
  );
});

TopBar.displayName = 'TopBar';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    zIndex: designTokens.zIndex.sticky,
  },
  transparent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    height: designTokens.layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.heading,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPressed: {
    backgroundColor: `${theme.colors.gray['1']}50`,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.brand.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
});