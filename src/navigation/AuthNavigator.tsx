import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import auth screens
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';

// These screens are not implemented yet
// import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
// import { LoginScreen } from '@/screens/auth/LoginScreen';
// import { SignUpScreen } from '@/screens/auth/SignUpScreen';

export type AuthStackParamList = {
  Welcome: undefined;
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
      {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
      {/* <Stack.Screen name="SignUp" component={SignUpScreen} /> */}
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </Stack.Navigator>
  );
}
