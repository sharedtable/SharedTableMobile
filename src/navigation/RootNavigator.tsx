import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { LoadingScreen } from '@/screens/LoadingScreen';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { useUserData } from '@/hooks/useUserData';
import { NotificationsListScreen } from '@/screens/notifications/NotificationsListScreen';
import EventDetailsScreen from '@/screens/events/EventDetailsScreen';
import { HowItWorksScreen } from '@/screens/info/HowItWorksScreen';
import { FAQsScreen } from '@/screens/info/FAQsScreen';
import { WaitlistScreen } from '@/screens/waitlist/WaitlistScreen';
import RefineExperienceScreen from '@/screens/booking/RefineExperienceScreen';

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
  Waitlist: undefined;
  NotificationsList: undefined;
  EventDetails: {
    eventId: string;
  };
  HowItWorks: undefined;
  FAQs: undefined;
  RefineExperience: {
    bookingId?: string;
    dinnerData?: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, needsOnboarding, onboardingStatus, continueOnboardingScreen } = useAuthStore();
  const { userData, loading: userDataLoading } = useUserData();

  if (isLoading || userDataLoading) {
    return <LoadingScreen />;
  }

  // Check if user has access to the app
  const hasAccess = userData?.access_granted === true;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {isAuthenticated ? (
        <>
          {/* Check if user has access to the app */}
          {!hasAccess ? (
            // User is on waitlist - show waitlist but allow onboarding
            <>
              <Stack.Screen name="Waitlist" component={WaitlistScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
            </>
          ) : (
            // User has access, check onboarding status
            <>
              {needsOnboarding || onboardingStatus === OnboardingStatus.NOT_STARTED || continueOnboardingScreen ? (
                // Not started or continuing optional onboarding - go to onboarding screens
                <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
              ) : (
                // All other statuses go to home (with prompts for incomplete stages)
                <Stack.Screen name="Main" component={MainTabNavigator} />
              )}
            </>
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
          <Stack.Screen 
            name="HowItWorks" 
            component={HowItWorksScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="FAQs" 
            component={FAQsScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="RefineExperience" 
            component={RefineExperienceScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
