/**
 * Production-grade notification integration service
 * Connects Stream Chat, push notifications, and in-app notifications
 */

import * as Notifications from 'expo-notifications';
import { StreamChat, Event, Channel } from 'stream-chat';
import { notificationService } from './notificationService';
import { notificationManager } from './notificationManager';
import { useNotificationStore } from '@/store/notificationStore';
import { 
  NotificationType, 
  NotificationData,
  NotificationPriority,
  NotificationChannel as NotifChannel
} from '@/types/notification.types';
import { api } from './api';

class NotificationIntegrationService {
  private streamClient: StreamChat | null = null;
  private userId: string | null = null;
  private isInitialized = false;
  private messageChannels: Map<string, Channel> = new Map();
  
  /**
   * Initialize the notification integration
   */
  async initialize(userId: string, streamClient?: StreamChat) {
    if (this.isInitialized) {
      console.log('Notification integration already initialized');
      return;
    }

    try {
      this.userId = userId;
      
      // Initialize push notifications
      await notificationService.initialize();
      
      // Initialize notification manager
      await notificationManager.initialize();
      
      // Set up Stream client if provided
      if (streamClient) {
        this.streamClient = streamClient;
        this.setupStreamListeners();
      }
      
      // Configure notification handler
      this.configureNotificationHandler();
      
      // Set up background notification handler
      this.setupBackgroundHandler();
      
      this.isInitialized = true;
      console.log('Notification integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification integration:', error);
      throw error;
    }
  }
  
  /**
   * Configure how notifications are displayed
   */
  private configureNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Check if app is in foreground
        const appState = await this.getAppState();
        
        // Determine if we should show the notification
        const shouldShow = appState !== 'active' || this.isImportantNotification(notification);
        
        return {
          shouldShowAlert: shouldShow,
          shouldPlaySound: shouldShow,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }
  
  /**
   * Set up Stream Chat event listeners
   */
  private setupStreamListeners() {
    if (!this.streamClient) return;
    
    // Listen for new messages
    this.streamClient.on('message.new', this.handleNewMessage);
    
    // Listen for message updates
    this.streamClient.on('message.updated', this.handleMessageUpdate);
    
    // Listen for reactions
    this.streamClient.on('reaction.new', this.handleNewReaction);
    
    // Listen for channel events
    this.streamClient.on('notification.added_to_channel', this.handleChannelNotification);
    this.streamClient.on('notification.invited', this.handleInviteNotification);
    
    // Listen for mentions
    this.streamClient.on('notification.message_new', this.handleMentionNotification);
    
    console.log('Stream listeners set up successfully');
  }
  
  /**
   * Handle new message from Stream
   */
  private handleNewMessage = async (event: Event) => {
    if (!event.message || !event.user || event.user.id === this.userId) {
      return; // Don't notify for own messages
    }
    
    try {
      const notification: NotificationData = {
        id: `msg-${event.message.id}`,
        type: NotificationType.CHAT_MESSAGE,
        priority: NotificationPriority.HIGH,
        channels: [NotifChannel.PUSH, NotifChannel.IN_APP],
        title: `New message from ${event.user.name || 'User'}`,
        body: event.message.text || 'Sent a message',
        data: {
          messageId: event.message.id,
          channelId: event.channel_id,
          channelType: event.channel_type,
          senderId: event.user.id,
          senderName: event.user.name,
        },
        imageUrl: event.user.image,
        userId: this.userId!,
        read: false,
        createdAt: new Date(),
      };
      
      // Send notification
      await this.sendNotification(notification);
      
      // Update notification store
      this.addToNotificationStore(notification);
      
    } catch (error) {
      console.error('Error handling new message notification:', error);
    }
  };
  
