import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationType, NotificationData } from '@/types/notification.types';
import { api } from './api';

interface NotificationMetrics {
  sent: number;
  delivered: number;
  opened: number;
  dismissed: number;
  failed: number;
  actionTaken: number;
}

interface NotificationAnalyticsEvent {
  notificationId: string;
  type: NotificationType;
  event: 'sent' | 'delivered' | 'opened' | 'dismissed' | 'failed' | 'action_taken';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class NotificationAnalyticsService {
  private analyticsQueue: NotificationAnalyticsEvent[] = [];
  private metrics: Map<NotificationType, NotificationMetrics> = new Map();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 20;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.initializeMetrics();
    this.loadStoredAnalytics();
  }

  private initializeMetrics() {
    // Initialize metrics for all notification types
    Object.values(NotificationType).forEach(type => {
      this.metrics.set(type as NotificationType, {
        sent: 0,
        delivered: 0,
        opened: 0,
        dismissed: 0,
        failed: 0,
        actionTaken: 0,
      });
    });
  }

  private async loadStoredAnalytics() {
    try {
      const stored = await AsyncStorage.getItem('notification_analytics_queue');
      if (stored) {
        this.analyticsQueue = JSON.parse(stored);
        this.processBatchIfNeeded();
      }

      const storedMetrics = await AsyncStorage.getItem('notification_metrics');
      if (storedMetrics) {
        const parsed = JSON.parse(storedMetrics);
        Object.entries(parsed).forEach(([type, metrics]) => {
          this.metrics.set(type as NotificationType, metrics as NotificationMetrics);
        });
      }
    } catch (error) {
      console.error('Failed to load notification analytics:', error);
    }
  }

  async trackNotificationEvent(
    notification: NotificationData,
    event: NotificationAnalyticsEvent['event'],
    metadata?: Record<string, any>
  ) {
    try {
      const analyticsEvent: NotificationAnalyticsEvent = {
        notificationId: notification.id,
        type: notification.type,
        event,
        timestamp: new Date(),
        metadata,
      };

      // Add to queue
      this.analyticsQueue.push(analyticsEvent);

      // Update local metrics
      const metrics = this.metrics.get(notification.type) || this.initializeMetricForType(notification.type);
      switch (event) {
        case 'sent':
          metrics.sent++;
          break;
        case 'delivered':
          metrics.delivered++;
          break;
        case 'opened':
          metrics.opened++;
          break;
        case 'dismissed':
          metrics.dismissed++;
          break;
        case 'failed':
          metrics.failed++;
          break;
        case 'action_taken':
          metrics.actionTaken++;
          break;
      }
      this.metrics.set(notification.type, metrics);

      // Store locally
      await this.saveAnalytics();

      // Process batch if needed
      this.processBatchIfNeeded();
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  private initializeMetricForType(type: NotificationType): NotificationMetrics {
    const metrics = {
      sent: 0,
      delivered: 0,
      opened: 0,
      dismissed: 0,
      failed: 0,
      actionTaken: 0,
    };
    this.metrics.set(type, metrics);
    return metrics;
  }

  private async saveAnalytics() {
    try {
      await AsyncStorage.setItem('notification_analytics_queue', JSON.stringify(this.analyticsQueue));
      
      const metricsObject: Record<string, NotificationMetrics> = {};
      this.metrics.forEach((value, key) => {
        metricsObject[key] = value;
      });
      await AsyncStorage.setItem('notification_metrics', JSON.stringify(metricsObject));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  private processBatchIfNeeded() {
    if (this.analyticsQueue.length >= this.BATCH_SIZE) {
      this.sendBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.sendBatch();
      }, this.BATCH_INTERVAL);
    }
  }

  private async sendBatch() {
    if (this.analyticsQueue.length === 0) return;

    try {
      const batch = this.analyticsQueue.splice(0, this.BATCH_SIZE);
      
      // Send to backend
      await api.request('POST', '/analytics/notifications', { events: batch });

      // Clear timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Save updated queue
      await this.saveAnalytics();

      // Process remaining if any
      if (this.analyticsQueue.length > 0) {
        this.processBatchIfNeeded();
      }
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      // Re-add failed batch to queue
      // The batch will be retried next time
    }
  }

  async getMetrics(type?: NotificationType): Promise<NotificationMetrics | Map<NotificationType, NotificationMetrics>> {
    if (type) {
      return this.metrics.get(type) || this.initializeMetricForType(type);
    }
    return this.metrics;
  }

  async getEngagementRate(type?: NotificationType): Promise<number> {
    if (type) {
      const metrics = this.metrics.get(type);
      if (!metrics || metrics.delivered === 0) return 0;
      return (metrics.opened / metrics.delivered) * 100;
    }

    // Calculate overall engagement rate
    let totalDelivered = 0;
    let totalOpened = 0;
    this.metrics.forEach(metrics => {
      totalDelivered += metrics.delivered;
      totalOpened += metrics.opened;
    });

    if (totalDelivered === 0) return 0;
    return (totalOpened / totalDelivered) * 100;
  }

  async getActionRate(type?: NotificationType): Promise<number> {
    if (type) {
      const metrics = this.metrics.get(type);
      if (!metrics || metrics.opened === 0) return 0;
      return (metrics.actionTaken / metrics.opened) * 100;
    }

    // Calculate overall action rate
    let totalOpened = 0;
    let totalActions = 0;
    this.metrics.forEach(metrics => {
      totalOpened += metrics.opened;
      totalActions += metrics.actionTaken;
    });

    if (totalOpened === 0) return 0;
    return (totalActions / totalOpened) * 100;
  }

  async clearAnalytics() {
    this.analyticsQueue = [];
    this.initializeMetrics();
    await AsyncStorage.removeItem('notification_analytics_queue');
    await AsyncStorage.removeItem('notification_metrics');
  }

  // Force send all pending analytics
  async flush() {
    if (this.analyticsQueue.length > 0) {
      await this.sendBatch();
    }
  }
}

export const notificationAnalytics = new NotificationAnalyticsService();