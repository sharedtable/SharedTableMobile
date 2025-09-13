import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import {
  NotificationType,
  NotificationPayload,
  NotificationCategory,
  NotificationPreferences,
} from '@/types/notification.types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private preferences: NotificationPreferences | null = null;

  async initialize() {
    try {
      // Set up notification categories for actionable notifications
      await this.setupNotificationCategories();

      // Register for push notifications (but don't fail if it doesn't work)
      try {
        const token = await this.registerForPushNotifications();
        if (token) {
          this.expoPushToken = token;
          // Send token to backend
          await this.sendTokenToServer(token);
        }
      } catch (pushError) {
        console.warn('Push notifications not available:', pushError);
        // Continue without push notifications
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Load user preferences
      await this.loadPreferences();

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  private async setupNotificationCategories() {
    if (Platform.OS === 'ios') {
      const categories: NotificationCategory[] = [
        {
          id: 'dinner_reminder',
          actions: [
            {
              id: 'confirm',
              title: 'I\'m Going',
              type: 'default',
            },
            {
              id: 'cancel',
              title: 'Can\'t Make It',
              type: 'destructive',
            },
          ],
        },
        {
          id: 'chat_message',
          actions: [
            {
              id: 'reply',
              title: 'Reply',
              type: 'textInput',
              textInputButtonTitle: 'Send',
              textInputPlaceholder: 'Type your message...',
            },
            {
              id: 'view',
              title: 'View',
              type: 'default',
            },
          ],
        },
        {
          id: 'booking_request',
          actions: [
            {
              id: 'approve',
              title: 'Approve',
              type: 'default',
            },
            {
              id: 'reject',
              title: 'Reject',
              type: 'destructive',
            },
          ],
        },
      ];

      await Notifications.setNotificationCategoryAsync(
        'dinner_reminder',
        categories[0].actions.map(action => ({
          identifier: action.id,
          buttonTitle: action.title,
          options: {
            opensAppToForeground: action.type === 'default',
            isDestructive: action.type === 'destructive',
          },
        }))
      );
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // Check if we have a valid project ID
      if (!projectId) {
        console.warn('Skipping push notifications - no project ID configured');
        return null;
      }
      
      console.log('Using project ID for push notifications:', projectId);

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async sendTokenToServer(token: string) {
    try {
      await api.updatePushToken(token);
      await SecureStore.setItemAsync('expo_push_token', token);
    } catch (error) {
      console.error('Failed to send push token to server:', error);
    }
  }

  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleIncomingNotification(notification);
    });

    // Handle notification responses (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private async handleIncomingNotification(notification: Notifications.Notification) {
    const data = notification.request?.content?.data || {};
    const notificationType = data?.type as NotificationType;

    // Check quiet hours
    if (this.preferences?.quietHoursEnabled && this.isQuietHours()) {
      // Don't show alert during quiet hours
      return;
    }

    // Handle based on notification type
    switch (notificationType) {
      case NotificationType.CHAT_MESSAGE:
        // Update chat badge
        await this.updateChatBadge();
        break;
      case NotificationType.DINNER_REMINDER:
        // Check if second reminder is needed
        if (this.preferences?.secondReminderEnabled) {
          await this.scheduleSecondReminder(data as unknown as NotificationPayload);
        }
        break;
      case NotificationType.FEED_MENTION:
        // Update feed badge
        await this.updateFeedBadge();
        break;
    }
  }

  private async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { notification, actionIdentifier, userText } = response;
    const data = notification.request.content.data;
    const notificationType = data?.type as NotificationType;

    // Handle action based on notification type
    switch (actionIdentifier) {
      case 'confirm':
        if (notificationType === NotificationType.DINNER_REMINDER) {
          await this.confirmDinnerAttendance(data.eventId as string);
        }
        break;
      case 'cancel':
        if (notificationType === NotificationType.DINNER_REMINDER) {
          await this.cancelDinnerAttendance(data.eventId as string);
        }
        break;
      case 'reply':
        if (notificationType === NotificationType.CHAT_MESSAGE && userText) {
          await this.sendQuickReply(data.chatId as string, userText);
        }
        break;
      case 'approve':
        if (notificationType === NotificationType.BOOKING_REQUEST) {
          await this.approveBooking(data.bookingId as string);
        }
        break;
      case 'reject':
        if (notificationType === NotificationType.BOOKING_REQUEST) {
          await this.rejectBooking(data.bookingId as string);
        }
        break;
      default:
        // Default action - open app to relevant screen
        this.navigateToScreen(notificationType, data as unknown as NotificationPayload);
        break;
    }
  }

  // Schedule local notifications
  async scheduleDinnerReminder(eventId: string, eventDate: Date, eventTitle: string) {
    if (!this.preferences?.dinnerReminders) return;

    const reminderTime = new Date(eventDate);
    reminderTime.setMinutes(
      reminderTime.getMinutes() - (this.preferences.reminderTimeBeforeEvent || 60)
    );

    // Don't schedule if in the past
    if (reminderTime < new Date()) return;

    // Build notification content dynamically
    const notificationContent: any = {
      title: '🍽️ Dinner Reminder',
      body: `Your dinner "${eventTitle}" starts in ${this.preferences.reminderTimeBeforeEvent || 60} minutes!`,
      data: {
        type: NotificationType.DINNER_REMINDER,
        eventId,
        eventTitle,
      },
      sound: true,
    };

    // Only set Android-specific priority on Android
    if (Platform.OS === 'android') {
      notificationContent.priority = Notifications.AndroidNotificationPriority.HIGH;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent as Notifications.NotificationContentInput,
      trigger: reminderTime as any,
    });

    // Store scheduled notification
    await this.storeScheduledNotification(notificationId, eventId, reminderTime);

    return notificationId;
  }

  private async scheduleSecondReminder(data: NotificationPayload) {
    if (!this.preferences?.secondReminderEnabled) return;

    const secondReminderTime = this.preferences.secondReminderTime || 15;
    
    // Build notification content dynamically
    const notificationContent: any = {
      title: '🍽️ Final Reminder',
      body: `Your dinner starts in ${secondReminderTime} minutes! Time to head out!`,
      data: {
        ...data,
        isSecondReminder: true,
      },
      sound: true,
    };

    // Only set Android-specific priority on Android
    if (Platform.OS === 'android') {
      notificationContent.priority = Notifications.AndroidNotificationPriority.MAX;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent as Notifications.NotificationContentInput,
      trigger: {
        seconds: (secondReminderTime - (this.preferences.reminderTimeBeforeEvent || 60)) * 60,
      } as any,
    });
  }

  // Cancel scheduled notifications
  async cancelDinnerReminder(eventId: string) {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      const notification = scheduledNotifications.find(
        n => n.content.data?.eventId === eventId
      );
      
      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Failed to cancel dinner reminder:', error);
    }
  }

  async cancelAllDinnerReminders() {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      const dinnerReminders = scheduledNotifications.filter(
        n => n.content.data?.type === NotificationType.DINNER_REMINDER
      );
      
      for (const reminder of dinnerReminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    } catch (error) {
      console.error('Failed to cancel all dinner reminders:', error);
    }
  }

  // Send local notification immediately
  async sendLocalNotification(payload: NotificationPayload) {
    try {
      // Debug logging
      console.log('[NotificationService] Payload received:', {
        hasCategory: !!payload.categoryId,
        categoryValue: payload.categoryId,
        platform: Platform.OS
      });

      // Build notification content object without any nil values
      const notificationContent: Record<string, any> = {};
      
      // Required fields
      notificationContent.title = payload.title;
      notificationContent.body = payload.body;
      notificationContent.sound = payload.sound !== false;
      
      // Optional fields - only add if they have values
      if (payload.data && Object.keys(payload.data).length > 0) {
        notificationContent.data = payload.data;
      }
      
      // Platform-specific fields
      if (Platform.OS === 'android') {
        notificationContent.priority = payload.priority === 'high' 
          ? Notifications.AndroidNotificationPriority.HIGH
          : Notifications.AndroidNotificationPriority.DEFAULT;
          
        // Only add categoryIdentifier on Android if it exists
        if (payload.categoryId && payload.categoryId.trim() !== '') {
          notificationContent.categoryIdentifier = payload.categoryId;
        }
      }
      
      // IMPORTANT: Do not add categoryIdentifier on iOS at all
      // iOS requires pre-registered categories and will error with nil values

      console.log('[NotificationService] Final content:', notificationContent);

      // Create a clean notification request
      // Use JSON parse/stringify to ensure no undefined values
      const cleanContent = JSON.parse(JSON.stringify(notificationContent));
      
      const notificationRequest = {
        content: cleanContent,
        trigger: null,
      };

      await Notifications.scheduleNotificationAsync(notificationRequest);
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Badge management
  async updateBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  async clearBadge() {
    await this.updateBadgeCount(0);
  }

  private async updateChatBadge() {
    // Get unread chat count from API
    const unreadCount = await api.getUnreadChatCount();
    await this.updateBadgeCount(unreadCount);
  }

  private async updateFeedBadge() {
    // Get unread feed count from API
    const unreadCount = await api.getUnreadFeedCount();
    await this.updateBadgeCount(unreadCount);
  }

  // Preference management
  async loadPreferences() {
    try {
      const stored = await SecureStore.getItemAsync('notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      } else {
        // Set default preferences
        this.preferences = {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          dinnerReminders: true,
          dinnerStatusUpdates: true,
          chatMessages: true,
          chatMentions: true,
          feedActivity: true,
          bookingUpdates: true,
          promotionalContent: false,
          quietHoursEnabled: false,
          reminderTimeBeforeEvent: 60,
          secondReminderEnabled: true,
          secondReminderTime: 15,
        };
        await this.savePreferences(this.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  async savePreferences(preferences: NotificationPreferences) {
    try {
      this.preferences = preferences;
      await SecureStore.setItemAsync('notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  async updatePreference(key: keyof NotificationPreferences, value: boolean | string) {
    if (!this.preferences) return;
    
    ;(this.preferences as any)[key] = value;
    await this.savePreferences(this.preferences);
  }

  // Helper methods
  private isQuietHours(): boolean {
    if (!this.preferences?.quietHoursEnabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = (this.preferences.quietHoursStart || '22:00').split(':').map(Number);
    const [endHour, endMinute] = (this.preferences.quietHoursEnd || '08:00').split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  private async storeScheduledNotification(id: string, eventId: string, scheduledFor: Date) {
    try {
      const stored = await SecureStore.getItemAsync('scheduled_notifications');
      const scheduled = stored ? JSON.parse(stored) : {};
      scheduled[eventId] = { id, scheduledFor };
      await SecureStore.setItemAsync('scheduled_notifications', JSON.stringify(scheduled));
    } catch (error) {
      console.error('Failed to store scheduled notification:', error);
    }
  }

  // API interactions
  private async confirmDinnerAttendance(eventId: string) {
    try {
      await api.confirmEventAttendance(eventId);
    } catch (error) {
      console.error('Failed to confirm dinner attendance:', error);
    }
  }

  private async cancelDinnerAttendance(eventId: string) {
    try {
      await api.cancelEventAttendance(eventId);
    } catch (error) {
      console.error('Failed to cancel dinner attendance:', error);
    }
  }

  private async sendQuickReply(chatId: string, message: string) {
    try {
      await api.sendChatMessage(chatId, message);
    } catch (error) {
      console.error('Failed to send quick reply:', error);
    }
  }

  private async approveBooking(bookingId: string) {
    try {
      await api.approveBooking(bookingId);
    } catch (error) {
      console.error('Failed to approve booking:', error);
    }
  }

  private async rejectBooking(bookingId: string) {
    try {
      await api.rejectBooking(bookingId);
    } catch (error) {
      console.error('Failed to reject booking:', error);
    }
  }

  private navigateToScreen(type: NotificationType, data: NotificationPayload) {
    // This will be implemented when we have navigation context
    console.log('Navigate to screen:', type, data);
  }

  // Cleanup
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const notificationService = new NotificationService();