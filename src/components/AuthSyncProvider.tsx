import { usePrivy } from '@privy-io/expo';
import React, { useEffect } from 'react';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useAuthStore } from '@/store/authStore';
import { __DEV__, devLog } from '@/utils/env';

interface AuthSyncProviderProps {
  children: React.ReactNode;
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { user: privyUser, isReady } = usePrivy();
  const { isAuthenticated } = usePrivyAuth();
  const { setPrivyUser, setNeedsOnboarding } = useAuthStore();

  useEffect(() => {
    if (!isReady) {
      if (__DEV__) {
        devLog('Privy not ready yet');
      }
      return;
    }

    if (__DEV__) {
      devLog('AuthSyncProvider - Privy state:', {
        isReady,
        hasUser: !!privyUser,
        userId: privyUser?.id,
        isAuthenticated,
      });
    }

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

      if (__DEV__) {
        devLog('User authenticated and synced to store:', userData);
      }
    } else {
      // User is not authenticated
      setPrivyUser(null);
      setNeedsOnboarding(false);

      if (__DEV__) {
        devLog('User not authenticated, clearing store');
      }
    }
  }, [privyUser, isReady, isAuthenticated, setPrivyUser, setNeedsOnboarding]);

  return <>{children}</>;
}
