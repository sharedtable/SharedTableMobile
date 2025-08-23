/**
 * API Service for SharedTable Mobile
 *
 * This service connects to the SharedTableWeb Next.js backend.
 * All business logic remains on the backend - this is just a thin client.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AuthAPI from './api/authApi';

// Get API URL from app.json config
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Types (matching SharedTableWeb)
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  profileCompleted?: boolean;
  // Add other user fields as needed
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }

        // Log requests in development (disabled for cleaner logs)
        // Uncomment for debugging API calls
        // if (__DEV__) {
        //   console.log(
        //     `📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
        //   );
        // }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Log responses in development (disabled for cleaner logs)
        // Uncomment for debugging API responses
        // if (__DEV__) {
        //   console.log(`✅ API Response: ${response.config.url}`, response.data);
        // }
        return response;
      },
      async (error: AxiosError) => {
        if (__DEV__) {
          console.error(
            `❌ API Error: ${error.config?.baseURL}${error.config?.url}`,
            error.response?.data
          );
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear auth and redirect to login
          await this.clearAuth();
          // The auth store will handle navigation
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    console.log('Setting auth token:', token);
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  }

  async clearAuth(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }

  // ============================================================================
  // Authentication Endpoints
  // ============================================================================

  async createAccount(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/auth/create-account', data);

    // Store token if provided
    if (response.data.data?.token) {
      await this.setAuthToken(response.data.data.token);
    }

    return response.data;
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    // Note: NextAuth might handle this differently
    // You may need to adjust based on your auth setup
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });

    // Store token if provided
    if (response.data.data?.token) {
      await this.setAuthToken(response.data.data.token);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      await this.clearAuth();
    }
  }

  async getSession(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/auth/session');
    return response.data;
  }

  // ============================================================================
  // User Profile Endpoints
  // ============================================================================

  async getUserProfile(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  async updateProfile(data: any): Promise<ApiResponse<any>> {
    const response = await this.client.put('/user/profile', data);
    return response.data;
  }

  async uploadProfilePhoto(uri: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();

    // React Native specific way to append file
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await this.client.post('/user/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // ============================================================================
  // Reservations/Events Endpoints
  // ============================================================================

  async getAvailableEvents(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/reservations/available');
    return response.data;
  }

  async getEventDetails(eventId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/reservations/${eventId}`);
    return response.data;
  }

  async bookEvent(data: {
    eventId: string;
    guestCount?: number;
    dietaryRestrictions?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/reservations/book', data);
    return response.data;
  }

  // ============================================================================
  // Bookings Endpoints
  // ============================================================================

  async getMyBookings(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/bookings/my-bookings');
    return response.data;
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/bookings/${bookingId}`);
    return response.data;
  }

  // ============================================================================
  // Notifications Endpoints
  // ============================================================================

  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async registerPushToken(token: string): Promise<ApiResponse<void>> {
    const response = await this.client.post('/notifications/register-token', { token });
    return response.data;
  }

  // ============================================================================
  // Payment Endpoints (Stripe)
  // ============================================================================

  async createPaymentIntent(amount: number): Promise<
    ApiResponse<{
      clientSecret: string;
      paymentIntentId: string;
    }>
  > {
    const response = await this.client.post('/stripe/create-payment-intent', {
      amount,
    });
    return response.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post('/stripe/confirm-payment', {
      paymentIntentId,
    });
    return response.data;
  }

  // ==========================================================================
  // Stream Chat Token Endpoint
  // ==========================================================================

  getChatUserToken(): Promise<{ token: string; displayName?: string }> {
    return AuthAPI.getChatUserToken();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Generic request method for any custom endpoints
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.request({
      method,
      url: endpoint,
      data,
      ...config,
    });
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiService();

// Export types
export type { AxiosError };
