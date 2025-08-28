// Notification Types for SharedTable Mobile

export enum NotificationType {
  // Dinner Events
  DINNER_REMINDER = 'dinner_reminder',
  DINNER_REMINDER_FINAL = 'dinner_reminder_final',
  DINNER_CONFIRMATION = 'dinner_confirmation',
  DINNER_CANCELLATION = 'dinner_cancellation',
  DINNER_STATUS_CHANGE = 'dinner_status_change',
  DINNER_WAITLIST_UPDATE = 'dinner_waitlist_update',
  DINNER_GROUP_MATCHED = 'dinner_group_matched',
  DINNER_GROUP_MEMBER_JOINED = 'dinner_group_member_joined',
  DINNER_GROUP_MEMBER_LEFT = 'dinner_group_member_left',
  DINNER_REVIEW_REQUEST = 'dinner_review_request',
  DINNER_HOST_MESSAGE = 'dinner_host_message',
  
  // Chat & Messages
  CHAT_MESSAGE = 'chat_message',
  CHAT_MENTION = 'chat_mention',
  CHAT_ANNOUNCEMENT = 'chat_announcement',
  CHAT_GROUP_INVITE = 'chat_group_invite',
  CHAT_MEMBER_JOINED = 'chat_member_joined',
  CHAT_MEMBER_LEFT = 'chat_member_left',
  
  // Feed & Social
  FEED_POST = 'feed_post',
  FEED_MENTION = 'feed_mention',
  FEED_REACTION = 'feed_reaction',
  FEED_COMMENT = 'feed_comment',
  FEED_FOLLOW = 'feed_follow',
  FEED_TAG = 'feed_tag',
  
  // Bookings & Reservations
  BOOKING_REQUEST = 'booking_request',
  BOOKING_APPROVED = 'booking_approved',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED_BY_HOST = 'booking_cancelled_by_host',
  BOOKING_PAYMENT_REQUIRED = 'booking_payment_required',
  BOOKING_PAYMENT_RECEIVED = 'booking_payment_received',
  BOOKING_REFUND_ISSUED = 'booking_refund_issued',
  
  // Gamification
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  QUEST_COMPLETED = 'quest_completed',
  QUEST_PROGRESS = 'quest_progress',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  STREAK_REMINDER = 'streak_reminder',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  POINTS_EARNED = 'points_earned',
  REWARD_AVAILABLE = 'reward_available',
  
  // Matching & Recommendations
  MATCH_FOUND = 'match_found',
  COMPATIBILITY_UPDATE = 'compatibility_update',
  RECOMMENDATION_NEW = 'recommendation_new',
  
  // Profile & Account
  PROFILE_INCOMPLETE = 'profile_incomplete',
  PROFILE_UPDATE = 'profile_update',
  PROFILE_VERIFIED = 'profile_verified',
  PROFILE_VIEW = 'profile_view',
  
  // System & Security
  SYSTEM_UPDATE = 'system_update',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
  LOGIN_NEW_DEVICE = 'login_new_device',
  PASSWORD_RESET = 'password_reset',
  
  // Payment & Billing
  PAYMENT_UPDATE = 'payment_update',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCESS = 'payment_success',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  
  // Community & Events
  EVENT_INVITATION = 'event_invitation',
  EVENT_UPDATE = 'event_update',
  EVENT_NEARBY = 'event_nearby',
  COMMUNITY_WELCOME = 'community_welcome',
  COMMUNITY_MILESTONE = 'community_milestone',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  PUSH = 'push',
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  userId: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  scheduledFor?: Date;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  
  // Notification Types
  dinnerReminders: boolean;
  dinnerStatusUpdates: boolean;
  chatMessages: boolean;
  chatMentions: boolean;
  feedActivity: boolean;
  bookingUpdates: boolean;
  promotionalContent: boolean;
  
  // Timing Preferences
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  
  // Reminder Preferences
  reminderTimeBeforeEvent: number; // minutes
  secondReminderEnabled: boolean;
  secondReminderTime?: number; // minutes
}

export interface NotificationSchedule {
  id: string;
  notificationId: string;
  scheduledFor: Date;
  type: NotificationType;
  data: any;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  priority?: 'default' | 'high';
  categoryId?: string;
  imageUrl?: string;
}

interface NotificationAction {
  id: string;
  title: string;
  type: 'default' | 'destructive' | 'textInput';
  textInputButtonTitle?: string;
  textInputPlaceholder?: string;
}

export interface NotificationCategory {
  id: string;
  actions: NotificationAction[];
}