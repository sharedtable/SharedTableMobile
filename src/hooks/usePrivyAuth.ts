import {
  usePrivy,
  useLoginWithEmail,
  useLoginWithSMS,
  useLoginWithOAuth,
  useEmbeddedWallet,
} from '@privy-io/expo';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

import { AuthAPI } from '@/services/api/authApi';
import { UserSyncService } from '@/services/userSyncService';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { __DEV__, devLog, logError } from '@/utils/env';
import { logger } from '@/utils/logger';
import { tokenProvider } from '@/services/tokenProvider';

interface PrivyUser {
  id: string;
  email?: string;
  phoneNumber?: string;
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

  // SMS login methods
  sendSMSCode: (phone: string) => Promise<void>;
  verifySMSCode: (code: string) => Promise<void>;
  smsState: ReturnType<typeof useLoginWithSMS>['state'];

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
  const { setNeedsOnboarding, setOnboardingStatus } = useAuthStore();

  // Core Privy hooks
  const { user: privyUser, isReady, logout: privyLogout, getAccessToken } = usePrivy();

  const authenticated = !!privyUser;

  // Email login hook
  const {
    sendCode: sendEmailCode,
    loginWithCode: verifyEmailCode,
    state: emailState,
  } = useLoginWithEmail({
    onError: (error) => {
      const errorMessage = error?.message || '';
      const isCancellation = 
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('cancelled');
      
      if (__DEV__ && !isCancellation) {
        console.error('Email login error:', error);
      } else if (__DEV__ && isCancellation) {
        devLog('Email login cancelled');
      }
      setIsLoading(false);
    },
  });

  // SMS login hook
  const {
    sendCode: sendSMSCode,
    loginWithCode: verifySMSCode,
    state: smsState,
  } = useLoginWithSMS({
    onError: (error) => {
      const errorMessage = error?.message || '';
      const isCancellation = 
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('cancelled');
      
      if (__DEV__ && !isCancellation) {
        console.error('SMS login error:', error);
      } else if (__DEV__ && isCancellation) {
        devLog('SMS login cancelled');
      }
      setIsLoading(false);
    },
  });

  // OAuth login hook
  const { login: oauthLogin } = useLoginWithOAuth({
    onError: (error) => {
      // Check if error is due to user cancellation or configuration
      const errorMessage = error?.message || '';
      const isCancellation = 
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.toLowerCase().includes('abort') ||
        errorMessage.toLowerCase().includes('user closed') ||
        errorMessage.toLowerCase().includes('user denied');
      
      const isConfigurationIssue = 
        errorMessage.toLowerCase().includes('not allowed') ||
        errorMessage.toLowerCase().includes('not enabled') ||
        errorMessage.toLowerCase().includes('not configured');
      
      if (__DEV__ && !isCancellation && !isConfigurationIssue) {
        console.error('OAuth login error:', error);
      } else if (__DEV__ && isCancellation) {
        devLog('OAuth login cancelled by user');
      } else if (__DEV__ && isConfigurationIssue) {
        devLog('OAuth login not configured:', errorMessage);
      }
      setIsLoading(false);
    },
    onSuccess: (user) => {
      if (__DEV__) {
        devLog('OAuth login successful:', user.id);
      }
      setIsLoading(false);
    },
  });

  // Embedded wallet hook
  const embeddedWallet = useEmbeddedWallet();

  // Transform Privy user to our app format
  const user: PrivyUser | null = useMemo(
    () =>
      privyUser
        ? {
            id: privyUser.id,
            email: privyUser.linked_accounts?.find((account) => account.type === 'email')
              ?.address as string | undefined,
            phoneNumber: privyUser.linked_accounts?.find((account) => account.type === 'phone')
              ?.phoneNumber as string | undefined,
            name:
              privyUser.linked_accounts
                ?.find((account) => account.type === 'email')
                ?.address?.split('@')[0] ||
              privyUser.linked_accounts?.find((account) => account.type === 'phone')?.phoneNumber ||
              'User',
            avatar: undefined, // Privy doesn't provide avatar in this format
          }
        : null,
    [privyUser]
  );

