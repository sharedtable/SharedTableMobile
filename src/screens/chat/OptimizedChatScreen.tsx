import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { ChatNavigator } from './ChatNavigator';
import { useStreamChat } from '@/providers/GlobalStreamChatProvider';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Optimized Chat Screen with robust error handling and retry capability
 */
export const OptimizedChatScreen: React.FC = () => {
  const { client, isReady, connectionError, reconnect, isConnecting } = useStreamChat();

  // Show loading state while connecting
  if (!isReady || isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>
          {isConnecting ? 'Connecting to chat...' : 'Loading chat...'}
        </Text>
        {isConnecting && (
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        )}
      </View>
    );
  }

  // Show error state with retry option
  if (connectionError || !client) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons 
          name="chatbubbles-outline" 
          size={64} 
          color={theme.colors.gray['400']} 
        />
        <Text style={styles.errorTitle}>Chat Unavailable</Text>
        <Text style={styles.errorMessage}>
          {connectionError?.message || 'Unable to connect to chat service'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={reconnect}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <Text style={styles.errorHint}>
          You can still use other features of the app
        </Text>
      </View>
    );
  }

  // Check if client has required methods
  if (!client.connectUser || !client.disconnectUser) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons 
          name="warning-outline" 
          size={64} 
          color={theme.colors.warning.main} 
        />
        <Text style={styles.errorTitle}>Chat Configuration Error</Text>
        <Text style={styles.errorMessage}>
          Chat service is not properly configured
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={reconnect}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render chat when everything is ready
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray['50'],
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.medium,
  },
  errorHint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.body,
    fontStyle: 'italic',
  },
});