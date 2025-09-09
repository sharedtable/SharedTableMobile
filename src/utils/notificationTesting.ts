import { notificationManager } from '@/services/notificationManager';
import { notificationService } from '@/services/notificationService';
import {
  NotificationType,
  NotificationData,
  NotificationPriority,
  NotificationChannel,
} from '@/types/notification.types';
import type { Achievement } from '@/types/gamification';

/**
 * Notification Testing Utilities
 * Use these functions to test various notification scenarios in development
 */

export class NotificationTester {
  static async testAllNotificationTypes() {
    console.log('🧪 Testing all notification types...');

    const testCases = [
      this.testDinnerReminder(),
      this.testChatMessage(),
      this.testFeedActivity(),
      this.testGamification(),
      this.testBookingUpdate(),
      this.testSystemAlert(),
    ];

    await Promise.all(testCases);
    console.log('✅ All notification tests completed');
  }

  static async testDinnerReminder() {
    await notificationManager.sendDinnerReminder(
      'test-event-123',
      'Test Dinner at Nobu',
      60
    );

    // Test final reminder
    setTimeout(() => {
      notificationManager.sendDinnerReminder(
        'test-event-123',
        'Test Dinner at Nobu',
        15
      );
    }, 5000);
  }

  static async testChatMessage() {
    const notification: NotificationData = {
      id: 'test-chat-1',
      type: NotificationType.CHAT_MESSAGE,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: 'Sarah Johnson',
      body: 'Hey! Are you excited for dinner tonight? 🍝',
      data: {
        chatId: 'chat-123',
        senderId: 'user-456',
        senderName: 'Sarah Johnson',
      },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    await notificationService.sendLocalNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      categoryId: 'chat_message',
    });
  }

  static async testFeedActivity() {
    const notifications = [
      {
        id: 'test-feed-1',
        type: NotificationType.FEED_REACTION,
        title: 'New Reactions',
        body: 'John and 3 others reacted to your dinner post',
      },
      {
        id: 'test-feed-2',
        type: NotificationType.FEED_COMMENT,
        title: 'New Comment',
        body: 'Emily: "That looks amazing! Where was this?"',
      },
      {
        id: 'test-feed-3',
        type: NotificationType.FEED_MENTION,
        title: 'You were mentioned',
        body: 'Alex mentioned you in a post about last night\'s dinner',
      },
    ];

    for (const notif of notifications) {
      const notification: NotificationData = {
        ...notif,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        data: { postId: 'post-789' },
        userId: 'current-user',
        read: false,
        createdAt: new Date(),
      };

      await notificationManager.sendNotification(notification);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  static async testGamification() {
    await notificationManager.sendAchievementUnlocked({
      id: 'achievement-1',
      name: 'Social Butterfly',
      description: 'Attended 10 dinners this month!',
      icon: '🦋',
      points: 100,
      category: 'social',
      // imageUrl: 'https://example.com/badge.png', // Not part of Achievement interface
    } as Achievement);

    const questNotification: NotificationData = {
      id: 'test-quest-1',
      type: NotificationType.QUEST_COMPLETED,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: '✨ Quest Completed!',
      body: 'You\'ve completed "Try 3 New Cuisines" and earned 500 points!',
      data: { questId: 'quest-123', pointsEarned: 500 },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    await notificationManager.sendNotification(questNotification);
  }

  static async testBookingUpdate() {
    const updates = [
      {
        type: NotificationType.BOOKING_APPROVED,
        title: '✅ Booking Confirmed',
        body: 'Your spot for "Italian Night at Luigi\'s" is confirmed!',
      },
      {
        type: NotificationType.DINNER_WAITLIST_UPDATE,
        title: '📋 Waitlist Update',
        body: 'A spot opened up! You\'re now confirmed for tomorrow\'s dinner.',
      },
      {
        type: NotificationType.BOOKING_CANCELLED_BY_HOST,
        title: '❌ Event Cancelled',
        body: 'Unfortunately, "Sushi Night" has been cancelled. You\'ve been refunded.',
      },
    ];

    for (const update of updates) {
      const notification: NotificationData = {
        id: `test-booking-${Date.now()}`,
        type: update.type,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        title: update.title,
        body: update.body,
        data: { bookingId: 'booking-123' },
        userId: 'current-user',
        read: false,
        createdAt: new Date(),
      };

      await notificationManager.sendNotification(notification);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  static async testSystemAlert() {
    const notification: NotificationData = {
      id: 'test-system-1',
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.URGENT,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      title: '⚠️ Security Alert',
      body: 'New login detected from San Francisco, CA. Was this you?',
      data: {
        actionRequired: true,
        actionUrl: 'sharedtable://security/verify-login',
      },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    await notificationManager.sendNotification(notification, { critical: true });
  }

  static async testGroupedNotifications() {
    console.log('🧪 Testing grouped notifications...');

    // Send multiple chat messages to trigger grouping
    for (let i = 0; i < 5; i++) {
      const notification: NotificationData = {
        id: `test-group-${i}`,
        type: NotificationType.CHAT_MESSAGE,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.PUSH],
        title: `User ${i + 1}`,
        body: `Message ${i + 1}`,
        data: { chatId: 'group-chat' },
        userId: 'current-user',
        read: false,
        createdAt: new Date(),
      };

      await notificationManager.sendNotification(notification, {
        groupId: 'chat-group-1',
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  static async testScheduledNotifications() {
    console.log('🧪 Testing scheduled notifications...');

    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 2);

    const notification: NotificationData = {
      id: 'test-scheduled-1',
      type: NotificationType.DINNER_REMINDER,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH],
      title: '⏰ Scheduled Test',
      body: 'This notification was scheduled 2 minutes ago!',
      data: { test: true },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    await notificationManager.sendNotification(notification, {
      schedule: futureDate,
    });

    console.log(`📅 Notification scheduled for ${futureDate.toLocaleTimeString()}`);
  }

  static async testNotificationActions() {
    console.log('🧪 Testing actionable notifications...');

    const notification: NotificationData = {
      id: 'test-action-1',
      type: NotificationType.DINNER_REMINDER,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.PUSH],
      title: '🍽️ Dinner in 30 minutes',
      body: 'Thai Food Lovers at Spice Garden starts soon!',
      data: {
        eventId: 'event-123',
        actionable: true,
      },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    await notificationService.sendLocalNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      categoryId: 'dinner_reminder',
    });
  }

  static async testErrorRecovery() {
    console.log('🧪 Testing error recovery...');

    // Simulate offline scenario
    const notification: NotificationData = {
      id: 'test-error-1',
      type: NotificationType.CHAT_MESSAGE,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.PUSH],
      title: 'Error Test',
      body: 'This notification will be queued and retried',
      data: { test: true },
      userId: 'current-user',
      read: false,
      createdAt: new Date(),
    };

    // This will be queued if offline
    await notificationManager.sendNotification(notification);

    // Check failed notifications
    const failed = await notificationManager.getFailedNotifications();
    console.log(`📝 Failed notifications: ${failed.length}`);

    // Retry failed notifications
    if (failed.length > 0) {
      console.log('🔄 Retrying failed notifications...');
      await notificationManager.retryFailedNotifications();
    }
  }

  static async clearAllTestNotifications() {
    console.log('🧹 Clearing all test notifications...');
    await notificationManager.cancelAllScheduledNotifications();
    await notificationManager.clearFailedNotifications();
    await notificationService.clearBadge();
    console.log('✅ All test notifications cleared');
  }
}

// Export for easy access in development
if (__DEV__) {
  (global as { notificationTester?: typeof NotificationTester }).notificationTester = NotificationTester;
  console.log('📱 Notification Tester available. Use: notificationTester.testAllNotificationTypes()');
}