  // Get wallet address from embedded wallet or linked accounts
  const walletAddress =
    embeddedWallet.status === 'connected' && 'address' in embeddedWallet
      ? embeddedWallet.address
      : (
          privyUser?.linked_accounts?.find((account) => account.type === 'wallet') as
            | { address?: string }
            | undefined
        )?.address;

  // Use a ref to track if sync is in progress
  const syncInProgressRef = useRef(false);
  const lastSyncedUserId = useRef<string | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register the token getter with the provider immediately (not in useEffect)
  // This ensures it's available as soon as the hook is called
  if (authenticated && getAccessToken) {
    tokenProvider.setTokenGetter(getAccessToken);
  } else if (!authenticated) {
    tokenProvider.clear();
  }

  // Store user session securely and sync with backend
  useEffect(() => {
    // Clear any pending sync timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Prevent duplicate syncs
    if (
      authenticated &&
      user &&
      !syncInProgressRef.current &&
      lastSyncedUserId.current !== user.id
    ) {
      // Debounce the sync to prevent rapid calls
      syncTimeoutRef.current = setTimeout(() => {
        if (syncInProgressRef.current || lastSyncedUserId.current === user.id) {
          return;
        }

        syncInProgressRef.current = true;
        lastSyncedUserId.current = user.id;

        // Store session locally
        SecureStore.setItemAsync(
          'privy_user_session',
          JSON.stringify({
            id: user.id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            timestamp: Date.now(),
          })
        ).catch((error) => {
          if (__DEV__) {
            console.error('Failed to store session:', error);
          }
        });

        // Get and store Privy auth token for API calls
        const storeAuthToken = async () => {
          try {
            const token = await getAccessToken();
            if (token) {
              await AuthAPI.storeAuthToken(token);
              console.log('✅ [usePrivyAuth] Auth token stored successfully');
            } else {
              console.warn('⚠️ [usePrivyAuth] No access token available from Privy');
            }
          } catch (error) {
            logError('Failed to store auth token', error);
          }
        };

        // Store token - call without await since we're not in an async context
        storeAuthToken();

        // Sync user with backend API (only once per user)
        const syncUser = async () => {
          try {
            let authProvider = 'email';
            if (privyUser?.linked_accounts?.find((account) => account.type === 'google_oauth')) {
              authProvider = 'google';
            } else if (privyUser?.linked_accounts?.find((account) => account.type === 'apple_oauth')) {
              authProvider = 'apple';
            } else if (privyUser?.linked_accounts?.find((account) => account.type === 'phone')) {
              authProvider = 'sms';
            }

            const syncData = {
              id: user.id,
              email: user.email,
              phoneNumber: user.phoneNumber,
              walletAddress: walletAddress as string | undefined,
              name: user.name,
              authProvider: authProvider as 'email' | 'google' | 'apple' | 'sms',
            };

            if (__DEV__) {
              console.log('Syncing user with data:', syncData);
            }

            const result = await UserSyncService.syncPrivyUser(syncData);

            if (!result.success) {
              logError('Failed to sync user with database', result.error);
            } else {
              // Use onboardingStatus from sync response
              const syncedStatus = result.onboardingStatus || 'not_started';
              
              // Set needsOnboarding based on status (for backward compatibility)
              const needsOnboarding = syncedStatus === 'not_started';
              setNeedsOnboarding(needsOnboarding);
              
              // Set the actual onboarding status
              switch (syncedStatus) {
                case 'not_started':
                  await setOnboardingStatus(OnboardingStatus.NOT_STARTED);
                  console.log('✅ [usePrivyAuth] Onboarding status from DB: NOT_STARTED');
                  break;
                case 'mandatory_complete':
                  await setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
                  console.log('✅ [usePrivyAuth] Onboarding status from DB: MANDATORY_COMPLETE');
                  break;
                case 'optional_complete':
                  await setOnboardingStatus(OnboardingStatus.OPTIONAL_COMPLETE);
                  console.log('✅ [usePrivyAuth] Onboarding status from DB: OPTIONAL_COMPLETE');
                  break;
                case 'fully_complete':
                  await setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
                  console.log('✅ [usePrivyAuth] Onboarding status from DB: FULLY_COMPLETE');
                  break;
                default:
                  console.log('✅ [usePrivyAuth] Onboarding status from DB:', syncedStatus);
              }
              
              // Only fetch profile if sync was successful and user exists
              if (result.userId) {
                // Fetch the user's full profile from backend to get their actual name
                try {
                  // Add a small delay to ensure database has committed the transaction
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  const userProfile = await UserSyncService.getCurrentUser();
                  if (userProfile && (userProfile.display_name || userProfile.first_name)) {
                    // Store the display name for future use
                    // Note: We can't directly update the Privy user object
                  }
                } catch {
                  // This is expected for new users or if profile isn't set up yet
                  logger.debug('User profile not yet available', { userId: result.userId });
                }
              }
            }
          } catch (error) {
            logError('User sync error', error);
          } finally {
            syncInProgressRef.current = false;
          }
        };

        syncUser();
      }, 500); // 500ms debounce
    } else {
      SecureStore.deleteItemAsync('privy_user_session').catch((error) => {
        if (__DEV__) {
          console.error('Failed to delete session:', error);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [authenticated, user, privyUser, getAccessToken, setNeedsOnboarding, walletAddress]);

  // Auto-create wallet for users without one (simplified)
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (
        authenticated &&
        privyUser &&
        isReady &&
        embeddedWallet &&
        embeddedWallet.status === 'not-created'
      ) {
        // Check if user already has a wallet in their linked accounts
        const hasWallet = privyUser.linked_accounts?.some(
          (account) => account.type === 'wallet' || account.type === 'smart_wallet'
        );

        if (!hasWallet) {
          try {
            // Create wallet without recovery method (will use default)
            await embeddedWallet.create();
            if (__DEV__) {
              devLog('Embedded wallet created');
            }
          } catch (error) {
            const errorMessage = (error as Error)?.message || '';
            // Only log if it's not an "already exists" error
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

      // Check if already authenticated
      if (authenticated) {
        throw new Error('Already authenticated. Please logout first.');
      }

      setIsLoading(true);
      try {
        await sendEmailCode({ email });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [isReady, sendEmailCode, authenticated]
  );

  // Enhanced email verification with loading state
  const handleVerifyEmailCode = useCallback(
    async (code: string) => {
      // Check if already authenticated
      if (authenticated) {
        throw new Error('Already authenticated. Please logout first.');
      }

      setIsLoading(true);
      try {
        await verifyEmailCode({ code });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [verifyEmailCode, authenticated]
  );

  // Enhanced SMS code sending with loading state
  const handleSendSMSCode = useCallback(
    async (phone: string) => {
      if (!isReady) {
        throw new Error('Authentication system is initializing, please try again');
      }

      // Check if already authenticated
      if (authenticated) {
        throw new Error('Already authenticated. Please logout first.');
      }

      setIsLoading(true);
      try {
        await sendSMSCode({ phone });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [isReady, sendSMSCode, authenticated]
  );

  // Enhanced SMS verification with loading state
  const handleVerifySMSCode = useCallback(
    async (code: string) => {
      // Check if already authenticated
      if (authenticated) {
        throw new Error('Already authenticated. Please logout first.');
      }

      setIsLoading(true);
      try {
        await verifySMSCode({ code });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [verifySMSCode, authenticated]
  );

  // Enhanced Google login
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await oauthLogin({
        provider: 'google',
      });
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

  // Create user object with wallet address
  const userWithWallet = user
    ? {
        ...user,
        walletAddress: walletAddress as string | undefined,
      }
    : null;

  return {
    user: userWithWallet,
    isReady,
    isAuthenticated: authenticated,
    isLoading,

    // Email methods
    sendEmailCode: handleSendEmailCode,
    verifyEmailCode: handleVerifyEmailCode,
    emailState,

    // SMS methods
    sendSMSCode: handleSendSMSCode,
    verifySMSCode: handleVerifySMSCode,
    smsState,

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
