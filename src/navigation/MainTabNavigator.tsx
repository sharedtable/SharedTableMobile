import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { OptimizedChatScreen } from '@/screens/chat/OptimizedChatScreen';
// import { FeedNavigator } from './FeedNavigator'; // Hidden for now
import { ProfileNavigator } from './ProfileNavigator';
import { theme } from '@/theme';
import { useNotificationStore } from '@/store/notificationStore';

export type MainTabParamList = {
  Home: undefined;
  // Feed: undefined; // Hidden for now - will be re-enabled when feature is polished
  Dashboard: undefined;
  Profile: undefined;
  Chat: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const _unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          // } else if (route.name === 'Feed') {
          //   iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: theme.colors.primary.main,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />
      {/* Hidden for now - will be re-enabled when feature is polished
      <Tab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{
          title: 'Feed',
        }}
      />
      */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={OptimizedChatScreen}
        options={{
          title: 'Chat',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
