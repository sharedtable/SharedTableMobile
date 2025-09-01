import * as Notifications from 'expo-notifications';
import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationData, NotificationType, NotificationPriority, NotificationChannel } from '@/types/notification.types';
import { InAppNotification } from '@/components/notifications/InAppNotification';

interface NotificationWrapperProps {
  children: ReactNode;
}

export const NotificationWrapper: React.FC<NotificationWrapperProps> = ({ children }) => {
  const navigation = useNavigation() as NavigationProp<Record<string, object | undefined>>;
  const [inAppNotification, setInAppNotification] = useState<NotificationData | null>(null);
  
  const { initialize } = useNotificationStore();

  const showInAppNotification = useCallback((notification: NotificationData) => {
    setInAppNotification(notification);
  }, []);

  const dismissInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const notificationType = data?.type as NotificationType;

    // Navigate based on notification type
    switch (notificationType) {
      case NotificationType.DINNER_REMINDER:
      case NotificationType.DINNER_CONFIRMATION:
      case NotificationType.DINNER_CANCELLATION:
      case NotificationType.DINNER_STATUS_CHANGE:
        if (data?.eventId) {
          (navigation.navigate as unknown as (routeName: string, params?: object) => void)('EventDetails', { eventId: data.eventId });
        }
        break;
      case NotificationType.CHAT_MESSAGE:
      case NotificationType.CHAT_MENTION:
        if (data?.eventId) {
          (navigation.navigate as unknown as (routeName: string, params?: object) => void)('EventChat', { eventId: data.eventId });
        }
        break;
      case NotificationType.FEED_POST:
      case NotificationType.FEED_MENTION:
      case NotificationType.FEED_REACTION:
      case NotificationType.FEED_COMMENT:
        (navigation.navigate as unknown as (routeName: string) => void)('Feed');
        break;
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.BOOKING_APPROVED:
      case NotificationType.BOOKING_REJECTED:
        (navigation.navigate as unknown as (routeName: string) => void)('Bookings');
        break;
      default:
        (navigation.navigate as unknown as (routeName: string) => void)('Notifications');
        break;
    }
  }, [navigation]);

  useEffect(() => {
    // Initialize notification system
    initialize();

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Convert to our notification format and show in-app
      const notificationData: NotificationData = {
        id: notification.request.identifier,
        type: (notification.request.content.data?.type as NotificationType) || NotificationType.SYSTEM_UPDATE,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP],
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        userId: '',
        read: false,
        createdAt: new Date(),
      };
      
      showInAppNotification(notificationData);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [handleNotificationResponse, initialize, showInAppNotification]);

  const handleInAppNotificationPress = () => {
    if (inAppNotification) {
      const data = inAppNotification.data;
      const notificationType = inAppNotification.type;

      dismissInAppNotification();

      // Navigate based on notification type
      switch (notificationType) {
        case NotificationType.DINNER_REMINDER:
        case NotificationType.DINNER_CONFIRMATION:
        case NotificationType.DINNER_CANCELLATION:
        case NotificationType.DINNER_STATUS_CHANGE:
          if (data?.eventId) {
            (navigation.navigate as unknown as (routeName: string, params?: object) => void)('EventDetails', { eventId: data.eventId });
          }
          break;
        case NotificationType.CHAT_MESSAGE:
        case NotificationType.CHAT_MENTION:
          if (data?.eventId) {
            (navigation.navigate as unknown as (routeName: string, params?: object) => void)('EventChat', { eventId: data.eventId });
          }
          break;
        case NotificationType.FEED_POST:
        case NotificationType.FEED_MENTION:
        case NotificationType.FEED_REACTION:
        case NotificationType.FEED_COMMENT:
          (navigation.navigate as unknown as (routeName: string) => void)('Feed');
          break;
        case NotificationType.BOOKING_REQUEST:
        case NotificationType.BOOKING_APPROVED:
        case NotificationType.BOOKING_REJECTED:
          (navigation.navigate as unknown as (routeName: string) => void)('Bookings');
          break;
        default:
          (navigation.navigate as unknown as (routeName: string) => void)('Notifications');
          break;
      }
    }
  };

  return (
    <>
      {children}
      <InAppNotification
        notification={inAppNotification}
        onPress={handleInAppNotificationPress}
        onDismiss={dismissInAppNotification}
      />
    </>
  );
};