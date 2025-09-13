import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React from 'react';

import { OnboardingProvider } from '@/lib/onboarding/context-simple';
import { OnboardingEducationScreen } from '@/screens/onboarding/OnboardingEducationScreen';
import { OnboardingWorkScreen } from '@/screens/onboarding/OnboardingWorkScreen';
import { OnboardingEthnicityScreen } from '@/screens/onboarding/OnboardingEthnicityScreen';
import { OnboardingPersonalityScreen } from '@/screens/onboarding/OnboardingPersonalityScreen';
import { OnboardingLifestyleScreen } from '@/screens/onboarding/OnboardingLifestyleScreen';
import { OnboardingFoodPreferences1Screen } from '@/screens/onboarding/OnboardingFoodPreferences1Screen';
import { OnboardingFoodPreferences2Screen } from '@/screens/onboarding/OnboardingFoodPreferences2Screen';
import { OnboardingFoodPreferences3Screen } from '@/screens/onboarding/OnboardingFoodPreferences3Screen';
import { OnboardingFoodPreferences4Screen } from '@/screens/onboarding/OnboardingFoodPreferences4Screen';
import { OnboardingInterestsScreen } from '@/screens/onboarding/OnboardingInterestsScreen';
import { OnboardingHopingToMeetScreen } from '@/screens/onboarding/OnboardingHopingToMeetScreen';
import { OnboardingHobbiesScreen } from '@/screens/onboarding/OnboardingHobbiesScreen';
import { OnboardingInterestingFactScreen } from '@/screens/onboarding/OnboardingInterestingFactScreen';
import { useAuthStore } from '@/store/authStore';
import { __DEV__ } from '@/utils/env';

export type OptionalOnboardingStackParamList = {
  Education: undefined;
  Work: undefined;
  Background: undefined;
  Personality: undefined;
  Lifestyle: undefined;
  FoodPreferences1: undefined;
  FoodPreferences2: undefined;
  FoodPreferences3: undefined;
  FoodPreferences4: undefined;
  Interests: undefined;
  HopingToMeet: undefined;
  Hobbies: undefined;
  InterestingFact: undefined;
};

const Stack = createNativeStackNavigator<OptionalOnboardingStackParamList>();

// Wrapper for navigation handling
const createScreenWrapper = (
  ScreenComponent: any,
  nextScreen?: string,
  currentStep?: number,
  totalSteps: number = 13  // 13 optional steps including food preferences and Final Touch
) => {
  const ScreenWrapper = () => {
    const navigation = useNavigation<any>();
    // const { setOnboardingStatus } = useAuthStore(); // Removed unused
    useAuthStore();

    const handleNavigate = async (screen: string, _data?: unknown) => {
      if (__DEV__) {
        console.log('Optional onboarding navigation:', { from: ScreenComponent.name, to: screen });
      }

      switch (screen) {
        case 'onboarding-education':
          navigation.navigate('Education');
          break;
        case 'onboarding-work':
          navigation.navigate('Work');
          break;
        case 'onboarding-background':
          navigation.navigate('Background');
          break;
        case 'onboarding-personality':
          navigation.navigate('Personality');
          break;
        case 'onboarding-lifestyle':
          navigation.navigate('Lifestyle');
          break;
        case 'onboarding-food-1':
          navigation.navigate('FoodPreferences1');
          break;
        case 'onboarding-food-2':
          navigation.navigate('FoodPreferences2');
          break;
        case 'onboarding-food-3':
          navigation.navigate('FoodPreferences3');
          break;
        case 'onboarding-food-4':
          navigation.navigate('FoodPreferences4');
          break;
        case 'onboarding-interests':
          navigation.navigate('Interests');
          break;
        case 'onboarding-hoping-to-meet':
          navigation.navigate('HopingToMeet');
          break;
        case 'onboarding-hobbies':
          navigation.navigate('Hobbies');
          break;
        case 'onboarding-interesting-fact':
          navigation.navigate('InterestingFact');
          break;
        case 'complete':
        case 'home':
        case 'main':
          // The last screen (InterestingFact) will set status to FULLY_COMPLETE
          // Just navigate to main
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
          break;
        case 'back':
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          break;
        default:
          if (__DEV__) {
            console.warn('Unknown navigation target:', screen);
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

// Work-only screen component (education has its own screen now)
const OnboardingWorkOnlyScreen = (props: any) => {
  return <OnboardingWorkScreen {...props} startSection="work" workOnly={true} />;
};

export function OptionalOnboardingNavigator(props: any) {
  // Extract prefilled data from navigation params if available
  // React Navigation passes route as a prop to navigator components
  const prefilledData = props?.route?.params?.prefilledData;
  
  return (
    <OnboardingProvider initialData={prefilledData}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Education"
          component={createScreenWrapper(OnboardingEducationScreen, 'onboarding-work', 1, 13)}
        />
        <Stack.Screen
          name="Work"
          component={createScreenWrapper(OnboardingWorkOnlyScreen, 'onboarding-background', 2, 13)}
        />
        <Stack.Screen
          name="Background"
          component={createScreenWrapper(OnboardingEthnicityScreen, 'onboarding-personality', 3, 13)}
        />
        <Stack.Screen
          name="Personality"
          component={createScreenWrapper(OnboardingPersonalityScreen, 'onboarding-lifestyle', 4, 13)}
        />
        <Stack.Screen
          name="Lifestyle"
          component={createScreenWrapper(OnboardingLifestyleScreen, 'onboarding-food-1', 5, 13)}
        />
        <Stack.Screen
          name="FoodPreferences1"
          component={createScreenWrapper(OnboardingFoodPreferences1Screen, 'onboarding-food-2', 6, 13)}
        />
        <Stack.Screen
          name="FoodPreferences2"
          component={createScreenWrapper(OnboardingFoodPreferences2Screen, 'onboarding-food-3', 7, 13)}
        />
        <Stack.Screen
          name="FoodPreferences3"
          component={createScreenWrapper(OnboardingFoodPreferences3Screen, 'onboarding-food-4', 8, 13)}
        />
        <Stack.Screen
          name="FoodPreferences4"
          component={createScreenWrapper(OnboardingFoodPreferences4Screen, 'onboarding-interests', 9, 13)}
        />
        <Stack.Screen
          name="Interests"
          component={createScreenWrapper(OnboardingInterestsScreen, 'onboarding-hoping-to-meet', 10, 13)}
        />
        <Stack.Screen
          name="HopingToMeet"
          component={createScreenWrapper(OnboardingHopingToMeetScreen, 'onboarding-hobbies', 11, 13)}
        />
        <Stack.Screen
          name="Hobbies"
          component={createScreenWrapper(OnboardingHobbiesScreen, 'onboarding-interesting-fact', 12, 13)}
        />
        <Stack.Screen
          name="InterestingFact"
          component={createScreenWrapper(OnboardingInterestingFactScreen, 'complete', 13, 13)}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}