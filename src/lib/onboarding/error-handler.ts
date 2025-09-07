/**
 * Production-grade error handling for onboarding
 */

import { Alert } from 'react-native';
// Sentry integration - optional, uncomment if Sentry is installed
// import * as Sentry from '@sentry/react-native';
import { ERROR_MESSAGES } from './constants';

export enum OnboardingErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  API = 'API',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

export class OnboardingError extends Error {
  type: OnboardingErrorType;
  field?: string;
  context?: Record<string, any>;

  constructor(
    message: string,
    type: OnboardingErrorType = OnboardingErrorType.UNKNOWN,
    field?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OnboardingError';
    this.type = type;
    this.field = field;
    this.context = context;
  }
}

/**
 * Centralized error handler for onboarding flows
 */
export class OnboardingErrorHandler {
  private static isDevelopment = __DEV__;

  /**
   * Handle and log errors appropriately
   */
  static handle(error: Error | OnboardingError, context?: Record<string, any>): void {
    // Log to console in development
    if (this.isDevelopment) {
      console.error('🔥 Onboarding Error:', {
        message: error.message,
        type: (error as OnboardingError).type,
        field: (error as OnboardingError).field,
        context: { ...context, ...(error as OnboardingError).context },
        stack: error.stack,
      });
    }

    // Log to Sentry in production (if available)
    // Uncomment when Sentry is installed:
    // if (!this.isDevelopment) {
    //   Sentry.captureException(error, {
    //     tags: {
    //       component: 'onboarding',
    //       type: (error as OnboardingError).type || 'unknown',
    //     },
    //     extra: {
    //       field: (error as OnboardingError).field,
    //       ...context,
    //       ...(error as OnboardingError).context,
    //     },
    //   });
    // }

    // Show user-friendly alert
    this.showUserAlert(error);
  }

  /**
   * Show appropriate alert to user
   */
  private static showUserAlert(error: Error | OnboardingError): void {
    const onboardingError = error as OnboardingError;
    
    let title = 'Error';
    let message: string = ERROR_MESSAGES.SAVE_FAILED;

    switch (onboardingError.type) {
      case OnboardingErrorType.VALIDATION:
        title = 'Validation Error';
        message = error.message || ERROR_MESSAGES.REQUIRED;
        break;
      
      case OnboardingErrorType.NETWORK:
        title = 'Connection Error';
        message = ERROR_MESSAGES.NETWORK_ERROR;
        break;
      
      case OnboardingErrorType.API:
        title = 'Server Error';
        message = error.message || ERROR_MESSAGES.SAVE_FAILED;
        break;
      
      case OnboardingErrorType.STORAGE:
        title = 'Storage Error';
        message = 'Failed to save data locally. Please try again.';
        break;
      
      default:
        // Use default title and message
        break;
    }

    Alert.alert(title, message, [
      {
        text: 'OK',
        style: 'default',
      },
    ]);
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(
    field: string,
    message: string,
    showAlert: boolean = true
  ): OnboardingError {
    const error = new OnboardingError(
      message,
      OnboardingErrorType.VALIDATION,
      field
    );

    if (showAlert) {
      this.handle(error);
    }

    return error;
  }

  /**
   * Handle network errors with retry logic
   */
  static async handleNetworkError<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw new OnboardingError(
            'Network request failed after multiple attempts',
            OnboardingErrorType.NETWORK,
            undefined,
            { attempts: maxAttempts }
          );
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError || new Error('Unknown network error');
  }

  /**
   * Create a user-friendly error message
   */
  static getUserMessage(error: Error | OnboardingError): string {
    const onboardingError = error as OnboardingError;

    switch (onboardingError.type) {
      case OnboardingErrorType.VALIDATION:
        return error.message;
      
      case OnboardingErrorType.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      
      case OnboardingErrorType.API:
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return 'Your session has expired. Please log in again.';
        }
        return ERROR_MESSAGES.SAVE_FAILED;
      
      default:
        return ERROR_MESSAGES.SAVE_FAILED;
    }
  }

  /**
   * Log performance metrics
   */
  static logPerformance(
    step: string,
    duration: number,
    success: boolean
  ): void {
    const metric = {
      step,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    if (this.isDevelopment) {
      console.log('📊 Performance metric:', metric);
    }

    // Send to analytics in production (if available)
    // Uncomment when Sentry is installed:
    // if (!this.isDevelopment) {
    //   Sentry.addBreadcrumb({
    //     category: 'performance',
    //     message: `Onboarding step ${step}`,
    //     level: 'info',
    //     data: metric,
    //   });
    // }
  }
}