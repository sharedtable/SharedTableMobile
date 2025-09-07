import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { DinnerDetailsScreen } from '@/screens/profile/DinnerDetailsScreen';
import { FindFriendsScreen } from '@/screens/profile/FindFriendsScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';
import { PaymentMethodsScreen } from '@/screens/settings/PaymentMethodsScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  DinnerDetails: {
    reservation: any; // You can type this more specifically based on your data structure
  };
  FindFriends: undefined;
  Settings: undefined;
  About: undefined;
  Help: undefined;
  PaymentMethods: undefined;
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
        name="DinnerDetails" 
        component={DinnerDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FindFriends" 
        component={FindFriendsScreen}
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
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}