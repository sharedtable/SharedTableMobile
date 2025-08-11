import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

// Tab Screens - Not implemented yet
// import { BookingsScreen } from '@/screens/main/BookingsScreen';
// import { EventsScreen } from '@/screens/main/EventsScreen';
// import { HomeScreen } from '@/screens/main/HomeScreen';
// import { ProfileScreen } from '@/screens/main/ProfileScreen';
// import { useNotificationStore } from '@/store/notificationStore';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Bookings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const unreadCount = 0; // useNotificationStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981', // Emerald color
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#10B981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      {/* <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: 'My Bookings',
        }}
      /> */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
