import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import FeedScreen from '@/screens/feed/FeedScreen';
import CreatePostScreen from '@/screens/feed/CreatePostScreen';

export type FeedStackParamList = {
  FeedMain: undefined;
  CreatePost: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="FeedMain" component={FeedScreen} />
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}