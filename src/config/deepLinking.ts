import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { NotificationType } from '@/types/notification.types';
import { RootStackParamList } from '@/navigation/RootNavigator';

export const deepLinkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'sharedtable://',
    'https://sharedtable.app',
    'https://app.sharedtable.com',
  ],
  
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Feed: {
            screens: {
              FeedList: 'feed',
              CreatePost: 'feed/create',
              PostDetails: 'feed/post/:postId',
            },
          },
          Dashboard: {
            screens: {
              DashboardMain: 'dashboard',
              Achievements: 'dashboard/achievements',
              Leaderboard: 'dashboard/leaderboard',
              Quests: 'dashboard/quests',
            },
          },
          Profile: {
            screens: {
              ProfileMain: 'profile',
              EditProfile: 'profile/edit',
              DinnerHistory: 'profile/history',
              DinnerDetails: 'profile/dinner/:dinnerId',
            },
          },
        },
      },
      
      // Event screens
      EventDetails: 'events/:eventId',
      // EventChat: 'events/:eventId/chat', // Commented out as not in RootStackParamList
      // EventAttendees: 'events/:eventId/attendees', // Commented out as not in RootStackParamList
      // CreateEvent: 'events/create', // Commented out as not in RootStackParamList
      
      // Booking screens (commented out as not in RootStackParamList)
      // Bookings: 'bookings',
      // BookingDetails: 'bookings/:bookingId',
      
      // Chat screens
      // ChatList: 'chats', // Commented out as not in RootStackParamList
      // ChatRoom: 'chats/:chatId', // Commented out as not in RootStackParamList
      
      // Notification screens
      NotificationsList: 'notifications',
      // NotificationSettings: 'notifications/settings', // Commented out as not in RootStackParamList
      
      // Settings screens (commented out as not in RootStackParamList)
      // Settings: 'settings',
      // AccountSettings: 'settings/account',
      // PrivacySettings: 'settings/privacy',
      // SecuritySettings: 'settings/security',
      
      // Auth screens (commented out as not in RootStackParamList)
      // Login: 'login',
      // SignUp: 'signup',
      // ForgotPassword: 'forgot-password',
      // ResetPassword: 'reset-password',
      
      // Review screen (commented out as not in RootStackParamList)
      // Review: 'review/:eventId',
      
      // Security (commented out as not in RootStackParamList)
      // VerifyLogin: 'security/verify-login',
      // TwoFactorAuth: 'security/2fa',
    },
  },
  
  async getInitialURL() {
    // Check if app was opened from a notification
    const url = await Linking.getInitialURL();
    if (url) {
      return url;
    }
    
    // Check if there's a notification to handle
    const notification = await getInitialNotification();
    if (notification) {
      return getDeepLinkFromNotification(notification);
    }
    
    return null;
  },
  
  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    
    // Handle notification-based deep links
    const notificationSubscription = subscribeToNotificationLinks(listener);
    
    return () => {
      linkingSubscription.remove();
      notificationSubscription();
    };
  },
};

// Helper functions for notification deep linking
interface NotificationPayload {
  type: NotificationType;
  data?: Record<string, string | number>;
}

async function getInitialNotification(): Promise<NotificationPayload | null> {
  // This would be implemented to get the initial notification
  // that opened the app
  return null;
}