  /**
   * Handle message update (edits)
   */
  private handleMessageUpdate = async (event: Event) => {
    // Usually we don't send notifications for edits
    // But we might want to update existing notifications
    if (event.message?.id) {
      // Update any existing notification for this message
      const notificationId = `msg-${event.message.id}`;
      await this.updateNotification(notificationId, {
        body: event.message.text || 'Message edited',
      });
    }
  };
  
  /**
   * Handle new reaction
   */
  private handleNewReaction = async (event: Event) => {
    if (!event.reaction || !event.user || event.user.id === this.userId) {
      return;
    }
    
    try {
      const notification: NotificationData = {
        id: `reaction-${event.reaction.message_id}-${Date.now()}`,
        type: NotificationType.FEED_REACTION,
        priority: NotificationPriority.NORMAL,
        channels: [NotifChannel.PUSH, NotifChannel.IN_APP],
        title: `${event.user.name || 'Someone'} reacted to your message`,
        body: `Reacted with ${event.reaction.type}`,
        data: {
          messageId: event.reaction.message_id,
          reactionType: event.reaction.type,
          userId: event.user.id,
          userName: event.user.name,
        },
        imageUrl: event.user.image,
        userId: this.userId!,
        read: false,
        createdAt: new Date(),
      };
      
      await this.sendNotification(notification);
      this.addToNotificationStore(notification);
      
    } catch (error) {
      console.error('Error handling reaction notification:', error);
    }
  };
  
  /**
   * Handle channel notifications
   */
  private handleChannelNotification = async (event: Event) => {
    if (!event.channel || event.channel.created_by?.id === this.userId) {
      return;
    }
    
    try {
      const notification: NotificationData = {
        id: `channel-${event.channel.id}-${Date.now()}`,
        type: NotificationType.CHAT_GROUP_INVITE,
        priority: NotificationPriority.HIGH,
        channels: [NotifChannel.PUSH, NotifChannel.IN_APP],
        title: 'Added to new channel',
        body: `You were added to ${(event.channel as any).name || 'a new channel'}`,
        data: {
          channelId: event.channel.id,
          channelName: (event.channel as any).name,
        },
        userId: this.userId!,
        read: false,
        createdAt: new Date(),
      };
      
      await this.sendNotification(notification);
      this.addToNotificationStore(notification);
      
    } catch (error) {
      console.error('Error handling channel notification:', error);
    }
  };
  
  /**
   * Handle invite notifications
   */
  private handleInviteNotification = async (event: Event) => {
    if (!event.channel || !event.user) {
      return;
    }
    
    try {
      const notification: NotificationData = {
        id: `invite-${event.channel.id}-${Date.now()}`,
        type: NotificationType.EVENT_INVITATION,
        priority: NotificationPriority.HIGH,
        channels: [NotifChannel.PUSH, NotifChannel.IN_APP],
        title: 'New invitation',
        body: `${event.user.name || 'Someone'} invited you to ${(event.channel as any).name || 'an event'}`,
        data: {
          channelId: event.channel.id,
          channelName: (event.channel as any).name,
          inviterId: event.user.id,
          inviterName: event.user.name,
        },
        imageUrl: event.user.image,
        userId: this.userId!,
        read: false,
        createdAt: new Date(),
      };
      
      await this.sendNotification(notification);
      this.addToNotificationStore(notification);
      
    } catch (error) {
      console.error('Error handling invite notification:', error);
    }
  };
  
  /**
   * Handle mention notifications
   */
  private handleMentionNotification = async (event: Event) => {
    if (!event.message || !event.user || event.user.id === this.userId) {
      return;
    }
    
    // Check if current user is mentioned
    const mentions = event.message.mentioned_users || [];
    const isMentioned = mentions.some((user: any) => user.id === this.userId);
    
    if (!isMentioned) return;
    
    try {
      const notification: NotificationData = {
        id: `mention-${event.message.id}`,
        type: NotificationType.CHAT_MENTION,
        priority: NotificationPriority.URGENT,
        channels: [NotifChannel.PUSH, NotifChannel.IN_APP],
        title: `${event.user.name || 'Someone'} mentioned you`,
        body: event.message.text || 'Mentioned you in a message',
        data: {
          messageId: event.message.id,
          channelId: event.channel_id,
          channelType: event.channel_type,
          senderId: event.user.id,
          senderName: event.user.name,
        },
        imageUrl: event.user.image,
        userId: this.userId!,
        read: false,
        createdAt: new Date(),
      };
      
      await this.sendNotification(notification);
      this.addToNotificationStore(notification);
      
    } catch (error) {
      console.error('Error handling mention notification:', error);
    }
  };
  
