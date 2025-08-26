import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import DiningPreferencesScreen from '@/screens/profile/DiningPreferencesScreen';
import { PersonalizationDietaryScreen } from '@/screens/onboarding/PersonalizationDietaryScreen';
import { PersonalizationCuisineScreen } from '@/screens/onboarding/PersonalizationCuisineScreen';
import { PersonalizationDiningStyleScreen } from '@/screens/onboarding/PersonalizationDiningStyleScreen';
import { PersonalizationSocialScreen } from '@/screens/onboarding/PersonalizationSocialScreen';
import { PersonalizationFoodieProfileScreen } from '@/screens/onboarding/PersonalizationFoodieProfileScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  DiningPreferences: undefined;
  PersonalizationDietary: undefined;
  PersonalizationCuisine: undefined;
  PersonalizationDiningStyle: undefined;
  PersonalizationSocial: undefined;
  PersonalizationFoodieProfile: undefined;
  Settings: undefined;
  About: undefined;
  Help: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="DiningPreferences" 
        component={DiningPreferencesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PersonalizationDietary" 
        component={PersonalizationDietaryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PersonalizationCuisine" 
        component={PersonalizationCuisineScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PersonalizationDiningStyle" 
        component={PersonalizationDiningStyleScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PersonalizationSocial" 
        component={PersonalizationSocialScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PersonalizationFoodieProfile" 
        component={PersonalizationFoodieProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}