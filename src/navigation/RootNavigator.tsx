import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { LoadingScreen } from '@/screens/LoadingScreen';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { NotificationsListScreen } from '@/screens/notifications/NotificationsListScreen';
import EventDetailsScreen from '@/screens/events/EventDetailsScreen';

// Navigators
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { OptionalOnboardingNavigator, type OptionalOnboardingStackParamList } from './OptionalOnboardingNavigator';

// Screens

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  OptionalOnboarding: { screen?: keyof OptionalOnboardingStackParamList };
  NotificationsList: undefined;
  EventDetails: {
    eventId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, needsOnboarding, onboardingStatus, continueOnboardingScreen } = useAuthStore();

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
          {/* Route based on onboarding status and continue flag */}
          {needsOnboarding || onboardingStatus === OnboardingStatus.NOT_STARTED || continueOnboardingScreen ? (
            // Not started or continuing optional onboarding - go to onboarding screens
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            // All other statuses go to home (with prompts for incomplete stages)
            <Stack.Screen name="Main" component={MainTabNavigator} />
          )}
          <Stack.Screen 
            name="OptionalOnboarding" 
            component={OptionalOnboardingNavigator}
          />
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
