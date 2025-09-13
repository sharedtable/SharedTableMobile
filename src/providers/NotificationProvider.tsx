import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { logger } from '@/utils/logger';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = usePrivyAuth();
  const { 
    setBadgeCount,
  } = useNotifications();

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Clear badge when app comes to foreground
        setBadgeCount(0);
        logger.debug('App became active, cleared badge count');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, setBadgeCount]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User authenticated, notification system ready');
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}