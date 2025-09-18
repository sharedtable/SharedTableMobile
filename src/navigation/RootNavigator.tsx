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
import PostDinnerSurveyScreen from '@/screens/post-dinner/PostDinnerSurveyScreen';

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
  OptionalOnboarding: { screen?: keyof OptionalOnboardingStackParamList; prefilledData?: any };
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
  PostDinnerSurvey: {
    bookingId: string;
    dinnerId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, needsOnboarding, onboardingStatus, continueOnboardingScreen, setNeedsOnboarding, setOnboardingStatus } = useAuthStore();
  const { userData, loading: userDataLoading, refetch: refetchUserData } = useUserData();
  
  // Force re-render when onboarding completes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Initialize needsOnboarding based on database data
  React.useEffect(() => {
    if (isAuthenticated && userData && !userDataLoading) {
      // Determine if user needs onboarding based on database onboarding_status
      const dbStatus = userData.onboarding_status;
      
      if (dbStatus === 'not_started' || !dbStatus) {
        // New user or user hasn't completed mandatory onboarding
        setNeedsOnboarding(true);
        setOnboardingStatus(OnboardingStatus.NOT_STARTED);
      } else if (dbStatus === 'mandatory_complete' || 
                 dbStatus === 'optional_complete' || 
                 dbStatus === 'fully_complete') {
        // User has completed mandatory onboarding
        setNeedsOnboarding(false);
        
        // Set the correct onboarding status enum
        if (dbStatus === 'mandatory_complete') {
          setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
        } else if (dbStatus === 'fully_complete') {
          setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
        }
      }
    }
  }, [isAuthenticated, userData, userDataLoading, setNeedsOnboarding, setOnboardingStatus]);
  
  // Debug logging and force update on state changes
  React.useEffect(() => {
    console.log('🔄 [RootNavigator] State:', {
      isAuthenticated,
      needsOnboarding,
      onboardingStatus,
      hasAccess: userData?.access_granted,
      continueOnboardingScreen,
      dbOnboardingStatus: userData?.onboarding_status
    });
    
    // Force re-render when transitioning from onboarding to main
    if (!needsOnboarding && onboardingStatus === 'mandatory_complete') {
      console.log('🔄 [RootNavigator] Forcing re-render for navigation update');
      forceUpdate();
      // Also refetch user data to get latest access_granted status
      refetchUserData();
    }
  }, [isAuthenticated, needsOnboarding, onboardingStatus, userData?.access_granted, userData?.onboarding_status, continueOnboardingScreen]);

  if (isLoading || userDataLoading) {
    return <LoadingScreen />;
  }

  // Check if user has access to the app from database
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
          {(() => {
            // Simple decision logic:
            // 1. If needsOnboarding is false -> Show Main (for users with access) or Waitlist (without access)
            // 2. If needsOnboarding is true -> Show Onboarding or Waitlist based on access
            
            console.log('🎯 [RootNavigator] Navigation state:', {
              needsOnboarding,
              hasAccess,
              onboardingStatus
            });
            
            if (!needsOnboarding) {
              // Onboarding is done
              if (hasAccess) {
                // Has access + onboarding done = Main
                return <Stack.Screen name="Main" component={MainTabNavigator} />;
              } else {
                // No access + onboarding done = Waitlist
                return <Stack.Screen name="Waitlist" component={WaitlistScreen} />;
              }
            } else {
              // Still needs onboarding
              if (hasAccess) {
                // Has access + needs onboarding = Onboarding
                return <Stack.Screen name="Onboarding" component={OnboardingNavigator} />;
              } else {
                // No access + needs onboarding = Waitlist (with Onboarding available)
                return (
                  <>
                    <Stack.Screen name="Waitlist" component={WaitlistScreen} />
                    <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
                  </>
                );
              }
            }
          })()}
          <Stack.Screen 
            name="OptionalOnboarding" 
            component={OptionalOnboardingNavigator}
            options={{
              headerShown: false,
            }}
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
          <Stack.Screen 
            name="PostDinnerSurvey" 
            component={PostDinnerSurveyScreen}
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
