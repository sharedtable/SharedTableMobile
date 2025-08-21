import { usePrivy, useLoginWithEmail, useLoginWithOAuth, useEmbeddedWallet } from '@privy-io/expo';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

import { __DEV__, devLog, logError } from '@/utils/env';

interface PrivyUser {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatar?: string;
}

interface UsePrivyAuthReturn {
  user: PrivyUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Email login methods
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<void>;
  emailState: ReturnType<typeof useLoginWithEmail>['state'];

  // OAuth login methods
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;

  // Wallet methods
  embeddedWallet: ReturnType<typeof useEmbeddedWallet>;
  createWallet: () => Promise<void>;

  // General methods
  logout: () => Promise<void>;
  linkEmail: (email: string) => Promise<void>;
  linkWallet: () => Promise<void>;
}

export const usePrivyAuth = (): UsePrivyAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);

  // Core Privy hooks
  const { user: privyUser, isReady, logout: privyLogout } = usePrivy();

  const authenticated = !!privyUser;

  // Email login hook
  const {
    sendCode: sendEmailCode,
    loginWithCode: verifyEmailCode,
    state: emailState,
  } = useLoginWithEmail({
    onError: (error) => {
      if (__DEV__) {
        console.error('Email login error:', error);
      }
      setIsLoading(false);
    },
  });

  // OAuth login hook
  const { login: oauthLogin } = useLoginWithOAuth({
    onError: (error) => {
      if (__DEV__) {
        console.error('OAuth login error:', error);
      }
      setIsLoading(false);
    },
  });

  // Embedded wallet hook
  const embeddedWallet = useEmbeddedWallet();

  // Transform Privy user to our app format
  const user: PrivyUser | null = privyUser
    ? {
        id: privyUser.id,
        email: privyUser.linked_accounts?.find((account) => account.type === 'email')?.address as
          | string
          | undefined,
        walletAddress:
          (privyUser.linked_accounts?.find((account) => account.type === 'wallet') as any)
            ?.address || ('address' in embeddedWallet ? embeddedWallet.address : undefined),
        name:
          privyUser.linked_accounts
            ?.find((account) => account.type === 'email')
            ?.address?.split('@')[0] || 'User',
        avatar: undefined, // Privy doesn't provide avatar in this format
      }
    : null;

  // Store user session securely
  useEffect(() => {
    if (authenticated && user) {
      SecureStore.setItemAsync(
        'privy_user_session',
        JSON.stringify({
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
          timestamp: Date.now(),
        })
      ).catch((error) => {
        if (__DEV__) {
          console.error('Failed to store session:', error);
        }
      });
    } else {
      SecureStore.deleteItemAsync('privy_user_session').catch((error) => {
        if (__DEV__) {
          console.error('Failed to delete session:', error);
        }
      });
    }
  }, [authenticated, user]);

  // Auto-create wallet for users without one
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (authenticated && privyUser && isReady && embeddedWallet) {
        // Check if user already has a wallet in their linked accounts
        const hasWallet = privyUser.linked_accounts?.some(
          (account) => account.type === 'wallet' || account.type === 'smart_wallet'
        );

        if (__DEV__) {
          devLog('Wallet check:', {
            hasWallet,
            walletStatus: embeddedWallet.status,
            walletAddress: 'address' in embeddedWallet ? embeddedWallet.address : undefined,
          });
        }

        if (!hasWallet && embeddedWallet.status === 'not-created') {
          try {
            // Create wallet without recovery method (will use default)
            await embeddedWallet.create();
            if (__DEV__) {
              devLog('Embedded wallet created successfully');
            }
          } catch (error) {
            const errorMessage = (error as Error)?.message || '';
            // Check if wallet already exists
            if (!errorMessage.includes('already') && !errorMessage.includes('exists')) {
              logError('Failed to create embedded wallet', error);
            }
          }
        }
      }
    };

    // Delay to ensure Privy is fully initialized
    const timer = setTimeout(createWalletIfNeeded, 2000);
    return () => clearTimeout(timer);
  }, [authenticated, privyUser, isReady, embeddedWallet]);

  // Enhanced email code sending with loading state
  const handleSendEmailCode = useCallback(
    async (email: string) => {
      if (!isReady) {
        throw new Error('Authentication system is initializing, please try again');
      }

      setIsLoading(true);
      try {
        await sendEmailCode({ email });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [isReady, sendEmailCode]
  );

  // Enhanced email verification with loading state
  const handleVerifyEmailCode = useCallback(
    async (code: string) => {
      setIsLoading(true);
      try {
        await verifyEmailCode({ code });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [verifyEmailCode]
  );

  // Enhanced Google login
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await oauthLogin({ provider: 'google' });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [oauthLogin]);

  // Enhanced Apple login
  const loginWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      await oauthLogin({ provider: 'apple' });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [oauthLogin]);

  // Enhanced logout with cleanup
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await privyLogout();
      await SecureStore.deleteItemAsync('privy_user_session');
    } catch (error) {
      logError('Logout error', error);
    } finally {
      setIsLoading(false);
    }
  }, [privyLogout]);

  // Enhanced link email (simplified for now)
  const linkEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      // This would need to be implemented based on your specific needs
      if (__DEV__) {
        devLog('Link email not yet implemented:', email);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  // Create embedded wallet
  const createWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      if (embeddedWallet && embeddedWallet.status === 'not-created') {
        await embeddedWallet.create();
        if (__DEV__) {
          devLog('Wallet created successfully');
        }
      }
    } catch (error) {
      logError('Failed to create wallet', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [embeddedWallet]);

  // Enhanced link wallet (simplified for now)
  const linkWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      // This would need to be implemented based on your specific needs
      if (__DEV__) {
        devLog('Link wallet not yet implemented');
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    user,
    isReady,
    isAuthenticated: authenticated,
    isLoading,

    // Email methods
    sendEmailCode: handleSendEmailCode,
    verifyEmailCode: handleVerifyEmailCode,
    emailState,

    // OAuth methods
    loginWithGoogle,
    loginWithApple,

    // Wallet methods
    embeddedWallet,
    createWallet,

    // General methods
    logout,
    linkEmail,
    linkWallet,
  };
};
