import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { notificationService } from '@/services/notificationService';
import { api, type Notification } from '@/services/api';
import { safeParseDate } from '@/utils/dateHelpers';
import {
  NotificationData,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@/types/notification.types';

interface NotificationState {
  // State
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  expoPushToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';

  // Actions
  initialize: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  scheduleDinnerReminder: (eventId: string, eventDate: Date, eventTitle: string) => Promise<void>;
  cancelDinnerReminder: (eventId: string) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,
  expoPushToken: null,
  permissionStatus: 'undetermined',

  // Initialize notification system
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Initialize notification service
      await notificationService.initialize();

      // Load stored preferences
      const stored = await SecureStore.getItemAsync('notification_preferences');
      const preferences = stored ? JSON.parse(stored) : null;

      // Get push token
      const token = await SecureStore.getItemAsync('expo_push_token');

      // Try to load notifications from API, but don't fail if unavailable
      let notifications: NotificationData[] = [];
      let unreadCount = 0;
      
      try {
        const response = await api.getNotifications({ unreadOnly: false, limit: 50 });
        const apiNotifications = response.data || [];
        
        // Convert API notifications to our NotificationData format
        notifications = apiNotifications.map((n: Notification) => ({
          id: n.id,
          type: n.type as NotificationType || NotificationType.SYSTEM_UPDATE,
          priority: NotificationPriority.NORMAL,
          channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
          title: n.title,
          body: n.message || (n as any).body,
          data: n.data,
          userId: n.user_id,
          read: n.read,
          createdAt: safeParseDate(n.created_at),
        }));
        
        // Load and apply saved read states
        const savedReadStates = await SecureStore.getItemAsync('notification_read_states');
        const readStates = savedReadStates ? JSON.parse(savedReadStates) : {};
        
        notifications = notifications.map(n => ({
          ...n,
          read: readStates[n.id] !== undefined ? readStates[n.id] : n.read,
        }));
        
        unreadCount = notifications.filter(n => !n.read).length;
      } catch (_apiError) {
        console.warn('Notifications API not available, using empty state');
        // Continue with empty notifications - don't fail initialization
      }

      set({
        preferences,
        expoPushToken: token,
        notifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      set({
        error: 'Failed to initialize notifications',
        isLoading: false,
      });
    }
  },

  // Load notifications from API
  loadNotifications: async () => {
    try {
      set({ isLoading: true, error: null });

      // Try to load from API first
      try {
        const response = await api.getNotifications({ limit: 50 });
        const apiNotifications = response.data || [];
        
        // Convert API notifications to our NotificationData format
        const notifications: NotificationData[] = apiNotifications.map((n: Notification) => ({
          id: n.id,
          type: n.type as NotificationType || NotificationType.SYSTEM_UPDATE,
          priority: NotificationPriority.NORMAL,
          channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
          title: n.title,
          body: n.message || (n as any).body,
          data: n.data,
          userId: n.user_id,
          read: n.read,
          createdAt: safeParseDate(n.created_at),
        }));
        
        // Load saved read states from local storage and apply them
        const savedReadStates = await SecureStore.getItemAsync('notification_read_states');
        const readStates = savedReadStates ? JSON.parse(savedReadStates) : {};
        
        // Apply saved read states to notifications
        const notificationsWithReadState = notifications.map(n => ({
          ...n,
          read: readStates[n.id] !== undefined ? readStates[n.id] : n.read,
        }));
        
        const unreadCount = notificationsWithReadState.filter(n => !n.read).length;

        set({
          notifications: notificationsWithReadState,
          unreadCount,
          isLoading: false,
        });
      } catch (_apiError) {
        console.warn('Using mock notifications as API is not available');
        
        // Use mock notifications for development
        const mockNotifications: NotificationData[] = [
          {
            id: 'notif-1',
            type: NotificationType.DINNER_REMINDER,
            priority: NotificationPriority.HIGH,
            channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
            title: 'Dinner Reminder',
            body: 'Your dinner at Chez Panisse starts in 1 hour!',
            data: { eventId: 'event-1' },
            userId: 'user-1',
            read: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
          },
          {
            id: 'notif-2',
            type: NotificationType.CHAT_MESSAGE,
            priority: NotificationPriority.NORMAL,
            channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
            title: 'New Message',
            body: 'Sarah: "Looking forward to dinner tonight!"',
            data: { chatId: 'chat-1', senderId: 'user-2' },
            userId: 'user-1',
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          },
        ];

        // Load saved read states from local storage
        const savedReadStates = await SecureStore.getItemAsync('notification_read_states');
        const readStates = savedReadStates ? JSON.parse(savedReadStates) : {};
        
        // Apply saved read states to mock notifications
        const notificationsWithReadState = mockNotifications.map(n => ({
          ...n,
          read: readStates[n.id] || false,
        }));

        const unreadCount = notificationsWithReadState.filter(n => !n.read).length;

        set({
          notifications: notificationsWithReadState,
          unreadCount,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      set({
        error: 'Failed to load notifications',
        isLoading: false,
      });
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const { notifications } = get();

      // Optimistic update
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unreadCount = updated.filter(n => !n.read).length;

      set({ notifications: updated, unreadCount });

      // Save read state locally
      const savedReadStates = await SecureStore.getItemAsync('notification_read_states');
      const readStates = savedReadStates ? JSON.parse(savedReadStates) : {};
      readStates[notificationId] = true;
      await SecureStore.setItemAsync('notification_read_states', JSON.stringify(readStates));

      // Try to update on server (but don't fail if unavailable)
      try {
        await api.markNotificationAsRead(notificationId);
      } catch (apiError) {
        console.warn('Could not sync read state with server:', apiError);
        // Continue with local state - don't revert
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Don't revert as we want to keep local state
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const { notifications } = get();

      // Optimistic update
      const updated = notifications.map(n => ({ ...n, read: true }));
      set({ notifications: updated, unreadCount: 0 });

      // Save all as read locally
      const readStates: Record<string, boolean> = {};
      notifications.forEach(n => {
        readStates[n.id] = true;
      });
      await SecureStore.setItemAsync('notification_read_states', JSON.stringify(readStates));

      // Try to update on server for each unread notification
      try {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        await Promise.all(unreadIds.map(id => api.markNotificationAsRead(id)));
      } catch (apiError) {
        console.warn('Could not sync read states with server:', apiError);
        // Continue with local state - don't revert
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Don't revert as we want to keep local state
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    try {
      const { notifications } = get();

      // Optimistic update
      const updated = notifications.filter(n => n.id !== notificationId);
      const unreadCount = updated.filter(n => !n.read).length;

      set({ notifications: updated, unreadCount });

      // Delete on server (if API supports it)
      // await api.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert on error
      await get().loadNotifications();
    }
  },

  // Clear all notifications
  clearAll: async () => {
    try {
      set({ notifications: [], unreadCount: 0 });

      // Clear local storage
      await SecureStore.deleteItemAsync('notification_read_states');

      // Clear on server (if API supports it)
      // await api.clearAllNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      // Don't revert as we want to keep local state cleared
    }
  },

  // Update preferences
  updatePreferences: async (updates: Partial<NotificationPreferences>) => {
    try {
      const { preferences } = get();
      const updated = { ...preferences, ...updates } as NotificationPreferences;

      // Optimistic update
      set({ preferences: updated });

      // Save locally
      await SecureStore.setItemAsync('notification_preferences', JSON.stringify(updated));

      // Update in notification service
      await notificationService.savePreferences(updated);

      // Sync with server (if needed)
      // await api.updateNotificationPreferences(updated);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      set({ error: 'Failed to update preferences' });
    }
  },

  // Schedule dinner reminder
  scheduleDinnerReminder: async (eventId: string, eventDate: Date, eventTitle: string) => {
    try {
      await notificationService.scheduleDinnerReminder(eventId, eventDate, eventTitle);

      // Add to notifications list
      const { notifications } = get();
      const reminder: NotificationData = {
        id: `reminder-${eventId}`,
        type: NotificationType.DINNER_REMINDER,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        title: '🍽️ Dinner Reminder',
        body: `Don't forget about "${eventTitle}"!`,
        data: { eventId, eventTitle },
        userId: '',
        read: false,
        createdAt: new Date(),
        scheduledFor: eventDate,
      };

      set({ notifications: [reminder, ...notifications] });
    } catch (error) {
      console.error('Failed to schedule dinner reminder:', error);
      set({ error: 'Failed to schedule reminder' });
    }
  },

  // Cancel dinner reminder
  cancelDinnerReminder: async (eventId: string) => {
    try {
      await notificationService.cancelDinnerReminder(eventId);

      // Remove from notifications list
      const { notifications } = get();
      const updated = notifications.filter(
        n => !(n.type === NotificationType.DINNER_REMINDER && n.data?.eventId === eventId)
      );

      set({ notifications: updated });
    } catch (error) {
      console.error('Failed to cancel dinner reminder:', error);
    }
  },

  // Send test notification
  sendTestNotification: async () => {
    try {
      await notificationService.sendLocalNotification({
        title: '🎉 Test Notification',
        body: 'This is a test notification from SharedTable!',
        data: { type: 'test' },
        sound: true,
        priority: 'high',
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      set({ error: 'Failed to send test notification' });
    }
  },

  // Refresh permission status
  refreshPermissionStatus: async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      set({
        expoPushToken: token,
        permissionStatus: token ? 'granted' : 'denied',
      });
    } catch (error) {
      console.error('Failed to refresh permission status:', error);
      set({ permissionStatus: 'denied' });
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));