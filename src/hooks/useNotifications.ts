import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { notificationService } from '@/services/notificationService';
import { notificationManager } from '@/services/notificationManager';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { logger } from '@/utils/logger';
// import { useStreamChat } from '@/hooks/useStreamChat';

// Note: Notification handler is configured in notificationIntegration service
// to properly handle app state and notification types

export function useNotifications() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user } = usePrivyAuth();
  const queryClient = useQueryClient();
  // const { client: chatClient } = useStreamChat();
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Handle notification tap/interaction
  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data as any;
    
    logger.debug('Notification tapped:', data);

    // Navigate based on notification type
    switch (data?.type) {
      case 'booking_status':
        // Navigate to bookings screen
        navigation.navigate('Main', {
          screen: 'Bookings',
          params: {
            bookingId: data.bookingId,
          },
        });
        break;
        
      case 'dinner_reminder':
        // Navigate to specific dinner
        navigation.navigate('Main', {
          screen: 'Events',
          params: {
            screen: 'EventDetails',
            params: {
              eventId: data.dinnerId,
            },
          },
        });
        break;
        
      case 'chat_message': {
        // Navigate to specific chat channel using global navigation service
        const { navigateToChat } = await import('@/services/navigationService');
        navigateToChat(data.channelId);
        break;
      }
        
      case 'match_found':
        // Navigate to matches
        navigation.navigate('Main', {
          screen: 'Matches',
          params: {
            matchId: data.matchId,
          },
        });
        break;
        
      case 'review_request':
        // Navigate to review screen
        navigation.navigate('PostDinnerSurvey', {
          dinnerId: data.dinnerId,
          bookingId: data.bookingId,
        });
        break;
        
      default:
        // Default to home
        navigation.navigate('Main');
    }
  }, [navigation]);

  // Schedule local notifications for various events
  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) => {
    try {
      // Build notification content dynamically to avoid nil issues
      const notificationContent: any = {
        title,
        body,
        sound: true,
      };

      // Only add data if it exists
      if (data) {
        notificationContent.data = data;
      }

      // Platform-specific properties
      if (Platform.OS === 'android') {
        notificationContent.priority = Notifications.AndroidNotificationPriority.HIGH;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: notificationContent as Notifications.NotificationContentInput,
        trigger: trigger || null, // null means immediate
      });
      
      logger.debug('Local notification scheduled:', { id, title });
      return id;
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      return null;
    }
  }, []);

  // Send booking status notification
  const sendBookingStatusNotification = useCallback(async (
    status: string,
    dinnerName: string,
    bookingId: string
  ) => {
    let title = 'Booking Update';
    let body = '';
    
    switch (status) {
      case 'confirmed':
        title = '✅ Booking Confirmed!';
        body = `Your spot at ${dinnerName} has been confirmed. Get ready for a great evening!`;
        break;
      case 'waitlisted':
        title = '⏳ You\'re on the Waitlist';
        body = `You've been added to the waitlist for ${dinnerName}. We'll notify you if a spot opens up.`;
        break;
      case 'cancelled':
        title = '❌ Booking Cancelled';
        body = `Your booking for ${dinnerName} has been cancelled.`;
        break;
      case 'assigned':
        title = '🎉 Table Assigned!';
        body = `You've been assigned a table for ${dinnerName}. Check the app for details!`;
        break;
      default:
        body = `Your booking status for ${dinnerName} has been updated to ${status}.`;
    }
    
    await scheduleLocalNotification(title, body, {
      type: 'booking_status',
      bookingId,
      status,
    });
  }, [scheduleLocalNotification]);

  // Send dinner reminder notification
  const sendDinnerReminder = useCallback(async (
    dinnerName: string,
    dinnerId: string,
    hoursBeforeDinner: number = 2
  ) => {
    const title = '🍽️ Dinner Reminder';
    const body = `Your dinner at ${dinnerName} is coming up in ${hoursBeforeDinner} hours!`;
    
    await scheduleLocalNotification(title, body, {
      type: 'dinner_reminder',
      dinnerId,
    });
  }, [scheduleLocalNotification]);

  // Send chat notification
  const sendChatNotification = useCallback(async (
    senderName: string,
    message: string,
    channelId: string
  ) => {
    const title = `💬 ${senderName}`;
    const body = message.length > 100 ? `${message.substring(0, 100)}...` : message;
    
    await scheduleLocalNotification(title, body, {
      type: 'chat_message',
      channelId,
    });
  }, [scheduleLocalNotification]);

  // Initialize notification system
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const initializeNotifications = async () => {
      try {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          logger.warn('Notification permissions not granted');
          return;
        }

        // Initialize services
        await notificationService.initialize();
        await notificationManager.initialize();

        // Get push token (but don't try to get project ID in Expo Go)
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || undefined,
          });
          
          if (token?.data) {
            logger.debug('Got Expo push token:', token.data);
            
            // Use the API service to register token with proper authentication
            try {
              const { api } = await import('@/services/api');
              const response = await api.updatePushToken(token.data);
              
              if (response.success) {
                logger.info('Push token registered with backend successfully');
              } else {
                logger.error('Failed to register push token with backend:', response.error);
              }
            } catch (error) {
              logger.error('Failed to register push token with backend:', error);
            }
          }
        } catch (tokenError) {
          // This is expected in Expo Go for Android
          logger.warn('Could not get push token (expected in Expo Go):', tokenError);
        }

        logger.info('Notification system initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Set up listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      logger.debug('Notification received:', notification);
      
      // Refresh relevant data based on notification type
      const data = notification.request.content.data as any;
      if (data?.type === 'booking_status') {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      } else if (data?.type === 'chat_message') {
        // Chat SDK handles its own notifications
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user, handleNotificationResponse, queryClient]);

  // Set up Stream Chat notifications
  useEffect(() => {
    // TODO: Re-enable when chat client is available
    // if (!chatClient || !isAuthenticated) {
    //   return;
    // }

    // const handleNewMessage = (event: any) => {
    //   // Only show notification if app is in background or message is from another user
    //   if (event.user?.id !== user?.id && event.message?.text) {
    //     sendChatNotification(
    //       event.user?.name || 'Someone',
    //       event.message.text,
    //       event.channel?.id || ''
    //     );
    //   }
    // };

    // // Listen for new messages
    // chatClient.on('message.new', handleNewMessage);

    // return () => {
    //   chatClient.off('message.new', handleNewMessage);
    // };
  }, [isAuthenticated, user, sendChatNotification]);

  // Get notification badge count
  const getBadgeCount = useCallback(async () => {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  }, []);

  // Set notification badge count
  const setBadgeCount = useCallback(async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  }, [setBadgeCount]);

  return {
    scheduleLocalNotification,
    sendBookingStatusNotification,
    sendDinnerReminder,
    sendChatNotification,
    getBadgeCount,
    setBadgeCount,
    clearAllNotifications,
  };
}