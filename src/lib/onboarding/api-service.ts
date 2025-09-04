/**
 * Production-grade API service for onboarding
 * Includes retry logic, caching, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OnboardingAPI } from '@/services/api/onboardingApi';
import { TIMING, STORAGE_KEYS } from './constants';
import { OnboardingError, OnboardingErrorType, OnboardingErrorHandler } from './error-handler';
import type { OnboardingStep } from './validation';

interface CachedData {
  data: any;
  timestamp: number;
  step: OnboardingStep | string;
}

interface QueuedRequest {
  step: OnboardingStep | string;
  data: any;
  timestamp: number;
  attempts: number;
}

/**
 * Production-grade onboarding API service
 */
export class OnboardingApiService {
  private static instance: OnboardingApiService;
  private requestQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private cacheExpirationMs = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeNetworkListener();
    this.loadQueueFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OnboardingApiService {
    if (!OnboardingApiService.instance) {
      OnboardingApiService.instance = new OnboardingApiService();
    }
    return OnboardingApiService.instance;
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Save step data with retry and offline support
   */
  async saveStep(step: OnboardingStep | string, data: any): Promise<{ success: boolean; cached?: boolean }> {
    const startTime = Date.now();

    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return this.handleOfflineSave(step, data);
      }

      // Attempt to save with retry logic
      const result = await OnboardingErrorHandler.handleNetworkError(
        async () => {
          const response = await OnboardingAPI.saveStep({ step: step as any, data });
          return response;
        },
        TIMING.MAX_RETRY_ATTEMPTS,
        TIMING.RETRY_DELAY
      );

      // Cache successful save
      await this.cacheStepData(step, data);

      // Log performance
      OnboardingErrorHandler.logPerformance(
        step,
        Date.now() - startTime,
        true
      );

      return { success: result.success };

    } catch (error) {
      // Log performance even on failure
      OnboardingErrorHandler.logPerformance(
        step,
        Date.now() - startTime,
        false
      );

      // Handle offline save as fallback
      if (this.isNetworkError(error)) {
        return this.handleOfflineSave(step, data);
      }

      throw new OnboardingError(
        'Failed to save onboarding step',
        OnboardingErrorType.API,
        step,
        { originalError: error }
      );
    }
  }

  /**
   * Handle offline save by queuing request
   */
  private async handleOfflineSave(
    step: OnboardingStep | string,
    data: any
  ): Promise<{ success: boolean; cached: boolean }> {
    // Add to queue
    const queueItem: QueuedRequest = {
      step,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.requestQueue.push(queueItem);

    // Persist queue to storage
    await this.saveQueueToStorage();

    // Cache data for immediate retrieval
    await this.cacheStepData(step, data);

    return { success: true, cached: true };
  }

  /**
   * Process queued requests when online
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    const failedRequests: QueuedRequest[] = [];

    for (const request of this.requestQueue) {
      try {
        await OnboardingAPI.saveStep({
          step: request.step as any,
          data: request.data,
        });
      } catch (_error) {
        request.attempts++;
        if (request.attempts < TIMING.MAX_RETRY_ATTEMPTS) {
          failedRequests.push(request);
        }
      }
    }

    this.requestQueue = failedRequests;
    await this.saveQueueToStorage();
  }

  /**
   * Cache step data locally
   */
  private async cacheStepData(step: OnboardingStep | string, data: any): Promise<void> {
    const cacheKey = `${STORAGE_KEYS.TEMP_DATA}_${step}`;
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
      step,
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache step data:', error);
    }
  }

  /**
   * Get cached step data
   */
  async getCachedStepData(step: OnboardingStep | string): Promise<any | null> {
    const cacheKey = `${STORAGE_KEYS.TEMP_DATA}_${step}`;

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > this.cacheExpirationMs) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(STORAGE_KEYS.TEMP_DATA)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'onboarding_queue',
        JSON.stringify(this.requestQueue)
      );
    } catch (error) {
      console.warn('Failed to save queue:', error);
    }
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem('onboarding_queue');
      if (queue) {
        this.requestQueue = JSON.parse(queue);
        // Process queue if online
        if (this.isOnline) {
          this.processQueue();
        }
      }
    } catch (error) {
      console.warn('Failed to load queue:', error);
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    return (
      error.message?.includes('Network') ||
      error.message?.includes('fetch') ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNREFUSED'
    );
  }

  /**
   * Get resume information
   */
  async getResumeInfo(): Promise<any> {
    try {
      const response = await OnboardingAPI.getResumeInfo();
      return response;
    } catch (error) {
      // Try to build from cached data if API fails
      const cachedInfo = await this.buildResumeInfoFromCache();
      if (cachedInfo) {
        return cachedInfo;
      }
      throw error;
    }
  }

  /**
   * Build resume info from cached data
   */
  private async buildResumeInfoFromCache(): Promise<any | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(STORAGE_KEYS.TEMP_DATA)
      );

      const completedSteps: string[] = [];
      
      for (const key of cacheKeys) {
        const step = key.replace(`${STORAGE_KEYS.TEMP_DATA}_`, '');
        completedSteps.push(step);
      }

      if (completedSteps.length === 0) {
        return null;
      }

      return {
        success: true,
        canResume: true,
        completedSteps,
        message: 'Resume information built from cache',
      };
    } catch (error) {
      console.warn('Failed to build resume info from cache:', error);
      return null;
    }
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<{ success: boolean }> {
    try {
      // Process any queued requests first
      await this.processQueue();

      // Mark as complete
      const response = await OnboardingAPI.completeOnboarding({
        firstName: '',
        lastName: '',
        nickname: '',
        birthDate: '',
        gender: 'prefer_not_to_say',
      });

      // Clear cache after successful completion
      await this.clearCache();
      await AsyncStorage.removeItem('onboarding_queue');

      return response;
    } catch (error) {
      throw new OnboardingError(
        'Failed to complete onboarding',
        OnboardingErrorType.API,
        undefined,
        { originalError: error }
      );
    }
  }
}