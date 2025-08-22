/**
 * User Sync Service
 * Synchronizes Privy authentication with backend API
 */

import { __DEV__, logError } from '@/utils/env';

import { AuthAPI } from './api/authApi';

interface PrivyUserData {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  authProvider?: 'email' | 'google' | 'apple';
}

export class UserSyncService {
  /**
   * Sync or create user via backend API after Privy authentication
   */
  static async syncPrivyUser(privyUser: PrivyUserData): Promise<{
    success: boolean;
    userId?: string;
    isNewUser?: boolean;
    needsOnboarding?: boolean;
    error?: string;
  }> {
    try {
      if (!privyUser.email) {
        return { success: false, error: 'Email is required for user sync' };
      }

      // Call backend API to sync user
      const response = await AuthAPI.syncUser({
        privyUserId: privyUser.id,
        email: privyUser.email,
        name: privyUser.name,
        walletAddress: privyUser.walletAddress,
        authProvider: privyUser.authProvider,
      });

      if (response.success) {
        if (__DEV__) {
          console.log(
            response.data.isNewUser ? 'Created new user:' : 'Updated existing user:',
            response.data.user.id
          );
          if (response.data.needsOnboarding) {
            console.log('User needs onboarding');
          }
        }

        return {
          success: true,
          userId: response.data.user.id,
          isNewUser: response.data.isNewUser,
          needsOnboarding: response.data.needsOnboarding,
        };
      }

      return {
        success: false,
        error: 'Failed to sync user',
      };
    } catch (error) {
      logError('User sync failed', error);
      return {
        success: false,
        error: (error as Error).message || 'An unexpected error occurred during user sync',
      };
    }
  }

  /**
   * Get current user data from backend
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      const response = await AuthAPI.getMe();

      if (response.success) {
        return response.data.user;
      }

      return null;
    } catch (error) {
      logError('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Get user's wallets from backend
   */
  static async getUserWallets(): Promise<any[]> {
    try {
      const response = await AuthAPI.getMe();

      if (response.success) {
        return response.data.wallets || [];
      }

      return [];
    } catch (error) {
      logError('Failed to get user wallets', error);
      return [];
    }
  }
}
