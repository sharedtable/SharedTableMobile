import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import auth screens
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { SignInScreen } from '@/screens/auth/SignInScreen';

// These screens are not implemented yet
// import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: { hasInvitation?: boolean };
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </Stack.Navigator>
  );
}
