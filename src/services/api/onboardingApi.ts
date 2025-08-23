/**
 * Onboarding API Service
 * Handles all onboarding-related API calls to the backend
 */

import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { logError } from '@/utils/env';
import { retryWithBackoff, withTimeout } from '@/utils/retry';

// API configuration
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
      const { status, data } = error.response;
      if (status === 401) {
        SecureStore.deleteItemAsync('privy_auth_token');
      }
      throw new Error(data.error || 'An error occurred');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
);

export interface OnboardingStepData {
  step: 'name' | 'birthday' | 'gender';
  data: {
    firstName?: string;
    lastName?: string;
    nickname?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  };
}

export interface CompleteOnboardingData {
  firstName: string;
  lastName: string;
  nickname: string;
  birthDate: string;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
}

interface OnboardingResponse {
  success: boolean;
  message: string;
}

interface OnboardingStatusResponse {
  success: boolean;
  completed: boolean;
  completedAt?: string;
}

export class OnboardingAPI {
  /**
   * Save a single onboarding step
   */
  static async saveStep(stepData: OnboardingStepData): Promise<OnboardingResponse> {
    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await withTimeout(
            apiClient.post<OnboardingResponse>('/onboarding/step', stepData),
            15000,
            'Onboarding step save timed out'
          );
          return res;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            logError(`Onboarding step save attempt ${attempt} failed, retrying...`, error);
          },
        }
      );
      
      return response.data;
    } catch (error) {
      logError('Failed to save onboarding step', error);
      throw error;
    }
  }

  /**
   * Complete the onboarding process with all required data
   */
  static async completeOnboarding(data: CompleteOnboardingData): Promise<OnboardingResponse> {
    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await withTimeout(
            apiClient.post<OnboardingResponse>('/onboarding/complete', data),
            15000,
            'Onboarding completion timed out'
          );
          return res;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            logError(`Onboarding completion attempt ${attempt} failed, retrying...`, error);
          },
        }
      );
      
      return response.data;
    } catch (error) {
      logError('Failed to complete onboarding', error);
      throw error;
    }
  }

  /**
   * Check onboarding status
   */
  static async checkOnboardingStatus(): Promise<OnboardingStatusResponse> {
    try {
      const response = await apiClient.get<OnboardingStatusResponse>('/onboarding/status');
      return response.data;
    } catch (error) {
      logError('Failed to check onboarding status', error);
      throw error;
    }
  }
}

export default OnboardingAPI;