/**
 * Thread Screen
 * Display and reply to message threads
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Thread } from 'stream-chat-expo';

import { theme } from '@/theme';
import { ChatStackParamList } from './ChatNavigator';

type RouteProps = RouteProp<ChatStackParamList, 'Thread'>;

export const ThreadScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { parentMessage } = route.params;

  return (
    <View style={styles.container}>
      <Thread thread={parentMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
});