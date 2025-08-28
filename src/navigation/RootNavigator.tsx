import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { LoadingScreen } from '@/screens/LoadingScreen';
import { useAuthStore } from '@/store/authStore';
import { NotificationsListScreen } from '@/screens/notifications/NotificationsListScreen';
import EventDetailsScreen from '@/screens/events/EventDetailsScreen';

// Navigators
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

// Screens

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  NotificationsList: undefined;
  EventDetails: {
    eventId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {isAuthenticated ? (
        <>
          {needsOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          )}
          <Stack.Screen 
            name="NotificationsList" 
            component={NotificationsListScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="EventDetails" 
            component={EventDetailsScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: true,
              headerTitle: 'Event Details',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
