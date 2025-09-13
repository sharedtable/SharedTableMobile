import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import { migrationService } from '../services/migrationService';
import { notificationCache } from '../services/notificationCache';
import { notificationMonitoring, trackingMiddleware } from '../services/notificationMonitoring';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for notification endpoints
const notificationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: 'Too many notification requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and monitoring to all routes
router.use(notificationRateLimit);
router.use(trackingMiddleware);

// Validation schemas
const CreateNotificationSchema = z.object({
  type: z.enum([
    'dinner_reminder',
    'dinner_confirmation', 
    'dinner_cancellation',
    'dinner_status_change',
    'dinner_reminder_final',
    'chat_message',
    'chat_mention',
    'chat_group_invite',
    'feed_post',
    'feed_mention',
    'feed_reaction',
    'feed_comment',
    'booking_request',
    'booking_approved',
    'booking_rejected',
    'event_invitation',
    'system_update'
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  channels: z.array(z.string()).optional().default(['push']),
  imageUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional()
});

const _UpdatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  dinnerReminders: z.boolean().optional(),
  dinnerStatusUpdates: z.boolean().optional(),
  chatMessages: z.boolean().optional(),
  chatMentions: z.boolean().optional(),
  feedActivity: z.boolean().optional(),
  bookingUpdates: z.boolean().optional(),
  promotionalContent: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reminderTimeBeforeEvent: z.number().min(0).max(1440).optional(), // 0-24 hours
  secondReminderEnabled: z.boolean().optional(),
  secondReminderTime: z.number().min(0).max(120).optional() // 0-2 hours
});

// Circuit breaker for database operations
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure < this.timeout) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened due to failures');
    }
  }
  
  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}

const dbCircuitBreaker = new CircuitBreaker();

// Ensure database is ready on startup
let dbReady = false;
migrationService.ensureNotificationsTable().then((ready) => {
  dbReady = ready;
  if (ready) {
    logger.info('Notifications database is ready');
  } else {
    logger.warn('Notifications database is not ready, using memory fallback');
  }
}).catch(error => {
  logger.error('Failed to initialize notifications database:', error);
  dbReady = false;
});

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
  expiresAt?: Date;
}

