import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';

// Import only required onboarding screens
import { OnboardingProvider } from '@/lib/onboarding/context-simple';
import { OnboardingBirthdayScreen } from '@/screens/onboarding/OnboardingBirthdayScreen';
import { OnboardingGenderScreen } from '@/screens/onboarding/OnboardingGenderScreen';
import { OnboardingNameScreen } from '@/screens/onboarding/OnboardingNameScreen';
import { AuthAPI } from '@/services/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { __DEV__, devLog } from '@/utils/env';

export type OnboardingStackParamList = {
  OnboardingName: undefined;
  OnboardingBirthday: undefined;
  OnboardingGender: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// Create a wrapper component for each screen that provides navigation
const createScreenWrapper = (ScreenComponent: any, nextScreen?: string, currentStep?: number) => {
  return () => {
    const navigation = useNavigation<StackNavigationProp<OnboardingStackParamList>>();
    const { setNeedsOnboarding } = useAuthStore();

    const handleNavigate = async (screen: string, data?: any) => {
      if (__DEV__) {
        devLog('Onboarding navigation:', { from: ScreenComponent.name, to: screen, data });
      }

      // Handle special navigation cases
      if (screen === 'onboarding-birthday') {
        navigation.navigate('OnboardingBirthday');
      } else if (screen === 'onboarding-gender') {
        navigation.navigate('OnboardingGender');
      } else if (screen === 'onboarding-complete' || screen === 'home') {
        // Mark onboarding as complete
        try {
          await AuthAPI.updateProfile({ onboarding_completed: true });
          setNeedsOnboarding(false);
          // Navigation to Main will happen automatically via RootNavigator
        } catch (error) {
          if (__DEV__) {
            console.error('Failed to mark onboarding complete:', error);
          }
        }
      } else if (screen === 'welcome') {
        // Go back to previous screen
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    };

    return (
      <ScreenComponent onNavigate={handleNavigate} currentStep={currentStep} totalSteps={3} />
    );
  };
};

export function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator
        initialRouteName="OnboardingName"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="OnboardingName"
          component={createScreenWrapper(OnboardingNameScreen, 'OnboardingBirthday', 1)}
        />
        <Stack.Screen
          name="OnboardingBirthday"
          component={createScreenWrapper(OnboardingBirthdayScreen, 'OnboardingGender', 2)}
        />
        <Stack.Screen
          name="OnboardingGender"
          component={createScreenWrapper(OnboardingGenderScreen, undefined, 3)}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
