import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

// Create a new Expo SDK client
const expo = new Expo();

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_WAITLISTED = 'booking_waitlisted',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_ASSIGNED = 'booking_assigned',
  DINNER_REMINDER = 'dinner_reminder',
  CHAT_MESSAGE = 'chat_message',
  MATCH_FOUND = 'match_found',
  REVIEW_REQUEST = 'review_request',
  SYSTEM_UPDATE = 'system_update',
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  sound?: 'default' | null;
}

interface PushTokenData {
  token: string;
  updatedAt: string;
}

class NotificationService {
  private pushTokenCache: Map<string, PushTokenData> = new Map();

  /**
   * Send a push notification to a user
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const pushToken = await this.getUserPushToken(payload.userId);
      
      if (!pushToken) {
        logger.warn(`No push token found for user ${payload.userId}`);
        return false;
      }

      // Check that push token is valid
      if (!Expo.isExpoPushToken(pushToken)) {
        logger.error(`Push token ${pushToken} is not a valid Expo push token`);
        return false;
      }

      // Create the message
      const message: ExpoPushMessage = {
        to: pushToken,
        sound: payload.sound !== undefined ? payload.sound : 'default',
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          type: payload.type,
          userId: payload.userId,
          timestamp: new Date().toISOString(),
        },
        priority: payload.priority || 'default',
        badge: payload.badge,
      };

      // Send the notification
      const tickets = await expo.sendPushNotificationsAsync([message]);
      
      // Handle ticket errors
      for (const ticket of tickets) {
        if ((ticket as any).status === 'error') {
          logger.error('Error sending notification:', (ticket as any).message);
          if ((ticket as any).details?.error === 'DeviceNotRegistered') {
            // Remove invalid token
            await this.removePushToken(payload.userId);
          }
          return false;
        }
      }

      // Store notification in database
      await this.storeNotification(payload);

      logger.info(`Notification sent successfully to user ${payload.userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send multiple notifications in batch
   */
  async sendBatchNotifications(payloads: NotificationPayload[]): Promise<void> {
    const messages: ExpoPushMessage[] = [];
    const validPayloads: NotificationPayload[] = [];

    // Prepare messages
    for (const payload of payloads) {
      const pushToken = await this.getUserPushToken(payload.userId);
      
      if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        logger.warn(`Skipping notification for user ${payload.userId} - invalid token`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: payload.sound !== undefined ? payload.sound : 'default',
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          type: payload.type,
          userId: payload.userId,
          timestamp: new Date().toISOString(),
        },
        priority: payload.priority || 'default',
        badge: payload.badge,
      });

