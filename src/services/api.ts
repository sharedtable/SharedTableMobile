/**
 * API Service for SharedTable Mobile
 *
 * This service connects to the SharedTableWeb Next.js backend.
 * All business logic remains on the backend - this is just a thin client.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AuthAPI from './api/authApi';
import { NotificationData, NotificationPreferences } from '@/types/notification.types';
import { Booking } from '@/types';
import { tokenProvider } from '@/services/tokenProvider';

// Restaurant types
interface RestaurantItem {
  id: string;
  name: string;
  address?: string;
  cuisine?: string;
  priceRange?: string;
  imageUrl?: string;
  rating: number;
  visitCount?: number;
}

interface RestaurantDetails extends RestaurantItem {
  description?: string;
  totalReviews?: number;
  hours?: Record<string, string>;
}

// Get API URL from app.json config
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://fare-backend-production.up.railway.app/api';
console.log('🔧 API Service initialized with URL:', API_BASE_URL);

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Types (matching SharedTableWeb)
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  bio?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  profileCompleted?: boolean;
  // Add other user fields as needed
}

export interface DiningEvent {
  id: string;
  title: string;
  description: string;
  cuisine_type: string;
  dining_style: string;
  restaurant_name: string;
  address: string;
  city: string;
  event_date: string;
  start_time: string;
  end_time: string;
  min_guests: number;
  max_guests: number;
  price_per_person: number;
  price_includes?: string;
  payment_method: string;
  dietary_accommodations?: string[];
  age_restriction?: string;
  dress_code?: string;
  languages_spoken?: string[];
  cover_image?: string;
  tags?: string[];
  visibility?: string;
  host_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Dinner {
  id: string;
  datetime: string;
  restaurant_id?: string;
  restaurant_name?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface EventBooking {
  id: string;
  event_id: string;
  user_id: string;
  guest_count: number;
  dietary_notes?: string;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'waitlisted' | 'declined' | 'cancelled' | 'attended' | 'completed';
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  attended_at?: string;
  completed_at?: string;
  event?: Event;
  dinner_id?: string;
  dinner?: Dinner;
  survey_submitted?: boolean;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  user: User;
  status: 'pending' | 'confirmed' | 'assigned' | 'waitlisted' | 'declined' | 'cancelled' | 'attended' | 'completed';
  guests_count: number;
  dietary_notes?: string;
  special_requests?: string;
  requested_at: string;
  confirmed_at?: string;
  joined_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  user: User;
  message: string;
  message_type: 'text' | 'image' | 'system' | 'announcement';
  reply_to_id?: string;
  reply_to?: EventMessage;
  image_url?: string;
  edited: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  overall_rating: number;
  food_rating?: number;
  atmosphere_rating?: number;
  host_rating?: number;
  value_rating?: number;
  review_text?: string;
  highlights?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

import type {
  GamificationStats,
  Achievement,
  Quest,
  LeaderboardData,
  PointTransaction,
  LoyaltyItem,
  StreakInfo,
} from '@/types/gamification';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private client: AxiosInstance;
  private requestQueue: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between same endpoint calls

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
    // Request interceptor to add auth token and rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        const requestKey = `${config.method}:${config.url}`;
        const lastRequestTime = this.requestQueue.get(requestKey) || 0;
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        // For GET requests to the same endpoint, enforce minimum interval
        if (config.method === 'get' && timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          console.warn(
            `⏱️ Rate limiting: Delaying ${requestKey} request by ${this.MIN_REQUEST_INTERVAL - timeSinceLastRequest}ms`
          );
          await new Promise(resolve => 
            setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
          );
        }

        this.requestQueue.set(requestKey, Date.now());

        try {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (__DEV__ && config.url?.includes('notifications')) {
              console.log(`🔑 [API] Auth header set for ${config.url}`);
            }
          } else {
            if (__DEV__ && config.url?.includes('notifications')) {
              console.log(`⚠️ [API] No token available for ${config.url}`);
            }
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

        // Handle 429 Too Many Requests
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.error(
            `🚫 Rate limited (429). Retry after: ${retryAfter || 'unknown'} seconds`
          );
          // You could implement automatic retry here if needed
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
      // Try to get fresh token from Privy first
      const freshToken = await tokenProvider.getAccessToken();
      if (freshToken) {
        if (__DEV__) {
          console.log('📱 [API] Using fresh Privy token (length:', freshToken.length, ')');
        }
        // Store it for offline use
        await SecureStore.setItemAsync('privy_auth_token', freshToken);
        return freshToken;
      }

      // Fallback to stored token if fresh token not available (offline mode)
      const privyToken = await SecureStore.getItemAsync('privy_auth_token');
      if (privyToken) {
        if (__DEV__) {
          console.log('📱 [API] Using stored Privy token (may be expired)');
        }
        return privyToken;
      }
      
      // Fallback to old token key
      const fallbackToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (fallbackToken) {
        if (__DEV__) {
          console.log('📱 [API] Using fallback token');
        }
        return fallbackToken;
      }
      
      if (__DEV__) {
        console.log('⚠️ [API] No auth token found');
      }
      return null;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  async refreshAuthToken(): Promise<string | null> {
    try {
      // Get fresh token from Privy
      // Note: This requires the Privy SDK to be initialized
      // The actual refresh should be handled by the usePrivyAuth hook
      console.log('Token expired - please re-authenticate');
      return null;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
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
    const response = await this.client.get('/onboarding/profile');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put('/user/profile', data);
    return response.data;
  }

  // ============================================================================
  // Onboarding Endpoints
  // ============================================================================

  async completeOnboarding(data: {
    firstName: string;
    lastName: string;
    nickname: string;
    birthDate: string;
    gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.client.post('/onboarding/complete', data);
    return response.data;
  }

  async saveOnboardingStep(step: string, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean; message: string }>> {
    // Use the simplified endpoint that actually saves data
    const response = await this.client.post('/onboarding-simple/save', { step, data });
    return response.data;
  }

  async getOnboardingStatus(): Promise<{ 
    success: boolean;
    status: 'not_started' | 'mandatory_complete' | 'optional_complete' | 'fully_complete';
    mandatoryComplete: boolean;
    optionalComplete: boolean;
    completedAt?: string;
    missingFields?: {
      mandatory: {
        firstName: boolean;
        lastName: boolean;
        birthDate: boolean;
        gender: boolean;
      };
      optional: {
        interests: boolean;
        dietaryPreferences: boolean;
        occupation: boolean;
        fieldOfStudy: boolean;
      };
    };
  }> {
    try {
      const response = await this.client.get('/onboarding/status');
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [API] Error fetching onboarding status:', error);
      }
      // Return a default response on error
      return {
        success: false,
        status: 'not_started',
        mandatoryComplete: false,
        optionalComplete: false,
      };
    }
  }

  async updateOnboardingStatus(status: string): Promise<ApiResponse<{ 
    success: boolean; 
    status: string;
    message: string;
  }>> {
    const response = await this.client.post('/onboarding/update-status', { status });
    return response.data;
  }


  async uploadProfilePhoto(uri: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();

    // React Native specific way to append file
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any); // React Native specific file upload format

    const response = await this.client.post('/user/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // ============================================================================
  // Dining Events Endpoints
  // ============================================================================

  async getAvailableEvents(params?: {
    city?: string;
    cuisine?: string;
    date?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<ApiResponse<DiningEvent[]>> {
    const response = await this.client.get('/events/available', { params });
    return response.data;
  }

  async getEventDetails(eventId: string): Promise<ApiResponse<DiningEvent>> {
    const response = await this.client.get(`/events/${eventId}`);
    return response.data;
  }

  async createEvent(data: {
    title: string;
    description: string;
    cuisine_type: string;
    dining_style: string;
    restaurant_name: string;
    address: string;
    city: string;
    event_date: string;
    start_time: string;
    end_time: string;
    min_guests: number;
    max_guests: number;
    price_per_person: number;
    price_includes?: string;
    payment_method: string;
    dietary_accommodations?: string[];
    age_restriction?: string;
    dress_code?: string;
    languages_spoken?: string[];
    cover_image?: string;
    tags?: string[];
    visibility?: string;
  }): Promise<ApiResponse<DiningEvent>> {
    const response = await this.client.post('/events/create', data);
    return response.data;
  }

  async updateEvent(eventId: string, data: Partial<DiningEvent>): Promise<ApiResponse<DiningEvent>> {
    const response = await this.client.put(`/events/${eventId}`, data);
    return response.data;
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}`);
    return response.data;
  }

  async bookEvent(data: {
    eventId: string;
    guestCount?: number;
    dietaryNotes?: string;
    specialRequests?: string;
  }): Promise<ApiResponse<EventBooking>> {
    const response = await this.client.post('/events/book', data);
    return response.data;
  }

  async cancelEventBooking(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}/booking`);
    return response.data;
  }

  async getMyHostedEvents(): Promise<ApiResponse<DiningEvent[]>> {
    const response = await this.client.get('/events/my-hosted');
    return response.data;
  }

  async getEventAttendees(eventId: string): Promise<ApiResponse<EventAttendee[]>> {
    const response = await this.client.get(`/events/${eventId}/attendees`);
    return response.data;
  }

  async joinWaitlist(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/events/${eventId}/waitlist`);
    return response.data;
  }

  async leaveWaitlist(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}/waitlist`);
    return response.data;
  }

  // ============================================================================
  // Booking Endpoints
  // ============================================================================

  async createBooking(
    dinnerId: string,
    preferences?: string,
    plusOne?: boolean
  ): Promise<ApiResponse<any>> {
    const response = await this.client.post('/bookings/create', {
      dinnerId,
      preferences,
      plusOne,
    });
    return response.data;
  }

  async updateBookingStatus(
    bookingId: string,
    status: string
  ): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/bookings/${bookingId}/status`, {
      status,
    });
    return response.data;
  }

  async updateBooking(
    bookingId: string,
    data: { status?: string; preferences?: string }
  ): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/bookings/${bookingId}`, data);
    return response.data;
  }


  // ============================================================================
  // Event Messages Endpoints
  // ============================================================================

  async getEventMessages(eventId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<EventMessage[]>> {
    const response = await this.client.get(`/events/${eventId}/messages`, { params });
    return response.data;
  }

  async sendEventMessage(eventId: string, data: {
    message: string;
    replyToId?: string;
  }): Promise<ApiResponse<EventMessage>> {
    const response = await this.client.post(`/events/${eventId}/messages`, data);
    return response.data;
  }

  async deleteEventMessage(eventId: string, messageId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}/messages/${messageId}`);
    return response.data;
  }

  // ============================================================================
  // Event Reviews Endpoints
  // ============================================================================

  async getEventReviews(eventId: string): Promise<ApiResponse<EventReview[]>> {
    const response = await this.client.get(`/events/${eventId}/reviews`);
    return response.data;
  }

  async createEventReview(eventId: string, data: {
    overall_rating: number;
    food_rating?: number;
    atmosphere_rating?: number;
    host_rating?: number;
    value_rating?: number;
    review_text?: string;
    highlights?: string[];
    is_public?: boolean;
  }): Promise<ApiResponse<EventReview>> {
    const response = await this.client.post(`/events/${eventId}/reviews`, data);
    return response.data;
  }

  async updateEventReview(eventId: string, reviewId: string, data: Partial<EventReview>): Promise<ApiResponse<EventReview>> {
    const response = await this.client.put(`/events/${eventId}/reviews/${reviewId}`, data);
    return response.data;
  }

  async deleteEventReview(eventId: string, reviewId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}/reviews/${reviewId}`);
    return response.data;
  }

  // ============================================================================
  // Dinners Endpoints
  // ============================================================================

  async getAvailableDinners(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/dinners/available');
    return response.data;
  }

  async signupForDinner(data: {
    dinnerId: string;
    dietaryRestrictions?: string;
    preferences?: string;
    paymentMethodId?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/dinners/signup', data);
    return response.data;
  }

  async getMySignups(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/dinners/my-signups');
    return response.data;
  }

  async getMyDinnerGroup(dinnerId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/dinners/my-group/${dinnerId}`);
    return response.data;
  }

  async getGroupMembers(dinnerGroupId: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get(`/dinners/group-members/${dinnerGroupId}`);
    return response.data;
  }

  async cancelSignup(signupId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/dinners/signup/${signupId}`);
    return response.data;
  }

  // ============================================================================
  // Bookings Endpoints (Legacy - keeping for compatibility)
  // ============================================================================

  async getMyBookings(): Promise<ApiResponse<EventBooking[]>> {
    const response = await this.client.get('/bookings/my-bookings');
    return response.data;
  }

  async getUpcomingBookings(): Promise<ApiResponse<EventBooking[]>> {
    const response = await this.client.get('/bookings/upcoming');
    return response.data;
  }

  async getPastBookings(): Promise<ApiResponse<EventBooking[]>> {
    const response = await this.client.get('/bookings/past');
    return response.data;
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<EventBooking>> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/bookings/${bookingId}`);
    return response.data;
  }

  async markBookingAsAttended(bookingId: string): Promise<ApiResponse<EventBooking>> {
    const response = await this.client.patch(`/bookings/${bookingId}/attend`);
    return response.data;
  }

  async markBookingAsCompleted(bookingId: string): Promise<ApiResponse<EventBooking>> {
    const response = await this.client.patch(`/bookings/${bookingId}/complete`);
    return response.data;
  }

  async getBookingStats(): Promise<ApiResponse<{
    confirmed: number;
    attended: number;
    completed: number;
    cancelled: number;
    total: number;
  }>> {
    const response = await this.client.get('/bookings/stats/by-status');
    return response.data;
  }

  async markBookingsAsAssigned(dinnerId: string, userIds: string[]): Promise<ApiResponse<{
    message: string;
    data: EventBooking[];
    count: number;
  }>> {
    const response = await this.client.post('/bookings/admin/mark-assigned', {
      dinnerId,
      userIds
    });
    return response.data;
  }

  async bulkCompleteBookings(dinnerId: string, attendedUserIds: string[]): Promise<ApiResponse<{
    message: string;
    stats: {
      total: number;
      attended: number;
      noShow: number;
      completed: number;
    };
  }>> {
    const response = await this.client.post('/bookings/admin/bulk-complete', {
      dinnerId,
      attendedUserIds
    });
    return response.data;
  }

  // ============================================================================
  // Notifications Endpoints
  // ============================================================================

  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<Notification[]>> {
    try {
      const response = await this.client.get('/notifications', { params });
      return response.data;
    } catch (error) {
      // If notifications endpoint doesn't exist, return empty array
      if ((error as AxiosError)?.response?.status === 404) {
        console.warn('Notifications endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 404) {
        console.warn('Notifications endpoint not available');
        return { success: true };
      }
      throw error;
    }
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await this.client.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 404) {
        return { success: true, data: { count: 0 } };
      }
      throw error;
    }
  }

  async registerPushToken(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post('/notifications/register-token', { token });
      return response.data;
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 404) {
        console.warn('Push token registration endpoint not available');
        return { success: true };
      }
      throw error;
    }
  }

  async updatePushToken(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.put('/notifications/push-token', { token });
      return response.data;
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 404) {
        console.warn('Push token update endpoint not available');
        return { success: true };
      }
      throw error;
    }
  }

  private unreadChatCountCache: { count: number; timestamp: number } | null = null;
  private readonly UNREAD_CACHE_TTL = 5000; // 5 seconds cache

  async getUnreadChatCount(): Promise<number> {
    // Check cache first
    if (this.unreadChatCountCache) {
      const now = Date.now();
      if (now - this.unreadChatCountCache.timestamp < this.UNREAD_CACHE_TTL) {
        return this.unreadChatCountCache.count;
      }
    }

    try {
      const response = await this.client.get('/chat/unread-count');
      const count = response.data.unreadCount || response.data.data?.count || 0;
      
      // Cache the result
      this.unreadChatCountCache = {
        count,
        timestamp: Date.now()
      };
      
      return count;
    } catch (error) {
      console.error('Failed to get unread chat count:', error);
      // Return cached value if available, otherwise 0
      return this.unreadChatCountCache?.count || 0;
    }
  }

  async getUnreadFeedCount(): Promise<number> {
    try {
      const response = await this.client.get('/feed/unread-count');
      return response.data.data?.count || 0;
    } catch (error) {
      console.error('Failed to get unread feed count:', error);
      return 0;
    }
  }

  async confirmEventAttendance(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/events/${eventId}/confirm-attendance`);
    return response.data;
  }

  async cancelEventAttendance(eventId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/events/${eventId}/attendance`);
    return response.data;
  }

  async sendChatMessage(chatId: string, message: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/chat/${chatId}/messages`, { message });
    return response.data;
  }

  async approveBooking(bookingId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/bookings/${bookingId}/approve`);
    return response.data;
  }

  async rejectBooking(bookingId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/bookings/${bookingId}/reject`);
    return response.data;
  }

  // ============================================================================
  // Gamification Endpoints
  // ============================================================================

  async getGamificationStats(): Promise<ApiResponse<GamificationStats>> {
    const response = await this.client.get('/gamification/stats');
    return response.data;
  }

  async getAchievements(): Promise<ApiResponse<Achievement[]>> {
    const response = await this.client.get('/gamification/achievements');
    return response.data;
  }

  async getQuests(type?: 'daily' | 'weekly' | 'biweekly' | 'monthly'): Promise<ApiResponse<Quest[]>> {
    const response = await this.client.get('/gamification/quests', {
      params: { type },
    });
    return response.data;
  }

  async completeQuestTask(questId: string, taskId: string): Promise<ApiResponse<{
    quest: Quest;
    pointsEarned: number;
  }>> {
    const response = await this.client.post(`/gamification/quests/${questId}/tasks/${taskId}/complete`);
    return response.data;
  }

  async getLeaderboard(type: 'dinners' | 'points' | 'monthly'): Promise<ApiResponse<LeaderboardData>> {
    const response = await this.client.get('/gamification/leaderboard', {
      params: { type },
    });
    return response.data;
  }

  async getPointTransactions(limit: number = 50): Promise<ApiResponse<PointTransaction[]>> {
    const response = await this.client.get('/gamification/transactions', {
      params: { limit },
    });
    return response.data;
  }

  async getLoyaltyShopItems(): Promise<ApiResponse<LoyaltyItem[]>> {
    const response = await this.client.get('/gamification/loyalty/items');
    return response.data;
  }

  async redeemLoyaltyItem(itemId: string): Promise<ApiResponse<{
    success: boolean;
    remainingPoints: number;
  }>> {
    const response = await this.client.post(`/gamification/loyalty/redeem/${itemId}`);
    return response.data;
  }

  async getStreakInfo(): Promise<ApiResponse<StreakInfo>> {
    const response = await this.client.get('/gamification/streak');
    return response.data;
  }

  async claimStreakBonus(): Promise<ApiResponse<{
    pointsEarned: number;
    newStreak: number;
  }>> {
    const response = await this.client.post('/gamification/streak/claim');
    return response.data;
  }

  async trackAchievementProgress(achievementId: string, progress: number): Promise<ApiResponse<Achievement>> {
    const response = await this.client.post(`/gamification/achievements/${achievementId}/progress`, {
      progress,
    });
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

  async createBookingWithPayment(data: {
    dinnerId: string;
    paymentMethodId: string;
    savePaymentMethod?: boolean;
    dietaryRestrictions?: string;
    preferences?: string;
  }): Promise<ApiResponse<{
    booking: Booking;
    paymentIntent: {
      id: string;
      client_secret: string;
      amount: number;
      status: string;
    };
    message: string;
  }>> {
    const response = await this.client.post('/payments/create-booking', data);
    return response.data;
  }

  // ==========================================================================
  // Stream Chat Token Endpoint
  // ==========================================================================

  getChatUserToken(): Promise<{ token: string; displayName?: string; streamUserId?: string }> {
    return AuthAPI.getChatUserToken();
  }

  // ==========================================================================
  // Additional Notification Endpoints
  // ==========================================================================

  async createNotification(notification: NotificationData): Promise<ApiResponse<NotificationData>> {
    const response = await this.client.post('/notifications', notification);
    return response.data;
  }

  async updateNotification(
    notificationId: string,
    updates: Partial<NotificationData>
  ): Promise<ApiResponse<NotificationData>> {
    const response = await this.client.patch(`/notifications/${notificationId}`, updates);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async unregisterPushToken(token: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete('/notifications/push-token', { data: { token } });
    return response.data;
  }

  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    const response = await this.client.get('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    const response = await this.client.put('/notifications/preferences', preferences);
    return response.data;
  }

  // ============================================================================
  // Connections Endpoints
  // ============================================================================
  
  /**
   * Get all accepted connections (friends)
   */
  async getConnections(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/connections');
    return response.data;
  }
  
  /**
   * Get pending connection requests received
   */
  async getPendingConnections(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/connections/pending');
    return response.data;
  }
  
  /**
   * @deprecated Use getPendingConnections instead
   */
  async getConnectionRequests(): Promise<ApiResponse<any[]>> {
    return this.getPendingConnections();
  }
  
  /**
   * Send a new connection request
   */
  async sendConnectionRequest(userId: string, message?: string): Promise<ApiResponse<{ connectionId: string }>> {
    const response = await this.client.post('/connections', {
      userId,
      message
    });
    return response.data;
  }
  
  /**
   * Accept a pending connection request
   */
  async acceptConnection(connectionId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/connections/${connectionId}/accept`);
    return response.data;
  }
  
  /**
   * @deprecated Use acceptConnection instead
   */
  async acceptConnectionRequest(connectionId: string): Promise<ApiResponse<void>> {
    return this.acceptConnection(connectionId);
  }
  
  /**
   * Reject a pending connection request
   */
  async rejectConnection(connectionId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/connections/${connectionId}/reject`);
    return response.data;
  }
  
  /**
   * Remove an existing connection (unfriend)
   */
  async removeConnection(connectionId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/connections/${connectionId}`);
    return response.data;
  }
  
  /**
   * @deprecated Use removeConnection for unfriending or rejectConnection for declining requests
   */
  async declineConnection(connectionId: string): Promise<ApiResponse<void>> {
    return this.removeConnection(connectionId);
  }
  
  /**
   * Block a specific user
   */
  async blockUser(userId: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/connections/users/${userId}/block`);
    return response.data;
  }
  
  /**
   * Search for users to connect with
   */
  async searchUsers(query: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/connections/users/search', {
      params: { q: query }
    });
    return response.data;
  }
  
  /**
   * Get mutual connections count with another user
   */
  async getMutualConnections(userId: string): Promise<ApiResponse<{ count: number }>> {
    const response = await this.client.get(`/connections/users/${userId}/mutual`);
    return response.data;
  }
  
  /**
   * @deprecated Use getMutualConnections instead
   */
  async getMutualConnectionsCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return this.getMutualConnections(userId);
  }

  // ============================================================================
  // Restaurant Endpoints
  // ============================================================================
  
  async getTopRatedRestaurants(limit = 10): Promise<ApiResponse<RestaurantItem[]>> {
    const response = await this.client.get('/restaurants/top-rated', {
      params: { limit }
    });
    return response.data;
  }
  
  async getRestaurantDetails(id: string): Promise<ApiResponse<RestaurantDetails>> {
    const response = await this.client.get(`/restaurants/${id}`);
    return response.data;
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

  // Generic HTTP methods for custom endpoints
  async get<T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(endpoint, config);
    return response.data;
  }

  async post<T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(endpoint, data, config);
    return response.data;
  }

  async put<T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(endpoint, data, config);
    return response.data;
  }

  async delete<T = unknown>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(endpoint, config);
    return response.data;
  }

  // Generic request method for any custom endpoints
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
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

  // Helper method for error handling
  private handleError(error: any): ApiResponse<any> {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'An error occurred',
    };
  }

  // User Preferences Methods
  async getUserPreferences(): Promise<ApiResponse<any>> {
    try {
      // Fetch user's profile which includes onboarding data
      const profileResponse = await this.getUserProfile();
      
      if (!profileResponse.success) {
        return profileResponse;
      }

      // The response has a 'profile' field that contains the onboarding profile data
      const profile = (profileResponse as any).profile || {};
      
      // Return ALL onboarding data for prefilling optional onboarding screens
      const preferences = {
        // Basic info
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name || profile.nickname,
        gender: profile.gender,
        birthday: profile.birthday || profile.date_of_birth,
        
        // Education & Work
        education: profile.education,
        education_level: profile.education_level,
        school: profile.school,
        work: profile.work,
        profession: profile.profession,
        job_title: profile.job_title || profile.profession,
        line_of_work: profile.line_of_work || profile.industry,
        industry: profile.industry,
        company: profile.company,
        
        // Background
        nationality: profile.nationality,
        ethnicity: profile.ethnicity,
        religion: profile.religion,
        relationship_status: profile.relationship_status,
        height_feet: profile.height_feet,
        height_inches: profile.height_inches,
        height_cm: profile.height_cm,
        
        // Personality
        personality_type: profile.personality_type,
        mbti_type: profile.mbti_type || profile.personality_type,
        roles: profile.roles || [],
        personality_traits: profile.personality_traits,
        
        // Lifestyle
        lifestyle: profile.lifestyle,
        substances: profile.substances || [],
        early_bird_night_owl: profile.early_bird_night_owl,
        active_person: profile.active_person,
        punctuality: profile.punctuality,
        work_life_balance: profile.work_life_balance,
        
        // Food preferences
        dietary_restrictions: profile.dietary_restrictions || [],
        dinner_duration: profile.dinner_duration,
        food_craving: profile.food_craving || [],
        cuisines_to_try: profile.cuisines_to_try || [],
        cuisines_to_avoid: profile.cuisines_to_avoid || [],
        dining_atmospheres: profile.dining_atmospheres || [],
        food_budget: profile.food_budget || null,
        spicy_level: profile.spicy_level || null,
        drinking_level: profile.drinking_level || null,
        adventurous_level: profile.adventurous_level || null,
        
        // Interests & Hobbies
        interests: profile.interests || [],
        hobbies: profile.hobbies || [],
        hoping_to_meet: profile.hoping_to_meet || '',
        interesting_fact: profile.interesting_fact || '',
        
        // Location
        zipcode: profile.zipcode || null,
        travel_distance: profile.travel_distance || null,
      };

      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateBookingPreferences(bookingId: string, preferences: any): Promise<ApiResponse<any>> {
    try {
      // For now, just return success
      // TODO: Implement backend endpoint
      console.log('updateBookingPreferences called with:', { bookingId, preferences });
      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Post-Dinner Survey
  async getBookingGroupMembers(bookingId: string): Promise<ApiResponse<{
    restaurant: {
      name: string;
      address: string;
      cuisine: string;
      reservationDate: string;
      reservationTime: string;
    };
    diners: Array<{
      id: string;
      name: string;
      avatar?: string;
      dinerId: number;
      bio?: string;
    }>;
    totalGroupSize: number;
  }>> {
    try {
      const response = await this.client.get(`/bookings/${bookingId}/group-members`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async submitPostDinnerSurvey(data: {
    bookingId: string;
    dinnerId: string;
    ratings: {
      restaurant: number;
      conversation: number;
      chemistry: number;
      overall: number;
    };
    feedback?: string;
    matches?: string[];
    additionalData?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/bookings/survey', data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPendingSurveys(): Promise<ApiResponse<EventBooking[]>> {
    try {
      const response = await this.client.get('/bookings/pending-surveys');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const api = new ApiService();

// Export types
export type { AxiosError };
