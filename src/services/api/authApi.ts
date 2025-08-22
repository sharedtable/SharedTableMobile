/**
 * Authentication API Service
 * Handles all authentication-related API calls to the backend
 */

import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { __DEV__, logError } from '@/utils/env';

// API configuration
// Use your local IP address for development (not localhost)
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.5:3001/api' // Replace with your computer's IP address
  : Constants.expoConfig?.extra?.productionApiUrl || 'https://sharedtable-api.vercel.app/api';

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
  email: string;
  name?: string;
  walletAddress?: string;
  authProvider?: 'email' | 'google' | 'apple';
}

interface SyncUserResponse {
  success: boolean;
  data: {
    user: any;
    isNewUser: boolean;
    needsOnboarding: boolean;
  };
}

interface VerifyTokenResponse {
  success: boolean;
  data: {
    userId: string;
    user: any;
  };
}

interface GetMeResponse {
  success: boolean;
  data: {
    user: any;
    wallets: any[];
    privyUser: any;
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
    user: any;
  };
}

export class AuthAPI {
  /**
   * Sync Privy user with backend database
   */
  static async syncUser(userData: SyncUserData): Promise<SyncUserResponse> {
    try {
      if (__DEV__) {
        console.log('Syncing user to backend:', userData);
      }
      const response = await apiClient.post<SyncUserResponse>('/auth/sync', userData);
      if (__DEV__) {
        console.log('Sync response:', response.data);
      }
      return response.data;
    } catch (error) {
      logError('Failed to sync user', error);
      if (__DEV__ && error.response) {
        console.error('API Error Response:', error.response.data);
      }
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
