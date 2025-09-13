import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { DinnerDetailsScreen } from '@/screens/profile/DinnerDetailsScreen';
import { FindFriendsScreen } from '@/screens/profile/FindFriendsScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';
import { PaymentMethodsScreen } from '@/screens/settings/PaymentMethodsScreen';
import { PrivacyPolicyScreen } from '@/screens/settings/PrivacyPolicyScreen';
import { PrivacySettingsScreen } from '@/screens/settings/PrivacySettingsScreen';
import { TermsOfServiceScreen } from '@/screens/settings/TermsOfServiceScreen';
import { ReferAFriendScreen } from '@/screens/referral/ReferAFriendScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  DinnerDetails: {
    reservation?: any; // Legacy parameter for backward compatibility
    bookingId?: string;
    dinnerId?: string;
  };
  FindFriends: undefined;
  EditProfile: undefined;
  Settings: undefined;
  About: undefined;
  Help: undefined;
  PaymentMethods: undefined;
  PrivacyPolicy: undefined;
  PrivacySettings: undefined;
  ReferAFriend: undefined;
  TermsOfService: undefined;
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
        name="EditProfile" 
        component={EditProfileScreen}
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
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ReferAFriend" 
        component={ReferAFriendScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}