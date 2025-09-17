import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import mandatory onboarding screens only
import { OnboardingProvider } from '@/lib/onboarding/context-simple';
import { OnboardingNameScreen } from '@/screens/onboarding/OnboardingNameScreen';
import { OnboardingBirthdayScreen } from '@/screens/onboarding/OnboardingBirthdayScreen';
import { OnboardingGenderScreen } from '@/screens/onboarding/OnboardingGenderScreen';
import { useAuthStore } from '@/store/authStore';
import { __DEV__ } from '@/utils/env';

export type OnboardingStackParamList = {
  // Mandatory screens only (1-3)
  OnboardingName: undefined;
  OnboardingBirthday: undefined;
  OnboardingGender: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// Wrapper to handle navigation between screens
const createScreenWrapper = (
  ScreenComponent: React.ComponentType<{
    onNavigate: (screen: string) => void;
    currentStep?: number;
    totalSteps?: number;
  }>,
  nextScreen?: string,
  currentStep?: number,
  totalSteps: number = 3  // Only 3 mandatory steps
) => {
  const ScreenWrapper = () => {
    const navigation = useNavigation();

    const handleNavigate = (screen: string, _data?: unknown) => {
      if (__DEV__) {
        console.log(`🔄 [OnboardingNavigator] Navigating from ${ScreenComponent.name} to ${screen}`);
      }

      switch (screen) {
        case 'onboarding-name':
          (navigation as any).navigate('OnboardingName');
          break;
        case 'onboarding-birthday':
          (navigation as any).navigate('OnboardingBirthday');
          break;
        case 'onboarding-gender':
          (navigation as any).navigate('OnboardingGender');
          break;
        case 'welcome':
        case 'back':
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // If can't go back within onboarding, try parent navigator (to go back to Waitlist)
            const parentNav = navigation.getParent();
            if (parentNav && parentNav.canGoBack()) {
              parentNav.goBack();
            } else {
              console.log('Cannot go back');
            }
          }
          break;
        case 'home':
        case 'main':
          // Navigation to Main is handled by RootNavigator based on state changes
          // We don't need to navigate here since the state update will trigger the navigation
          console.log('[OnboardingNavigator] Skipping navigation - handled by RootNavigator');
          break;
        default:
          if (__DEV__) {
            console.warn(`Unknown navigation target: ${screen}`);
          }
      }
    };

    return (
      <ScreenComponent
        onNavigate={handleNavigate}
        currentStep={currentStep}
        totalSteps={totalSteps}
      />
    );
  };

  ScreenWrapper.displayName = `${ScreenComponent.name}Wrapper`;
  return ScreenWrapper;
};

export function OnboardingNavigator() {
  const { continueOnboardingScreen, setContinueOnboarding } = useAuthStore();
  
  // Determine initial route
  let initialRouteName = 'OnboardingName';
  
  if (continueOnboardingScreen) {
    switch (continueOnboardingScreen) {
      case 'birthday':
        initialRouteName = 'OnboardingBirthday';
        break;
      case 'gender':
        initialRouteName = 'OnboardingGender';
        break;
      default:
        initialRouteName = 'OnboardingName';
    }
  }
  
  // Clear the continue screen flag after using it
  React.useEffect(() => {
    if (continueOnboardingScreen) {
      setContinueOnboarding(null);
    }
  }, [continueOnboardingScreen, setContinueOnboarding]);
  
  return (
    <OnboardingProvider>
      <Stack.Navigator
        initialRouteName={initialRouteName as keyof OnboardingStackParamList}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Mandatory screens only */}
        <Stack.Screen
          name="OnboardingName"
          component={createScreenWrapper(OnboardingNameScreen, 'onboarding-birthday', 1)}
        />
        <Stack.Screen
          name="OnboardingBirthday"
          component={createScreenWrapper(OnboardingBirthdayScreen, 'onboarding-gender', 2)}
        />
        <Stack.Screen
          name="OnboardingGender"
          component={createScreenWrapper(OnboardingGenderScreen, undefined, 3)}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}