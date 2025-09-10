import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { ChatNavigator } from './ChatNavigator';
import { useStreamChat } from '@/providers/GlobalStreamChatProvider';
import { theme } from '@/theme';

/**
 * Optimized Chat Screen that uses the pre-connected Stream Chat client
 * This eliminates the 1-2 second delay when switching to the chat tab
 */
export const OptimizedChatScreen: React.FC = () => {
  const { client, isReady, connectionError } = useStreamChat();

  // Show loading state while connecting (only on first load)
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        {connectionError ? (
          <>
            <Text style={styles.errorText}>Unable to connect to chat</Text>
            <Text style={styles.errorSubtext}>Please check your connection</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Connecting to chat...</Text>
          </>
        )}
      </View>
    );
  }

  // Render chat immediately when ready - no delay!
  return (
    <OverlayProvider>
      <Chat client={client}>
        <ChatNavigator />
      </Chat>
    </OverlayProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray['50'],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
});