import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  priority?: 'high' | 'default' | 'low';
  channels?: string[];
}

// Get notifications for a user
router.get('/', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'default-user';
    const limit = parseInt(req.query.limit as string) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    // For now, return mock data since we don't have a notifications table yet
    // In production, this would query from a notifications table
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        userId,
        type: 'dinner_reminder',
        title: 'Upcoming Dinner',
        body: 'Your dinner "Sunday Brunch" starts in 1 hour',
        data: { eventId: 'event-1' },
        read: false,
        createdAt: new Date(Date.now() - 3600000),
        priority: 'high',
        channels: ['push', 'in_app']
      },
      {
        id: '2',
        userId,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        body: 'You\'ve unlocked "Social Butterfly" for attending 10 dinners',
        data: { achievementId: 'social_butterfly' },
        read: true,
        createdAt: new Date(Date.now() - 86400000),
        priority: 'default',
        channels: ['in_app']
      },
      {
        id: '3',
        userId,
        type: 'points_earned',
        title: 'Points Earned',
        body: 'You earned 20 points for attending a dinner',
        data: { points: 20, action: 'dinner_attended' },
        read: false,
        createdAt: new Date(Date.now() - 172800000),
        priority: 'low',
        channels: ['in_app']
      }
    ];

    let notifications = mockNotifications;
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    notifications = notifications.slice(0, limit);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user?.id || 'default-user';

    // In production, this would update the database
    // For now, just return success
    logger.info(`Marking notification ${notificationId} as read for user ${userId}`);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Get unread count
router.get('/unread-count', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const _userId = (req as any).user?.id || req.userId || 'default-user';

    // In production, this would query the database
    // For now, return a mock count
    const unreadCount = 2;

    res.json({
      success: true,
      data: { count: unreadCount }
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

// Update push token
router.put('/push-token', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Push token required'
      });
    }

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get the internal user ID from Privy ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      logger.error('User not found for push token update:', privyUserId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Try to update the push token in the users table
    // If the columns don't exist yet, store in memory as fallback
    try {
      const { error: updateError } = await supabaseService
        .from('users')
        .update({
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        // If columns don't exist, log but don't fail
        if (updateError.code === 'PGRST204') {
          logger.warn(`Push token columns not yet available, storing in memory for user ${userData.id}`);
          // In production, you might want to store this in Redis or another cache
          global.pushTokens = global.pushTokens || {};
          global.pushTokens[userData.id] = { token, updatedAt: new Date().toISOString() };
        } else {
          throw updateError;
        }
      }
    } catch (error) {
      // Fallback to memory storage
      logger.warn(`Storing push token in memory for user ${userData.id}:`, error);
      global.pushTokens = global.pushTokens || {};
      global.pushTokens[userData.id] = { token, updatedAt: new Date().toISOString() };
    }

    logger.info(`Updated push token for user ${userData.id}`);

    res.json({
      success: true,
      message: 'Push token updated successfully'
    });
  } catch (error) {
    logger.error('Error updating push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update push token'
    });
  }
});

// Send test notification
router.post('/test', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.userId || 'default-user';

    // Get user's push token
    const { data: userData, error: userError } = await supabaseService.auth.admin.getUserById(userId);

    if (userError) {
      throw userError;
    }

    const pushToken = userData.user?.user_metadata?.push_token;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        error: 'No push token found for user'
      });
    }

    // In production, this would send via Expo push notification service
    // For now, just log and return success
    logger.info(`Sending test notification to user ${userId} with token ${pushToken}`);

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// Get notification preferences
router.get('/preferences', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.userId || 'default-user';

    // Get user preferences from metadata
    const { data: userData, error } = await supabaseService.auth.admin.getUserById(userId);

    if (error) {
      throw error;
    }

    const preferences = userData.user?.user_metadata?.notification_preferences || {
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
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      reminderTimeBeforeEvent: 60,
      secondReminderEnabled: true,
      secondReminderTime: 15
    };

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

// Update notification preferences
router.put('/preferences', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.userId || 'default-user';
    const preferences = req.body;

    // Update user metadata with preferences
    const { error } = await supabaseService.auth.admin.updateUserById(userId, {
      user_metadata: {
        notification_preferences: preferences
      }
    });

    if (error) {
      throw error;
    }

    logger.info(`Updated notification preferences for user ${userId}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// Schedule a notification
router.post('/schedule', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.userId || 'default-user';
    const { type, title, body, scheduledFor, data } = req.body;

    if (!type || !title || !body || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'type, title, body, and scheduledFor are required'
      });
    }

    // In production, this would create a scheduled job
    // For now, just log and return success
    logger.info(`Scheduling notification for user ${userId}:`, {
      type,
      title,
      body,
      scheduledFor,
      data
    });

    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      data: {
        notificationId: `scheduled-${Date.now()}`,
        scheduledFor
      }
    });
  } catch (error) {
    logger.error('Error scheduling notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule notification'
    });
  }
});

// Cancel scheduled notification
router.delete('/scheduled/:notificationId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user?.id || req.userId || 'default-user';

    // In production, this would cancel the scheduled job
    logger.info(`Cancelling scheduled notification ${notificationId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Scheduled notification cancelled'
    });
  } catch (error) {
    logger.error('Error cancelling scheduled notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled notification'
    });
  }
});

// Get unread chat count (for badge)
router.get('/chat/unread-count', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const _userId = (req as any).user?.id || req.userId || 'default-user';

    // This would query the chat messages table
    // For now, return mock data
    const unreadCount = 3;

    res.json({
      success: true,
      data: { count: unreadCount }
    });
  } catch (error) {
    logger.error('Error fetching unread chat count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread chat count'
    });
  }
});

// Get unread feed count (for badge)
router.get('/feed/unread-count', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const _userId = (req as any).user?.id || req.userId || 'default-user';

    // This would query the feed activity table
    // For now, return mock data
    const unreadCount = 5;

    res.json({
      success: true,
      data: { count: unreadCount }
    });
  } catch (error) {
    logger.error('Error fetching unread feed count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread feed count'
    });
  }
});

export default router;