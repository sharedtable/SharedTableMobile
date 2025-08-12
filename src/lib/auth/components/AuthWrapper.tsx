import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { theme } from '@/theme';

import { useAuth } from '../hooks/useAuth';
import { DeepLinkingService } from '../utils/deepLinking';

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that handles auth state and deep linking
 * Shows loading state while auth is initializing
 */
export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { initializing } = useAuth();

  // Setup deep linking for OAuth callbacks
  useEffect(() => {
    console.log('🔗 [AuthWrapper] Setting up deep link listener');

    const subscription = DeepLinkingService.setupAuthListener(
      () => {
        console.log('✅ [AuthWrapper] Auth deep link success');
      },
      (error) => {
        console.error('❌ [AuthWrapper] Auth deep link error:', error);
      }
    );

    return () => {
      console.log('🔗 [AuthWrapper] Removing deep link listener');
      subscription?.remove();
    };
  }, []);

  // Show loading state while initializing
  if (initializing) {
    return (
      fallback || (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 16,
    marginTop: 16,
  },
});
