import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

export type TabName = 'home' | 'events' | 'dashboard' | 'profile';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabItem {
  name: TabName;
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'events', label: 'Events', icon: 'calendar' },
  { name: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <Pressable
              key={tab.name}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
              onPress={() => onTabPress(tab.name)}
            >
              <View style={styles.iconContainer}>
                <Icon
                  name={tab.icon}
                  size={24}
                  color={isActive ? theme.colors.white : 'rgba(255, 255, 255, 0.6)'}
                />
                {isActive && <View style={styles.activeIndicator} />}
              </View>
              <Text style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary.main,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.white,
  },
  label: {
    fontSize: scaleFont(11),
    marginTop: 4,
    fontFamily: theme.typography.fontFamily.body,
  },
  labelActive: {
    color: theme.colors.white,
    fontWeight: '600' as any,
  },
  labelInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400' as any,
  },
});