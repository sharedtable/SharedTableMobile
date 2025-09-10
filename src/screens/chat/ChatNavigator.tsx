/**
 * Chat Navigation Stack
 * Handles navigation between channel list, channel view, and thread view
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { theme } from '@/theme';

import { OptimizedChannelListScreen } from './OptimizedChannelListScreen';
import { ChannelScreen } from './ChannelScreen';
import { ThreadScreen } from './ThreadScreen';
import { ChannelMembersScreen } from './ChannelMembersScreen';
import { NewChatScreen } from './NewChatScreen';
import { UserProfileScreen } from './UserProfileScreen';

export type ChatStackParamList = {
  ChannelList: undefined;
  Channel: { channelId: string };
  Thread: { 
    channelId: string;
    messageId: string;
    parentMessage: any;
  };
  ChannelMembers: { channelId: string };
  NewChat: undefined;
  UserProfile: { userId: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.white,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.semibold,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ChannelList"
        component={OptimizedChannelListScreen}
        options={{
          title: 'Messages',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="Channel"
        component={ChannelScreen}
        options={{
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Thread"
        component={ThreadScreen}
        options={{
          title: 'Thread',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ChannelMembers"
        component={ChannelMembersScreen}
        options={{
          title: 'Members',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          title: 'New Message',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: 'Profile',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};