  /**
   * Send a notification through appropriate channels
   */
  private async sendNotification(notification: NotificationData) {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences();
      
      // Send push notification if enabled
      if (preferences.pushEnabled && notification.channels.includes(NotifChannel.PUSH)) {
        await notificationManager.sendNotification(notification);
      }
      
      // Always show in-app notification
      if (notification.channels.includes(NotifChannel.IN_APP)) {
        await notificationService.sendLocalNotification({
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
          priority: notification.priority === NotificationPriority.URGENT ? 'high' : 'default',
        });
      }
      
      // Send to backend for persistence
      try {
        await api.createNotification(notification);
      } catch (error) {
        console.warn('Failed to persist notification to backend:', error);
      }
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
  
  /**
   * Update an existing notification
   */
  private async updateNotification(notificationId: string, updates: Partial<NotificationData>) {
    try {
      // Update in store
      const store = useNotificationStore.getState();
      const notifications = store.notifications.map(n => 
        n.id === notificationId ? { ...n, ...updates } : n
      );
      
      useNotificationStore.setState({ notifications });
      
      // Update on backend
      await api.updateNotification(notificationId, updates);
      
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  }
  
  /**
   * Add notification to the store
   */
  private addToNotificationStore(notification: NotificationData) {
    const store = useNotificationStore.getState();
    const notifications = [notification, ...store.notifications];
    const unreadCount = notifications.filter(n => !n.read).length;
    
    useNotificationStore.setState({ 
      notifications,
      unreadCount 
    });
  }
  
  /**
   * Get user notification preferences
   */
  private async getUserPreferences() {
    const store = useNotificationStore.getState();
    return store.preferences || {
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
  }
  
  /**
   * Check if notification is important
   */
  private isImportantNotification(notification: any): boolean {
    const importantTypes = [
      NotificationType.DINNER_REMINDER,
      NotificationType.DINNER_REMINDER_FINAL,
      NotificationType.CHAT_MENTION,
      NotificationType.BOOKING_REQUEST,
      NotificationType.BOOKING_APPROVED,
    ];
    
    return importantTypes.includes(notification.request?.content?.data?.type);
  }
  
  /**
   * Get current app state
   */
  private async getAppState(): Promise<string> {
    // This would be implemented with AppState from React Native
    return 'active'; // placeholder
  }
  
  /**
   * Set up background notification handler
   */
  private setupBackgroundHandler() {
    Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log('Background notification response:', response);
      // Handle notification taps when app is in background
      this.handleNotificationResponse(response);
    });
  }
  
  /**
   * Handle notification response (when user taps notification)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    // This would integrate with your navigation system
    console.log('Handling notification tap:', data);
  }
  
  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.streamClient) {
      this.streamClient.off('message.new', this.handleNewMessage);
      this.streamClient.off('message.updated', this.handleMessageUpdate);
      this.streamClient.off('reaction.new', this.handleNewReaction);
      this.streamClient.off('notification.added_to_channel', this.handleChannelNotification);
      this.streamClient.off('notification.invited', this.handleInviteNotification);
      this.streamClient.off('notification.message_new', this.handleMentionNotification);
    }
    
    this.messageChannels.clear();
    this.isInitialized = false;
  }
}

export const notificationIntegration = new NotificationIntegrationService();