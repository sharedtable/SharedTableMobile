import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/base/Icon';
import { theme } from '@/theme';
import { Colors } from '@/constants/colors';
import { scaleFont } from '@/utils/responsive';

export type TabName = 'home' | 'events' | 'dashboard' | 'profile' | 'chat';

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
  { name: 'chat', label: 'Chat', icon: 'chatbubble' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <Pressable
              key={tab.name}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              onPress={() => onTabPress(tab.name)}
            >
              <View style={styles.iconContainer}>
                <Icon
                  name={tab.icon as IconName}
                  size={24}
                  color={isActive ? theme.colors.white : Colors.whiteOverlay}
                />
                {isActive && <View style={styles.activeIndicator} />}
              </View>
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
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
  activeIndicator: {
    backgroundColor: theme.colors.white,
    borderRadius: 2,
    bottom: -6,
    height: 4,
    position: 'absolute',
    width: 4,
  },
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
  iconContainer: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    marginTop: 4,
  },
  labelActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  labelInactive: {
    color: Colors.whiteOverlay,
    fontWeight: '400',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
  },
  tabPressed: {
    opacity: 0.8,
  },
});