      validPayloads.push(payload);
    }

    if (messages.length === 0) {
      logger.warn('No valid push tokens found for batch notification');
      return;
    }

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Error sending notification chunk:', error);
      }
    }

    // Handle tickets
    tickets.forEach((ticket, index) => {
      if ((ticket as any).status === 'error') {
        const payload = validPayloads[index];
        logger.error(`Error sending notification to user ${payload.userId}:`, (ticket as any).message);
        
        if ((ticket as any).details?.error === 'DeviceNotRegistered') {
          this.removePushToken(payload.userId);
        }
      }
    });

    // Store notifications in database
    await Promise.all(validPayloads.map(payload => this.storeNotification(payload)));
  }

  /**
   * Send booking status notification
   */
  async sendBookingNotification(
    userId: string,
    status: 'confirmed' | 'waitlisted' | 'cancelled' | 'assigned',
    dinnerName: string,
    bookingId: string,
    dinnerDate?: Date
  ): Promise<boolean> {
    let title = 'Booking Update';
    let body = '';
    let type: NotificationType;
    
    switch (status) {
      case 'confirmed':
        title = '✅ Booking Confirmed!';
        body = `Your spot at ${dinnerName} has been confirmed. Get ready for a great evening!`;
        type = NotificationType.BOOKING_CONFIRMED;
        break;
      case 'waitlisted':
        title = '⏳ You\'re on the Waitlist';
        body = `You've been added to the waitlist for ${dinnerName}. We'll notify you if a spot opens up.`;
        type = NotificationType.BOOKING_WAITLISTED;
        break;
      case 'cancelled':
        title = '❌ Booking Cancelled';
        body = `Your booking for ${dinnerName} has been cancelled.`;
        type = NotificationType.BOOKING_CANCELLED;
        break;
      case 'assigned':
        title = '🎉 Table Assigned!';
        body = `You've been assigned a table for ${dinnerName}. Check the app for details!`;
        type = NotificationType.BOOKING_ASSIGNED;
        break;
    }

    return this.sendNotification({
      userId,
      type,
      title,
      body,
      data: {
        bookingId,
        status,
        dinnerName,
        dinnerDate: dinnerDate?.toISOString(),
      },
      priority: 'high',
      sound: 'default',
    });
  }

  /**
   * Send dinner reminder notification
   */
  async sendDinnerReminder(
    userId: string,
    dinnerName: string,
    dinnerId: string,
    hoursBeforeDinner: number
  ): Promise<boolean> {
    const title = '🍽️ Dinner Reminder';
    const body = hoursBeforeDinner === 1 
      ? `Your dinner at ${dinnerName} is coming up in 1 hour!`
      : `Your dinner at ${dinnerName} is coming up in ${hoursBeforeDinner} hours!`;
    
    return this.sendNotification({
      userId,
      type: NotificationType.DINNER_REMINDER,
      title,
      body,
      data: {
        dinnerId,
        hoursBeforeDinner,
      },
      priority: 'high',
      sound: 'default',
    });
  }

  /**
   * Send chat message notification
   */
  async sendChatNotification(
    userId: string,
    senderName: string,
    message: string,
    channelId: string
  ): Promise<boolean> {
    const title = `💬 ${senderName}`;
    const body = message.length > 100 ? `${message.substring(0, 100)}...` : message;
    
    return this.sendNotification({
      userId,
      type: NotificationType.CHAT_MESSAGE,
      title,
      body,
      data: {
        channelId,
        senderName,
      },
      priority: 'normal',
      badge: 1,
    });
  }

  /**
   * Send match found notification
   */
  async sendMatchNotification(
    userId: string,
    matchName: string,
    matchId: string,
    dinnerName: string
  ): Promise<boolean> {
    const title = '🎉 New Match!';
    const body = `You matched with ${matchName} for ${dinnerName}. Start chatting now!`;
    
    return this.sendNotification({
      userId,
      type: NotificationType.MATCH_FOUND,
      title,
      body,
      data: {
        matchId,
        matchName,
        dinnerName,
      },
      priority: 'high',
      sound: 'default',
    });
  }

  /**
   * Send review request notification
   */
  async sendReviewRequest(
    userId: string,
    dinnerName: string,
    dinnerId: string,
    bookingId: string
  ): Promise<boolean> {
    const title = '⭐ How was your dinner?';
    const body = `We hope you enjoyed ${dinnerName}! Please take a moment to review your experience.`;
    
    return this.sendNotification({
      userId,
      type: NotificationType.REVIEW_REQUEST,
      title,
      body,
      data: {
        dinnerId,
        bookingId,
        dinnerName,
      },
      priority: 'normal',
    });
  }

  /**
   * Get user's push token
   */
  private async getUserPushToken(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.pushTokenCache.get(userId);
      if (cached && this.isTokenFresh(cached.updatedAt)) {
        return cached.token;
      }

      // Try to get from database
      const { data, error } = await supabaseService
        .from('users')
        .select('push_token, push_token_updated_at')
        .eq('id', userId)
        .single();

      if (error || !data?.push_token) {
        // Fallback to memory storage
        const memoryToken = (global as any).pushTokens?.[userId];
        if (memoryToken) {
          this.pushTokenCache.set(userId, memoryToken);
          return memoryToken.token;
        }
        return null;
      }

      // Update cache
      this.pushTokenCache.set(userId, {
        token: data.push_token,
        updatedAt: data.push_token_updated_at || new Date().toISOString(),
      });

      return data.push_token;
    } catch (error) {
      logger.error(`Failed to get push token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Remove user's push token
   */
  private async removePushToken(userId: string): Promise<void> {
    try {
      // Remove from cache
      this.pushTokenCache.delete(userId);

      // Remove from database
      await supabaseService
        .from('users')
        .update({
          push_token: null,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Remove from memory storage
      if ((global as any).pushTokens) {
        delete (global as any).pushTokens[userId];
      }

      logger.info(`Removed invalid push token for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to remove push token for user ${userId}:`, error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(payload: NotificationPayload): Promise<void> {
    try {
      // In production, this would insert into a notifications table
      // For now, just log
      logger.debug('Storing notification:', {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
      });

      // You would typically do something like:
      // await supabaseService
      //   .from('notifications')
      //   .insert({
      //     user_id: payload.userId,
      //     type: payload.type,
      //     title: payload.title,
      //     body: payload.body,
      //     data: payload.data,
      //     priority: payload.priority,
      //     read: false,
      //     created_at: new Date().toISOString(),
      //   });
    } catch (error) {
      logger.error('Failed to store notification:', error);
    }
  }

  /**
   * Check if token is fresh (updated within last 30 days)
   */
  private isTokenFresh(updatedAt: string): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(updatedAt) > thirtyDaysAgo;
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(
    payload: NotificationPayload,
    scheduledFor: Date
  ): Promise<string> {
    const notificationId = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, this would use a job queue like Bull or Agenda
    const delay = scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if scheduled time has passed
      await this.sendNotification(payload);
    } else {
      // Schedule for later
      setTimeout(() => {
        this.sendNotification(payload);
      }, delay);
    }

    logger.info(`Scheduled notification ${notificationId} for ${scheduledFor.toISOString()}`);
    return notificationId;
  }
}

export const notificationService = new NotificationService();