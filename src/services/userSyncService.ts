/**
 * User Sync Service
 * Synchronizes Privy authentication with backend API
 */

import { __DEV__, logError } from '@/utils/env';
import { logger } from '@/utils/logger';

import { AuthAPI } from './api/authApi';

interface PrivyUserData {
  id: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  name?: string;
  authProvider?: 'email' | 'google' | 'apple' | 'sms';
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
      // Call backend API to sync user (email is now optional)
      const response = await AuthAPI.syncUser({
        privyUserId: privyUser.id,
        email: privyUser.email, // Can be undefined for SMS auth
        phoneNumber: privyUser.phoneNumber, // Add phone number
        walletAddress: privyUser.walletAddress, // Wallet address from Privy
        name: privyUser.name,
        authProvider: privyUser.authProvider,
      });

      if (response.success) {
        logger.info(
          response.data.isNewUser ? 'Created new user' : 'Updated existing user',
          { userId: response.data.user.id, needsOnboarding: response.data.needsOnboarding }
        );

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
}
