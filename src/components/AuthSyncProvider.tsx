import { usePrivy } from '@privy-io/expo';
import React, { useEffect } from 'react';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/utils/logger';
import { notificationService } from '@/services/notificationService';
import { notificationManager } from '@/services/notificationManager';

interface AuthSyncProviderProps {
  children: React.ReactNode;
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { user: privyUser, isReady } = usePrivy();
  const { isAuthenticated } = usePrivyAuth();
  const { setPrivyUser, setNeedsOnboarding } = useAuthStore();

  useEffect(() => {
    if (!isReady) {
      // Privy is still initializing, this is normal on app startup
      return;
    }

    logger.debug('AuthSyncProvider - Privy state', {
      hasUser: !!privyUser,
      userId: privyUser?.id,
      isAuthenticated,
    });

    if (privyUser && isAuthenticated) {
      // User is authenticated with Privy
      const userData = {
        id: privyUser.id,
        email: privyUser.linked_accounts?.find((account) => account.type === 'email')?.address as
          | string
          | undefined,
        walletAddress: privyUser.linked_accounts?.find((account) => account.type === 'wallet')
          ?.address as string | undefined,
        name:
          privyUser.linked_accounts
            ?.find((account) => account.type === 'email')
            ?.address?.split('@')[0] || 'User',
      };

      setPrivyUser(userData);

      // Initialize notification services for authenticated user
      notificationService.initialize().catch(error => {
        logger.error('Failed to initialize notification service:', error);
      });
      
      notificationManager.initialize().catch(error => {
        logger.error('Failed to initialize notification manager:', error);
      });

      logger.debug('User authenticated and synced to store', userData);
    } else {
      // User is not authenticated
      setPrivyUser(null);
      setNeedsOnboarding(false);

      logger.debug('User not authenticated, clearing store');
    }
  }, [privyUser, isReady, isAuthenticated, setPrivyUser, setNeedsOnboarding]);

  return <>{children}</>;
}
