import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { env } from '@/config/env';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await SecureStore.setItemAsync('authToken', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    await SecureStore.deleteItemAsync('authToken');
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (!authToken) {
    authToken = await SecureStore.getItemAsync('authToken');
    if (authToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }
  }
  return authToken;
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Ensure token is set
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in dev mode
    if (env.IS_DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in dev mode
    if (env.IS_DEV) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log error in dev mode
    if (env.IS_DEV) {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data
      );
    }

    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          await setAuthToken(null);
          // Emit event for auth state to handle navigation
          // Will be handled by auth store
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 429:
          // Rate limited
          console.error('Too many requests');
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);

// Helper to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default apiClient;