function getDeepLinkFromNotification(notification: NotificationPayload): string {
  const { type, data } = notification;
  
  switch (type) {
    case NotificationType.DINNER_REMINDER:
    case NotificationType.DINNER_CONFIRMATION:
    case NotificationType.DINNER_CANCELLATION:
    case NotificationType.DINNER_STATUS_CHANGE:
      return data?.eventId ? `sharedtable://events/${data.eventId}` : 'sharedtable://events';
      
    case NotificationType.DINNER_GROUP_MATCHED:
      return data?.groupId ? `sharedtable://profile/dinner/${data.groupId}` : 'sharedtable://profile';
      
    case NotificationType.CHAT_MESSAGE:
    case NotificationType.CHAT_MENTION:
      return data?.chatId ? `sharedtable://chats/${data.chatId}` : 'sharedtable://chats';
      
    case NotificationType.FEED_POST:
    case NotificationType.FEED_COMMENT:
    case NotificationType.FEED_REACTION:
    case NotificationType.FEED_MENTION:
      return data?.postId 
        ? `sharedtable://feed/post/${data?.postId}`
        : 'sharedtable://feed';
      
    case NotificationType.BOOKING_REQUEST:
    case NotificationType.BOOKING_APPROVED:
    case NotificationType.BOOKING_REJECTED:
      return data?.bookingId
        ? `sharedtable://bookings/${data?.bookingId}`
        : 'sharedtable://bookings';
      
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return 'sharedtable://dashboard/achievements';
      
    case NotificationType.QUEST_COMPLETED:
    case NotificationType.QUEST_PROGRESS:
      return 'sharedtable://dashboard/quests';
      
    case NotificationType.LEADERBOARD_UPDATE:
      return 'sharedtable://dashboard/leaderboard';
      
    case NotificationType.DINNER_REVIEW_REQUEST:
      return data?.eventId ? `sharedtable://review/${data.eventId}` : 'sharedtable://review';
      
    case NotificationType.SECURITY_ALERT:
    case NotificationType.LOGIN_NEW_DEVICE:
      return 'sharedtable://security/verify-login';
      
    case NotificationType.PROFILE_INCOMPLETE:
      return 'sharedtable://profile/edit';
      
    case NotificationType.EVENT_INVITATION:
      return data?.eventId ? `sharedtable://events/${data.eventId}` : 'sharedtable://events';
      
    case NotificationType.MATCH_FOUND:
      return data?.matchedUserId ? `sharedtable://profile/${data.matchedUserId}` : 'sharedtable://profile';
      
    default:
      return 'sharedtable://notifications';
  }
}

function subscribeToNotificationLinks(_listener: (url: string) => void): () => void {
  // This would be implemented to subscribe to notification-based
  // deep links while the app is running
  return () => {};
}

// Parse deep link to extract parameters
export function parseDeepLink(url: string): {
  screen: string;
  params?: Record<string, any>;
} {
  const { path, queryParams } = Linking.parse(url);
  
  // Extract screen and params from the URL
  const pathSegments = path?.split('/').filter(Boolean) || [];
  
  let screen = 'Home';
  let params: Record<string, any> = {};
  
  if (pathSegments[0]) {
    switch (pathSegments[0]) {
      case 'events':
        if (pathSegments[1]) {
          screen = 'EventDetails';
          params.eventId = pathSegments[1];
          
          if (pathSegments[2] === 'chat') {
            screen = 'EventChat';
          } else if (pathSegments[2] === 'attendees') {
            screen = 'EventAttendees';
          }
        } else {
          screen = 'Events';
        }
        break;
        
      case 'feed':
        if (pathSegments[1] === 'post' && pathSegments[2]) {
          screen = 'PostDetails';
          params.postId = pathSegments[2];
        } else if (pathSegments[1] === 'create') {
          screen = 'CreatePost';
        } else {
          screen = 'Feed';
        }
        break;
        
      case 'chats':
        if (pathSegments[1]) {
          screen = 'ChatRoom';
          params.chatId = pathSegments[1];
        } else {
          screen = 'ChatList';
        }
        break;
        
      case 'bookings':
        if (pathSegments[1]) {
          screen = 'BookingDetails';
          params.bookingId = pathSegments[1];
        } else {
          screen = 'Bookings';
        }
        break;
        
      case 'profile':
        if (pathSegments[1] === 'dinner' && pathSegments[2]) {
          screen = 'DinnerDetails';
          params.dinnerId = pathSegments[2];
        } else if (pathSegments[1] === 'edit') {
          screen = 'EditProfile';
        } else if (pathSegments[1]) {
          screen = 'UserProfile';
          params.userId = pathSegments[1];
        } else {
          screen = 'Profile';
        }
        break;
        
      case 'dashboard':
        if (pathSegments[1]) {
          switch (pathSegments[1]) {
            case 'achievements':
              screen = 'Achievements';
              break;
            case 'leaderboard':
              screen = 'Leaderboard';
              break;
            case 'quests':
              screen = 'Quests';
              break;
            default:
              screen = 'Dashboard';
          }
        } else {
          screen = 'Dashboard';
        }
        break;
        
      case 'notifications':
        screen = pathSegments[1] === 'settings' 
          ? 'NotificationSettings' 
          : 'Notifications';
        break;
        
      case 'review':
        if (pathSegments[1]) {
          screen = 'Review';
          params.eventId = pathSegments[1];
        }
        break;
        
      case 'security':
        if (pathSegments[1] === 'verify-login') {
          screen = 'VerifyLogin';
        } else if (pathSegments[1] === '2fa') {
          screen = 'TwoFactorAuth';
        }
        break;
        
      default:
        screen = pathSegments[0];
    }
  }
  
  // Add query parameters
  if (queryParams) {
    params = { ...params, ...queryParams };
  }
  
  return { screen, params };
}