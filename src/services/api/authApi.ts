/**
 * Authentication API Service
 * Handles all authentication-related API calls to the backend
 */

import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { __DEV__, logError } from '@/utils/env';
import { retryWithBackoff, withTimeout } from '@/utils/retry';
import { logger } from '@/utils/logger';

// API configuration
// Use your local IP address for development (not localhost)

//'http://192.168.1.5:3001/api'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('privy_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logError('Failed to get auth token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid
        SecureStore.deleteItemAsync('privy_auth_token');
        // Trigger logout or refresh token logic
      }

      throw new Error(data.error || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

interface SyncUserData {
  privyUserId: string;
  email?: string; // Optional for SMS auth
  phoneNumber?: string; // Add phone number support
  walletAddress?: string; // Wallet address from Privy
  name?: string;
  authProvider?: 'email' | 'google' | 'apple' | 'sms';
}

interface User {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

interface SyncUserResponse {
  success: boolean;
  data: {
    user: User;
    isNewUser: boolean;
    needsOnboarding: boolean;
    onboardingStatus?: string;
  };
}

interface VerifyTokenResponse {
  success: boolean;
  data: {
    userId: string;
    user: User;
  };
}

interface Wallet {
  address: string;
  chainId?: number;
  verified?: boolean;
}

interface PrivyUser {
  id: string;
  email?: string;
  phone?: string;
  wallet?: Wallet;
}

interface GetMeResponse {
  success: boolean;
  data: {
    user: User;
    wallets: Wallet[];
    privyUser: PrivyUser;
  };
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  onboarding_completed?: boolean;
}

interface UpdateProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export class AuthAPI {
  /**
   * Fetches a Stream Chat user token for the authenticated user
   */
  static async getChatUserToken(): Promise<{ token: string; displayName?: string }> {
    const token = await this.getAuthToken();
    if (!token) {
      logger.error('getChatUserToken: Not authenticated');
      throw new Error('Not authenticated');
    }
    const response = await apiClient.post<{ 
      success: boolean; 
      token: string;
      streamUserId?: string;
      displayName?: string;
    }>(
      '/chat/token',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.token) {
      logger.error('Failed to fetch chat user token', response.data);
      throw new Error('Failed to fetch chat user token');
    }
    logger.debug('Fetched Stream USER_TOKEN with displayName:', response.data.displayName);

    return {
      token: response.data.token,
      displayName: response.data.displayName,
    };
  }

  /**
   * Sync Privy user with backend database with retry logic
   */
  static async syncUser(userData: SyncUserData): Promise<SyncUserResponse> {
    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await withTimeout(
            apiClient.post<SyncUserResponse>('/auth/sync', userData),
            15000, // 15 second timeout
            'User sync timed out'
          );
          return res;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            logError(`User sync attempt ${attempt} failed, retrying...`, error);
          },
        }
      );
      
      return response.data;
    } catch (error) {
      logError('Failed to sync user after retries', error);
      throw error;
    }
  }

  /**
   * Verify authentication token
   */
  static async verifyToken(token: string): Promise<VerifyTokenResponse> {
    try {
      const response = await apiClient.post<VerifyTokenResponse>('/auth/verify', { token });
      return response.data;
    } catch (error) {
      logError('Failed to verify token', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user data
   */
  static async getMe(): Promise<GetMeResponse> {
    try {
      const response = await apiClient.get<GetMeResponse>('/auth/me');
      return response.data;
    } catch (error) {
      logError('Failed to get user data', error);
      throw error;
    }
  }

  /**
   * Store authentication token
   */
  static async storeAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('privy_auth_token', token);
    } catch (error) {
      logError('Failed to store auth token', error);
      throw error;
    }
  }

  /**
   * Get stored authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('privy_auth_token');
    } catch (error) {
      logError('Failed to get auth token', error);
      return null;
    }
  }

  /**
   * Clear authentication token
   */
  static async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('privy_auth_token');
    } catch (error) {
      logError('Failed to clear auth token', error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      const response = await apiClient.put<UpdateProfileResponse>('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      logError('Failed to update profile', error);
      throw error;
    }
  }
}

export default AuthAPI;
