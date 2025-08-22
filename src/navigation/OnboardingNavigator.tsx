import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';

// Import all onboarding screens
import { OnboardingProvider } from '@/lib/onboarding/context-simple';
import { OnboardingBirthdayScreen } from '@/screens/onboarding/OnboardingBirthdayScreen';
import { OnboardingDependentsScreen } from '@/screens/onboarding/OnboardingDependentsScreen';
import { OnboardingEthnicityScreen } from '@/screens/onboarding/OnboardingEthnicityScreen';
import { OnboardingGenderScreen } from '@/screens/onboarding/OnboardingGenderScreen';
import { OnboardingInterestsScreen } from '@/screens/onboarding/OnboardingInterestsScreen';
import { OnboardingLifestyleScreen } from '@/screens/onboarding/OnboardingLifestyleScreen';
import { OnboardingNameScreen } from '@/screens/onboarding/OnboardingNameScreen';
import { OnboardingPersonalityScreen } from '@/screens/onboarding/OnboardingPersonalityScreen';
import { OnboardingPhotoScreen } from '@/screens/onboarding/OnboardingPhotoScreen';
import { OnboardingRelationshipScreen } from '@/screens/onboarding/OnboardingRelationshipScreen';
import { OnboardingWorkScreen } from '@/screens/onboarding/OnboardingWorkScreen';
import { AuthAPI } from '@/services/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { __DEV__, devLog } from '@/utils/env';

export type OnboardingStackParamList = {
  OnboardingName: undefined;
  OnboardingBirthday: undefined;
  OnboardingGender: undefined;
  OnboardingDependents: undefined;
  OnboardingWork: undefined;
  OnboardingEthnicity: undefined;
  OnboardingRelationship: undefined;
  OnboardingLifestyle: undefined;
  OnboardingInterests: undefined;
  OnboardingPersonality: undefined;
  OnboardingPhoto: undefined;
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
      } else if (screen === 'onboarding-dependents') {
        navigation.navigate('OnboardingDependents');
      } else if (screen === 'onboarding-work') {
        navigation.navigate('OnboardingWork');
      } else if (screen === 'onboarding-ethnicity') {
        navigation.navigate('OnboardingEthnicity');
      } else if (screen === 'onboarding-relationship') {
        navigation.navigate('OnboardingRelationship');
      } else if (screen === 'onboarding-lifestyle') {
        navigation.navigate('OnboardingLifestyle');
      } else if (screen === 'onboarding-interests') {
        navigation.navigate('OnboardingInterests');
      } else if (screen === 'onboarding-personality') {
        navigation.navigate('OnboardingPersonality');
      } else if (screen === 'onboarding-photo') {
        navigation.navigate('OnboardingPhoto');
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
      <ScreenComponent onNavigate={handleNavigate} currentStep={currentStep} totalSteps={11} />
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
          component={createScreenWrapper(OnboardingGenderScreen, 'OnboardingDependents', 3)}
        />
        <Stack.Screen
          name="OnboardingDependents"
          component={createScreenWrapper(OnboardingDependentsScreen, 'OnboardingWork', 4)}
        />
        <Stack.Screen
          name="OnboardingWork"
          component={createScreenWrapper(OnboardingWorkScreen, 'OnboardingEthnicity', 5)}
        />
        <Stack.Screen
          name="OnboardingEthnicity"
          component={createScreenWrapper(OnboardingEthnicityScreen, 'OnboardingRelationship', 6)}
        />
        <Stack.Screen
          name="OnboardingRelationship"
          component={createScreenWrapper(OnboardingRelationshipScreen, 'OnboardingLifestyle', 7)}
        />
        <Stack.Screen
          name="OnboardingLifestyle"
          component={createScreenWrapper(OnboardingLifestyleScreen, 'OnboardingInterests', 8)}
        />
        <Stack.Screen
          name="OnboardingInterests"
          component={createScreenWrapper(OnboardingInterestsScreen, 'OnboardingPersonality', 9)}
        />
        <Stack.Screen
          name="OnboardingPersonality"
          component={createScreenWrapper(OnboardingPersonalityScreen, 'OnboardingPhoto', 10)}
        />
        <Stack.Screen
          name="OnboardingPhoto"
          component={createScreenWrapper(OnboardingPhotoScreen, undefined, 11)}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