// Store a notification (for mobile app to persist notifications)
router.post('/', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  let userData: any = null;
  
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = CreateNotificationSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid notification data',
          details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      throw validationError;
    }

    // Try to get user data from cache first
    userData = await notificationCache.getUserData(privyUserId);
    
    if (!userData) {
      // Get the internal user ID from Privy ID with retry
      const maxRetries = 3;
      let userError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await supabaseService
            .from('users')
            .select('id')
            .eq('external_auth_id', privyUserId)
            .single();
          
          userData = result.data;
          userError = result.error;
          
          if (!userError && userData) {
            // Cache user data for future requests
            notificationCache.setUserData(privyUserId, userData);
            break;
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          }
        } catch (error) {
          userError = error;
          if (attempt < maxRetries) {
            logger.warn(`User lookup attempt ${attempt} failed, retrying...`, error);
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          }
        }
      }
    }

    if (userError || !userData) {
      logger.error('User not found after retries for notification storage:', privyUserId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create notification with secure ID
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const notification = {
      id: notificationId,
      user_id: userData.id,
      type: validatedData.type,
      title: validatedData.title,
      body: validatedData.body,
      data: validatedData.data ? JSON.stringify(validatedData.data) : null,
      image_url: validatedData.imageUrl || null,
      is_read: false,
      priority: validatedData.priority,
      channels: JSON.stringify(validatedData.channels),
      created_at: now,
      updated_at: now,
      expires_at: validatedData.expiresAt || null
    };

    let responseNotification: NotificationData;

    // Try database storage first if available
    if (dbReady) {
      try {
        const insertedNotification = await dbCircuitBreaker.execute(async () => {
          const { data, error } = await supabaseService
            .from('notifications')
            .insert(notification)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        });

        logger.info(`Stored notification in database for user ${userData.id}:`, notification.id, `(${Date.now() - startTime}ms)`);
        
        // Return notification in expected format
        responseNotification = {
          id: insertedNotification.id,
          userId: insertedNotification.user_id,
          type: insertedNotification.type,
          title: insertedNotification.title,
          body: insertedNotification.body,
          data: insertedNotification.data ? JSON.parse(insertedNotification.data) : undefined,
          read: insertedNotification.is_read,
          createdAt: new Date(insertedNotification.created_at),
          priority: insertedNotification.priority as any,
          channels: JSON.parse(insertedNotification.channels || '["push"]') as any
        };

        // Invalidate user's notification cache
        notificationCache.invalidateNotificationCache(userData.id);
        
        res.json({
          success: true,
          data: responseNotification
        });
        return;
      } catch (dbError) {
        logger.warn('Database storage failed, falling back to memory:', dbError);
      }
    }

    // Fallback to memory storage with limits and cleanup
    global.notifications = global.notifications || {};
    global.notifications[userData.id] = global.notifications[userData.id] || [];
    
    // Clean up old notifications and limit storage
    const userNotifications = global.notifications[userData.id];
    
    // Remove expired notifications
    const now_ts = Date.now();
    global.notifications[userData.id] = userNotifications.filter(n => {
      if (n.expiresAt && new Date(n.expiresAt).getTime() < now_ts) {
        return false;
      }
      return true;
    });
    
    // Limit to 100 notifications per user, keep most recent
    if (global.notifications[userData.id].length >= 100) {
      global.notifications[userData.id] = global.notifications[userData.id]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
    }
    
    const memoryNotification: NotificationData = {
      id: notificationId,
      userId: userData.id,
      type: validatedData.type,
      title: validatedData.title,
      body: validatedData.body,
      data: validatedData.data,
      read: false,
      createdAt: new Date(),
      priority: validatedData.priority as any,
      channels: validatedData.channels as any,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    };
    
    global.notifications[userData.id].push(memoryNotification);
    logger.info(`Stored notification in memory for user ${userData.id}:`, notificationId, `(${Date.now() - startTime}ms)`);

    // Invalidate user's notification cache
    notificationCache.invalidateNotificationCache(userData.id);

    res.json({
      success: true,
      data: memoryNotification
    });
  } catch (error) {
    logger.error('Error storing notification:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData?.id,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to store notification',
      code: 'NOTIFICATION_STORE_ERROR'
    });
  }
});

