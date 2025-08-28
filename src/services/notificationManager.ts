import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { notificationAnalytics } from './notificationAnalytics';
import { api } from './api';
import {
  NotificationType,
  NotificationData,
  NotificationChannel,
  NotificationPriority,
} from '@/types/notification.types';

interface NotificationQueue {
  id: string;
  notification: NotificationData;
  retryCount: number;
  scheduledFor?: Date;
  failureReason?: string;
}

interface NotificationGroup {
  id: string;
  type: NotificationType;
  notifications: NotificationData[];
  summary: string;
  count: number;
}

class NotificationManager {
  private notificationQueue: NotificationQueue[] = [];
  private failedNotifications: NotificationQueue[] = [];
  private notificationGroups: Map<string, NotificationGroup> = new Map();
  private isOnline: boolean = true;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load queued notifications
    await this.loadQueuedNotifications();

    // Monitor network status
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected || false;
      if (this.isOnline) {
        this.processQueue();
      }
    });

    // Process queue periodically
    setInterval(() => {
      this.processQueue();
    }, 30000); // Every 30 seconds
  }

  private async loadQueuedNotifications() {
    try {
      const queued = await AsyncStorage.getItem('notification_queue');
      if (queued) {
        this.notificationQueue = JSON.parse(queued);
      }

      const failed = await AsyncStorage.getItem('failed_notifications');
      if (failed) {
        this.failedNotifications = JSON.parse(failed);
      }
    } catch (error) {
      console.error('Failed to load queued notifications:', error);
    }
  }

  private async saveQueuedNotifications() {
    try {
      await AsyncStorage.setItem('notification_queue', JSON.stringify(this.notificationQueue));
      await AsyncStorage.setItem('failed_notifications', JSON.stringify(this.failedNotifications));
    } catch (error) {
      console.error('Failed to save queued notifications:', error);
    }
  }

  // Enhanced notification delivery with retry logic
  async sendNotification(notification: NotificationData, options?: {
    schedule?: Date;
    groupId?: string;
    sound?: string;
    critical?: boolean;
  }) {
    try {
      // Track sent event
      await notificationAnalytics.trackNotificationEvent(notification, 'sent');

      // Check if should group
      if (options?.groupId) {
        this.addToGroup(notification, options.groupId);
      }

      // Check if scheduled
      if (options?.schedule && options.schedule > new Date()) {
        return await this.scheduleNotification(notification, options.schedule);
      }

      // Check network status for remote notifications
      if (!this.isOnline && this.requiresNetwork(notification)) {
        this.queueNotification(notification);
        return;
      }

      // Send immediately
      await this.deliverNotification(notification, options);
      
      // Track delivery
      await notificationAnalytics.trackNotificationEvent(notification, 'delivered');
    } catch (error) {
      console.error('Failed to send notification:', error);
      await notificationAnalytics.trackNotificationEvent(notification, 'failed', { error: ((error as Error)?.message) });
      
      // Queue for retry
      this.queueNotification(notification);
    }
  }

  private async deliverNotification(notification: NotificationData, options?: any) {
    const content: Notifications.NotificationContentInput = {
      title: notification.title,
      body: notification.body,
      data: {
        ...notification.data,
        type: notification.type,
        notificationId: notification.id,
      },
      sound: options?.sound || true,
      priority: this.mapPriority(notification.priority),
      badge: await this.calculateBadgeCount(),
    };

    // Add image if available
    if (notification.imageUrl) {
      content.attachments = [{
        identifier: 'image',
        url: notification.imageUrl,
        type: 'public.image',
      }];
    }

    // Set category for actionable notifications
    content.categoryIdentifier = this.getCategoryForType(notification.type);

    // Platform-specific configurations
    if (Platform.OS === 'android') {
      content.color = '#E24849';
      content.vibrate = [0, 250, 250, 250];
      
      if (options?.critical) {
        content.priority = Notifications.AndroidNotificationPriority.MAX;
        content.sticky = true;
      }
    }

    if (Platform.OS === 'ios' && options?.critical) {
      content.sound = 'default';
    }

    await Notifications.presentNotificationAsync(content);
  }

  private async scheduleNotification(notification: NotificationData, scheduledFor: Date) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
        },
      },
      trigger: scheduledFor as any,
    });

    // Store scheduled notification
    const queueItem: NotificationQueue = {
      id,
      notification,
      retryCount: 0,
      scheduledFor,
    };

    this.notificationQueue.push(queueItem);
    await this.saveQueuedNotifications();

    return id;
  }

  private queueNotification(notification: NotificationData) {
    const queueItem: NotificationQueue = {
      id: notification.id,
      notification,
      retryCount: 0,
    };

    this.notificationQueue.push(queueItem);
    this.saveQueuedNotifications();

    // Schedule retry
    if (!this.retryTimer) {
      this.retryTimer = setTimeout(() => {
        this.processQueue();
      }, this.RETRY_DELAY);
    }
  }

  private async processQueue() {
    if (!this.isOnline || this.notificationQueue.length === 0) return;

    const queue = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const item of queue) {
      try {
        await this.deliverNotification(item.notification);
        await notificationAnalytics.trackNotificationEvent(item.notification, 'delivered');
      } catch (error) {
        console.error('Failed to deliver queued notification:', error);
        
        item.retryCount++;
        if (item.retryCount < this.MAX_RETRY_COUNT) {
          this.notificationQueue.push(item);
        } else {
          item.failureReason = ((error as Error)?.message);
          this.failedNotifications.push(item);
          await notificationAnalytics.trackNotificationEvent(item.notification, 'failed', {
            reason: 'max_retries_exceeded',
            error: ((error as Error)?.message),
          });
        }
      }
    }

    await this.saveQueuedNotifications();

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // Notification grouping for better UX
  private addToGroup(notification: NotificationData, groupId: string) {
    const existing = this.notificationGroups.get(groupId);
    
    if (existing) {
      existing.notifications.push(notification);
      existing.count++;
      existing.summary = this.generateGroupSummary(existing);
    } else {
      const group: NotificationGroup = {
        id: groupId,
        type: notification.type,
        notifications: [notification],
        summary: notification.body,
        count: 1,
      };
      this.notificationGroups.set(groupId, group);
    }

    // Show grouped notification if threshold reached
    const group = this.notificationGroups.get(groupId)!;
    if (group.count >= 3) {
      this.showGroupedNotification(group);
    }
  }

  private generateGroupSummary(group: NotificationGroup): string {
    switch (group.type) {
      case NotificationType.CHAT_MESSAGE:
        return `${group.count} new messages`;
      case NotificationType.FEED_COMMENT:
        return `${group.count} new comments on your post`;
      case NotificationType.FEED_REACTION:
        return `${group.count} people reacted to your post`;
      default:
        return `${group.count} new notifications`;
    }
  }

  private async showGroupedNotification(group: NotificationGroup) {
    const notification: NotificationData = {
      id: `group-${group.id}`,
      type: group.type,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.PUSH],
      title: this.getGroupTitle(group.type),
      body: group.summary,
      data: {
        groupId: group.id,
        notifications: group.notifications.map(n => n.id),
      },
      userId: '',
      read: false,
      createdAt: new Date(),
    };

    await this.deliverNotification(notification);
    
    // Clear group after showing
    this.notificationGroups.delete(group.id);
  }

  private getGroupTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.CHAT_MESSAGE:
        return '💬 New Messages';
      case NotificationType.FEED_COMMENT:
        return '💭 New Comments';
      case NotificationType.FEED_REACTION:
        return '❤️ New Reactions';
      case NotificationType.DINNER_REMINDER:
        return '🍽️ Dinner Reminders';
      default:
        return '📱 SharedTable';
    }
  }

  // Helper methods
  private requiresNetwork(notification: NotificationData): boolean {
    // Determine if notification requires network to be sent
    const localTypes = [
      NotificationType.DINNER_REMINDER,
      NotificationType.STREAK_REMINDER,
      NotificationType.PROFILE_INCOMPLETE,
    ];
    
    return !localTypes.includes(notification.type);
  }

  private mapPriority(priority: NotificationPriority): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case NotificationPriority.URGENT:
        return Notifications.AndroidNotificationPriority.MAX;
      case NotificationPriority.HIGH:
        return Notifications.AndroidNotificationPriority.HIGH;
      case NotificationPriority.LOW:
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  private getCategoryForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.DINNER_REMINDER:
      case NotificationType.DINNER_REMINDER_FINAL:
        return 'dinner_reminder';
      case NotificationType.CHAT_MESSAGE:
        return 'chat_message';
      case NotificationType.BOOKING_REQUEST:
        return 'booking_request';
      case NotificationType.ACHIEVEMENT_UNLOCKED:
        return 'achievement';
      default:
        return 'default';
    }
  }

  private async calculateBadgeCount(): Promise<number> {
    try {
      const response = await api.getUnreadCount();
      return response.data?.count || 0;
    } catch {
      return 0;
    }
  }

  // Public methods for managing notifications
  async cancelScheduledNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    
    // Remove from queue
    this.notificationQueue = this.notificationQueue.filter(item => item.id !== notificationId);
    await this.saveQueuedNotifications();
  }

  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.notificationQueue = [];
    await this.saveQueuedNotifications();
  }

  async getScheduledNotifications(): Promise<NotificationQueue[]> {
    return this.notificationQueue.filter(item => item.scheduledFor);
  }

  async getFailedNotifications(): Promise<NotificationQueue[]> {
    return this.failedNotifications;
  }

  async retryFailedNotifications() {
    const failed = [...this.failedNotifications];
    this.failedNotifications = [];
    
    for (const item of failed) {
      item.retryCount = 0;
      this.notificationQueue.push(item);
    }
    
    await this.saveQueuedNotifications();
    this.processQueue();
  }

  async clearFailedNotifications() {
    this.failedNotifications = [];
    await AsyncStorage.removeItem('failed_notifications');
  }

  // Notification templates for common scenarios
  async sendDinnerReminder(eventId: string, eventTitle: string, minutesBefore: number) {
    const notification: NotificationData = {
      id: `dinner-reminder-${eventId}-${minutesBefore}`,
      type: minutesBefore <= 15 ? NotificationType.DINNER_REMINDER_FINAL : NotificationType.DINNER_REMINDER,
      priority: minutesBefore <= 15 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: minutesBefore <= 15 ? '🍽️ Time to Go!' : '🍽️ Dinner Reminder',
      body: minutesBefore <= 15 
        ? `Your dinner "${eventTitle}" starts in ${minutesBefore} minutes! Head out now!`
        : `Don't forget about "${eventTitle}" in ${minutesBefore} minutes`,
      data: { eventId, eventTitle, minutesBefore },
      userId: '',
      read: false,
      createdAt: new Date(),
    };

    await this.sendNotification(notification, {
      critical: minutesBefore <= 15,
      sound: minutesBefore <= 15 ? 'urgent' : 'default',
    });
  }

  async sendAchievementUnlocked(achievement: any) {
    const notification: NotificationData = {
      id: `achievement-${achievement.id}`,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: '🏆 Achievement Unlocked!',
      body: `You've unlocked "${achievement.name}"! ${achievement.description}`,
      data: { achievementId: achievement.id },
      imageUrl: achievement.imageUrl,
      userId: '',
      read: false,
      createdAt: new Date(),
    };

    await this.sendNotification(notification);
  }

  async sendGroupMatched(groupId: string, groupSize: number, eventTitle: string) {
    const notification: NotificationData = {
      id: `group-matched-${groupId}`,
      type: NotificationType.DINNER_GROUP_MATCHED,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: '🎉 Your Dinner Group is Ready!',
      body: `You've been matched with ${groupSize - 1} others for "${eventTitle}". Check out your group!`,
      data: { groupId, eventTitle },
      userId: '',
      read: false,
      createdAt: new Date(),
    };

    await this.sendNotification(notification);
  }
}

export const notificationManager = new NotificationManager();