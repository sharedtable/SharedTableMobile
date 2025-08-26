import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import FeedScreen from '@/screens/feed/FeedScreen';
import EnhancedCreatePostScreen from '@/screens/feed/EnhancedCreatePostScreen';
import CommentsScreen from '@/screens/feed/CommentsScreen';

export type FeedStackParamList = {
  FeedMain: undefined;
  CreatePost: undefined;
  Comments: {
    postId: string;
    postAuthor: string;
  };
  UserProfile: {
    userId: string;
  };
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
        component={EnhancedCreatePostScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}