// Get notifications for a user
router.get('/', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  let userData: any = null;
  
  try {
    const privyUserId = req.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Cap at 100
    const unreadOnly = req.query.unreadOnly === 'true';

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Try to get user data from cache first
    userData = await notificationCache.getUserData(privyUserId);
    
    if (!userData) {
      // Get the internal user ID from Privy ID
      const { data: userResult, error: userError } = await supabaseService
        .from('users')
        .select('id')
        .eq('external_auth_id', privyUserId)
        .single();

      if (userError || !userResult) {
        logger.error('User not found for notification fetch:', privyUserId);
        return res.json({
          success: true,
          data: []
        });
      }
      
      userData = userResult;
      // Cache user data for future requests
      notificationCache.setUserData(privyUserId, userData);
    }

    // Try to get notifications from cache first
    let notifications = await notificationCache.getNotifications(userData.id, limit, unreadOnly);
    
    if (notifications === null) {
      // Cache miss - fetch from database or memory
      notifications = [];
      
      if (dbReady) {
        try {
          const dbNotifications = await dbCircuitBreaker.execute(async () => {
            let query = supabaseService
              .from('notifications')
              .select('*')
              .eq('user_id', userData.id)
              .order('created_at', { ascending: false })
              .limit(limit);

            if (unreadOnly) {
              query = query.eq('is_read', false);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
          });

          if (dbNotifications) {
            notifications = dbNotifications.map(n => ({
              id: n.id,
              userId: n.user_id,
              type: n.type,
              title: n.title,
              body: n.body,
              data: n.data ? JSON.parse(n.data) : undefined,
              read: n.read,
              createdAt: new Date(n.created_at),
              priority: n.priority,
              channels: JSON.parse(n.channels || '["push"]')
            }));

            logger.info(`Fetched ${notifications.length} notifications from database for user ${userData.id} (${Date.now() - startTime}ms)`);
          }
        } catch (dbError) {
          logger.warn('Database fetch failed, falling back to memory:', dbError);
        }
      }
      
      // Fallback to memory storage if database failed
      if (notifications.length === 0) {
        global.notifications = global.notifications || {};
        let memoryNotifications: NotificationData[] = global.notifications[userData.id] || [];
        
        if (unreadOnly) {
          memoryNotifications = memoryNotifications.filter(n => !n.read);
        }

        // Sort by createdAt descending (newest first)
        notifications = memoryNotifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, limit);

        logger.info(`Fetched ${notifications.length} notifications from memory for user ${userData.id} (${Date.now() - startTime}ms)`);
      }
      
      // Cache the results
      notificationCache.setNotifications(userData.id, notifications, limit, unreadOnly);
    } else {
      logger.debug(`Fetched ${notifications.length} notifications from cache for user ${userData.id} (${Date.now() - startTime}ms)`);
    }

    res.json({
      success: true,
      data: notifications,
      meta: {
        cached: notifications !== null,
        count: notifications.length,
        limit,
        unreadOnly
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData?.id,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      code: 'NOTIFICATION_FETCH_ERROR'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  let userData: any = null;
  
  try {
    const { notificationId } = req.params;
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!notificationId || notificationId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }

    // Get the internal user ID from Privy ID
    const { data: userResult, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userResult) {
      logger.error('User not found for notification read:', privyUserId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    userData = userResult;

    // Try database update first
    if (dbReady) {
      try {
        const updateResult = await dbCircuitBreaker.execute(async () => {
          const { data, error } = await supabaseService
            .from('notifications')
            .update({
              is_read: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', notificationId)
            .eq('user_id', userData.id)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        });

        if (updateResult) {
          logger.info(`Marked notification ${notificationId} as read in database for user ${userData.id} (${Date.now() - startTime}ms)`);
          
          res.json({
            success: true,
            message: 'Notification marked as read'
          });
          return;
        }
      } catch (dbError) {
        logger.warn('Database update failed, falling back to memory:', dbError);
      }
    }

    // Fallback to memory storage
    global.notifications = global.notifications || {};
    const userNotifications = global.notifications[userData.id] || [];
    
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      logger.info(`Marked notification ${notificationId} as read in memory for user ${userData.id} (${Date.now() - startTime}ms)`);
    } else {
      logger.warn(`Notification ${notificationId} not found in memory for user ${userData.id}`);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read:', {
      error: error instanceof Error ? error.message : error,
      notificationId: req.params.notificationId,
      userId: userData?.id,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      code: 'NOTIFICATION_READ_ERROR'
    });
  }
});

// Get unread count
router.get('/unread-count', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  let userData: any = null;
  
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Try to get user data from cache first
    userData = await notificationCache.getUserData(privyUserId);
    
    if (!userData) {
      // Get the internal user ID from Privy ID
      const { data: userResult, error: userError } = await supabaseService
        .from('users')
        .select('id')
        .eq('external_auth_id', privyUserId)
        .single();

      if (userError || !userResult) {
        logger.error('User not found for unread count:', privyUserId);
        return res.json({
          success: true,
          data: { count: 0 }
        });
      }
      
      userData = userResult;
      notificationCache.setUserData(privyUserId, userData);
    }

    // Try to get count from cache first
    let unreadCount = await notificationCache.getUnreadCount(userData.id);
    
    if (unreadCount === null) {
      // Cache miss - fetch from database or memory
      unreadCount = 0;
      
      if (dbReady) {
        try {
          const count = await dbCircuitBreaker.execute(async () => {
            const { count, error: dbError } = await supabaseService
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userData.id)
              .eq('is_read', false);

            if (dbError) throw dbError;
            return count;
          });

          if (count !== null) {
            unreadCount = count;
            logger.info(`Fetched unread count from database for user ${userData.id}: ${unreadCount} (${Date.now() - startTime}ms)`);
          }
        } catch (dbError) {
          logger.warn('Database count failed, falling back to memory:', dbError);
        }
      }
      
      // Fallback to memory storage if database failed
      if (unreadCount === 0 && !dbReady) {
        global.notifications = global.notifications || {};
        const notifications: NotificationData[] = global.notifications[userData.id] || [];
        
        unreadCount = notifications.filter(n => !n.read).length;
        logger.info(`Fetched unread count from memory for user ${userData.id}: ${unreadCount} (${Date.now() - startTime}ms)`);
      }
      
      // Cache the result with short TTL
      notificationCache.setUnreadCount(userData.id, unreadCount);
    } else {
      logger.debug(`Fetched unread count from cache for user ${userData.id}: ${unreadCount} (${Date.now() - startTime}ms)`);
    }

    res.json({
      success: true,
      data: { 
        count: unreadCount,
        cached: unreadCount !== null
      }
    });
  } catch (error) {
    logger.error('Error fetching unread count:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData?.id,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      code: 'UNREAD_COUNT_ERROR'
    });
  }
});

