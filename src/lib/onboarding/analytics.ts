/**
 * Production-grade analytics for onboarding
 * Track user behavior, drop-off points, and completion rates
 */

import { createClient } from '@segment/analytics-react-native';
// Sentry integration - optional, uncomment if Sentry is installed
// import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStepType } from './constants';

// Create analytics client - in production, initialize with your write key
const analytics = createClient({
  writeKey: process.env.SEGMENT_WRITE_KEY || 'YOUR_WRITE_KEY',
});

interface OnboardingEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

interface StepMetrics {
  stepName: string;
  timeSpent: number;
  completed: boolean;
  errors: number;
  retries: number;
}

/**
 * Comprehensive analytics for onboarding flow
 */
export class OnboardingAnalytics {
  private static instance: OnboardingAnalytics;
  private sessionId: string;
  private sessionStartTime: number;
  private stepMetrics: Map<string, StepMetrics> = new Map();
  private currentStepStartTime: number | null = null;
  private currentStep: string | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.loadPreviousSession();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OnboardingAnalytics {
    if (!OnboardingAnalytics.instance) {
      OnboardingAnalytics.instance = new OnboardingAnalytics();
    }
    return OnboardingAnalytics.instance;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `onboarding_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Track onboarding start
   */
  trackOnboardingStart(isResume: boolean = false): void {
    const event: OnboardingEvent = {
      event: isResume ? 'Onboarding Resumed' : 'Onboarding Started',
      properties: {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        isResume,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
    
    // Add breadcrumb for Sentry (if available)
    // Uncomment when Sentry is installed:
    // Sentry.addBreadcrumb({
    //   category: 'onboarding',
    //   message: isResume ? 'Resumed onboarding' : 'Started onboarding',
    //   level: 'info',
    //   data: event.properties,
    // });
  }

  /**
   * Track step view
   */
  trackStepView(step: OnboardingStepType): void {
    // End timing for previous step
    if (this.currentStep && this.currentStepStartTime) {
      this.endStepTiming(this.currentStep, false);
    }

    // Start timing for new step
    this.currentStep = step;
    this.currentStepStartTime = Date.now();

    const event: OnboardingEvent = {
      event: 'Onboarding Step Viewed',
      properties: {
        sessionId: this.sessionId,
        step,
        timestamp: new Date().toISOString(),
        previousStep: this.getPreviousStep(),
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
  }

  /**
   * Track step completion
   */
  trackStepCompleted(
    step: OnboardingStepType,
    data?: Record<string, any>
  ): void {
    this.endStepTiming(step, true);

    const event: OnboardingEvent = {
      event: 'Onboarding Step Completed',
      properties: {
        sessionId: this.sessionId,
        step,
        timestamp: new Date().toISOString(),
        hasData: !!data,
        dataFieldsCount: data ? Object.keys(data).length : 0,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
  }

  /**
   * Track step skipped
   */
  trackStepSkipped(step: OnboardingStepType, reason?: string): void {
    const event: OnboardingEvent = {
      event: 'Onboarding Step Skipped',
      properties: {
        sessionId: this.sessionId,
        step,
        reason: reason || 'user_choice',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
  }

  /**
   * Track error
   */
  trackError(
    step: OnboardingStepType,
    error: Error,
    context?: Record<string, any>
  ): void {
    // Update error count for step
    const metrics = this.stepMetrics.get(step) || this.createStepMetrics(step);
    metrics.errors++;
    this.stepMetrics.set(step, metrics);

    const event: OnboardingEvent = {
      event: 'Onboarding Error',
      properties: {
        sessionId: this.sessionId,
        step,
        errorMessage: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);

    // Log to Sentry (if available)
    // Uncomment when Sentry is installed:
    // Sentry.captureException(error, {
    //   tags: {
    //     component: 'onboarding',
    //     step,
    //     sessionId: this.sessionId,
    //   },
    //   extra: context,
    // });
  }

  /**
   * Track retry attempt
   */
  trackRetry(step: OnboardingStepType, attemptNumber: number): void {
    const metrics = this.stepMetrics.get(step) || this.createStepMetrics(step);
    metrics.retries = attemptNumber;
    this.stepMetrics.set(step, metrics);

    const event: OnboardingEvent = {
      event: 'Onboarding Step Retry',
      properties: {
        sessionId: this.sessionId,
        step,
        attemptNumber,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
  }

  /**
   * Track onboarding completion
   */
  trackOnboardingCompleted(isMandatoryOnly: boolean = false): void {
    const totalTime = Date.now() - this.sessionStartTime;
    const completedSteps = Array.from(this.stepMetrics.values()).filter(
      m => m.completed
    ).length;

    const event: OnboardingEvent = {
      event: 'Onboarding Completed',
      properties: {
        sessionId: this.sessionId,
        totalTimeMs: totalTime,
        totalTimeMinutes: Math.round(totalTime / 60000),
        completedSteps,
        totalSteps: this.stepMetrics.size,
        isMandatoryOnly,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
    this.sendSessionMetrics();
    this.clearSession();
  }

  /**
   * Track drop-off
   */
  trackDropOff(step: OnboardingStepType, reason?: string): void {
    const event: OnboardingEvent = {
      event: 'Onboarding Drop Off',
      properties: {
        sessionId: this.sessionId,
        step,
        reason: reason || 'unknown',
        timeSpentMs: Date.now() - this.sessionStartTime,
        completedSteps: Array.from(this.stepMetrics.values()).filter(
          m => m.completed
        ).length,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
    this.saveSession();
  }

  /**
   * Track custom event
   */
  trackCustomEvent(eventName: string, properties?: Record<string, any>): void {
    const event: OnboardingEvent = {
      event: `Onboarding ${eventName}`,
      properties: {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        ...properties,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendEvent(event);
  }

  /**
   * End timing for a step
   */
  private endStepTiming(step: string, completed: boolean): void {
    if (!this.currentStepStartTime) return;

    const timeSpent = Date.now() - this.currentStepStartTime;
    const metrics = this.stepMetrics.get(step) || this.createStepMetrics(step);
    
    metrics.timeSpent = timeSpent;
    metrics.completed = completed;
    
    this.stepMetrics.set(step, metrics);
    this.currentStepStartTime = null;
  }

  /**
   * Create initial step metrics
   */
  private createStepMetrics(step: string): StepMetrics {
    return {
      stepName: step,
      timeSpent: 0,
      completed: false,
      errors: 0,
      retries: 0,
    };
  }

  /**
   * Get previous step
   */
  private getPreviousStep(): string | null {
    const steps = Array.from(this.stepMetrics.keys());
    return steps.length > 0 ? steps[steps.length - 1] : null;
  }

  /**
   * Send event to analytics service
   */
  private sendEvent(event: OnboardingEvent): void {
    // Send to Segment or your analytics provider
    if (analytics) {
      analytics.track(event.event, event.properties);
    }

    // Log in development
    if (__DEV__) {
      console.log('📊 Analytics Event:', event);
    }

    // Store locally for batch processing if needed
    this.storeEventLocally(event);
  }

  /**
   * Send session metrics
   */
  private sendSessionMetrics(): void {
    const metrics = {
      sessionId: this.sessionId,
      totalDuration: Date.now() - this.sessionStartTime,
      steps: Array.from(this.stepMetrics.values()).map(step => ({
        stepName: step.stepName,
        timeSpent: step.timeSpent,
        completed: step.completed,
        errors: step.errors,
        retries: step.retries,
      })),
      completionRate: this.calculateCompletionRate(),
      averageStepTime: this.calculateAverageStepTime(),
    };

    // Send to analytics
    if (analytics) {
      analytics.track('Onboarding Session Metrics', metrics);
    }

    // Log to Sentry as context (if available)
    // Uncomment when Sentry is installed:
    // Sentry.setContext('onboarding_session', metrics);
  }

  /**
   * Calculate completion rate
   */
  private calculateCompletionRate(): number {
    if (this.stepMetrics.size === 0) return 0;
    
    const completed = Array.from(this.stepMetrics.values()).filter(
      m => m.completed
    ).length;
    
    return Math.round((completed / this.stepMetrics.size) * 100);
  }

  /**
   * Calculate average step time
   */
  private calculateAverageStepTime(): number {
    const times = Array.from(this.stepMetrics.values())
      .filter(m => m.timeSpent > 0)
      .map(m => m.timeSpent);
    
    if (times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round(sum / times.length);
  }

  /**
   * Store event locally for batch processing
   */
  private async storeEventLocally(event: OnboardingEvent): Promise<void> {
    try {
      const key = `analytics_event_${Date.now()}_${Math.random()}`;
      await AsyncStorage.setItem(key, JSON.stringify(event));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  /**
   * Save session for resume
   */
  private async saveSession(): Promise<void> {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        metrics: Array.from(this.stepMetrics.entries()),
      };
      
      await AsyncStorage.setItem(
        'onboarding_session',
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  /**
   * Load previous session
   */
  private async loadPreviousSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem('onboarding_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Restore metrics from previous session
        this.stepMetrics = new Map(parsed.metrics);
      }
    } catch (error) {
      console.warn('Failed to load previous session:', error);
    }
  }

  /**
   * Clear session data
   */
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('onboarding_session');
      this.stepMetrics.clear();
      this.currentStep = null;
      this.currentStepStartTime = null;
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }
}