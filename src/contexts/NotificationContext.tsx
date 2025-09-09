import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationData, NotificationType, NotificationPriority, NotificationChannel } from '@/types/notification.types';
import { InAppNotification } from '@/components/notifications/InAppNotification';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/RootNavigator';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  inAppNotification: NotificationData | null;
  registerForPushNotifications: () => Promise<void>;
  showInAppNotification: (notification: NotificationData) => void;
  dismissInAppNotification: () => void;
  scheduleDinnerReminder: (eventId: string, eventDate: Date, eventTitle: string) => Promise<void>;
  cancelDinnerReminder: (eventId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [inAppNotification, setInAppNotification] = useState<NotificationData | null>(null);
  
  const {
    initialize,
    scheduleDinnerReminder: scheduleReminder,
    cancelDinnerReminder: cancelReminder,
  } = useNotificationStore();

  const showInAppNotification = useCallback((notification: NotificationData) => {
    setInAppNotification(notification);
  }, []);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const notificationType = data?.type as NotificationType;

    // Navigate based on notification type
    switch (notificationType) {
      case NotificationType.DINNER_REMINDER:
      case NotificationType.DINNER_STATUS_CHANGE:
        // Navigate to event details
        break;
      case NotificationType.CHAT_MESSAGE:
        // Navigate to chat
        break;
      case NotificationType.FEED_COMMENT:
      case NotificationType.FEED_REACTION:
        // Navigate to feed post
        break;
      default:
        // Navigate to notifications list
        break;
    }
  }, []);

  useEffect(() => {
    // Initialize notification system
    initialize();

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
      
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

  const registerForPushNotifications = useCallback(async () => {
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      setExpoPushToken(token);
    }
  }, []);

  const dismissInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

  const scheduleDinnerReminder = useCallback(async (
    eventId: string,
    eventDate: Date,
    eventTitle: string
  ) => {
    await scheduleReminder(eventId, eventDate, eventTitle);
  }, [scheduleReminder]);

  const cancelDinnerReminder = useCallback(async (eventId: string) => {
    await cancelReminder(eventId);
  }, [cancelReminder]);

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
            navigation.navigate('EventDetails', { eventId: data.eventId });
          }
          break;
        case NotificationType.CHAT_MESSAGE:
        case NotificationType.CHAT_MENTION:
          if (data?.eventId) {
            // EventChat screen not in RootStackParamList yet
            navigation.navigate('EventDetails', { eventId: data.eventId });
          }
          break;
        case NotificationType.FEED_POST:
        case NotificationType.FEED_MENTION:
        case NotificationType.FEED_REACTION:
        case NotificationType.FEED_COMMENT:
          // Feed is nested in Main, navigate to Main
          navigation.navigate('Main');
          break;
        case NotificationType.BOOKING_REQUEST:
        case NotificationType.BOOKING_APPROVED:
        case NotificationType.BOOKING_REJECTED:
          // Bookings screen not in RootStackParamList yet
          navigation.navigate('Main');
          break;
        default:
          navigation.navigate('NotificationsList');
          break;
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        inAppNotification,
        registerForPushNotifications,
        showInAppNotification,
        dismissInAppNotification,
        scheduleDinnerReminder,
        cancelDinnerReminder,
      }}
    >
      {children}
      <InAppNotification
        notification={inAppNotification}
        onPress={handleInAppNotificationPress}
        onDismiss={dismissInAppNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