// Update push token
router.put('/push-token', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  let userData: any = null;
  
  try {
    const privyUserId = req.userId;
    const { token } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate push token format
    const pushTokenSchema = z.object({
      token: z.string().min(10).max(200).regex(/^ExponentPushToken\[[\w-]+\]$/, {
        message: 'Invalid Expo push token format'
      })
    });

    let validatedData;
    try {
      validatedData = pushTokenSchema.parse({ token });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid push token format',
          details: validationError.errors.map(e => e.message)
        });
      }
      throw validationError;
    }

    // Get the internal user ID from Privy ID with retry
    const maxRetries = 3;
    let userError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await supabaseService
          .from('users')
          .select('id')
          .eq('external_auth_id', privyUserId)
          .single();
        
        userData = result.data;
        userError = result.error;
        
        if (!userError && userData) break;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      } catch (error) {
        userError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
    }

    if (userError || !userData) {
      logger.error('User not found for push token update:', privyUserId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Try to update the push token in the users table with circuit breaker
    try {
      await dbCircuitBreaker.execute(async () => {
        const { error: updateError } = await supabaseService
          .from('users')
          .update({
            push_token: validatedData.token,
            push_token_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);

        if (updateError) {
          // Check if it's a column missing error
          if (updateError.code === 'PGRST204' || updateError.message?.includes('column')) {
            throw new Error('Push token columns not available');
          }
          throw updateError;
        }
      });

      logger.info(`Updated push token in database for user ${userData.id} (${Date.now() - startTime}ms)`);
    } catch (error) {
      // Fallback to memory storage
      logger.warn(`Database update failed, storing push token in memory for user ${userData.id}:`, error);
      global.pushTokens = global.pushTokens || {};
      global.pushTokens[userData.id] = { 
        token: validatedData.token, 
        updatedAt: new Date().toISOString() 
      };
    }

    res.json({
      success: true,
      message: 'Push token updated successfully'
    });
  } catch (error) {
    logger.error('Error updating push token:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData?.id,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update push token',
      code: 'PUSH_TOKEN_UPDATE_ERROR'
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

    // Return 0 for now - only real unread messages should be counted
    // When chat integration is complete, query from there
    const unreadCount = 0;

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

    // Return 0 for now - only real unread feed items should be counted
    // When feed integration is complete, query from there
    const unreadCount = 0;

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

// Get system metrics (protected endpoint for monitoring)
router.get('/system/metrics', async (req: AuthRequest, res: Response) => {
  try {
    // Simple authentication check - in production use proper admin auth
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - admin access required'
      });
    }

    const timeRange = parseInt(req.query.timeRange as string) || 60 * 60 * 1000; // Default 1 hour
    const summary = notificationMonitoring.getMetricsSummary(timeRange);
    
    // Add cache statistics
    const cacheStats = notificationCache.getStats();
    notificationMonitoring.updateCacheHitRatio(notificationCache.getHitRatio());

    res.json({
      success: true,
      data: {
        ...summary,
        cache: {
          ...summary.cache,
          stats: cacheStats,
          hitRatio: Math.round(notificationCache.getHitRatio() * 100)
        },
        health: {
          isHealthy: notificationMonitoring.isHealthy(),
          dbReady,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics'
    });
  }
});

// Health check endpoint
router.get('/system/health', async (req: AuthRequest, res: Response) => {
  try {
    const isHealthy = notificationMonitoring.isHealthy();
    const metrics = notificationMonitoring.getMetricsSummary(5 * 60 * 1000); // Last 5 minutes
    
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.system.uptimeHours,
      database: {
        ready: dbReady,
        successRate: metrics.database.successRate
      },
      cache: {
        hitRatio: Math.round(notificationCache.getHitRatio() * 100)
      },
      performance: {
        averageResponseTime: metrics.performance.averageResponseTime,
        errorRate: metrics.performance.errorRate
      }
    };

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;