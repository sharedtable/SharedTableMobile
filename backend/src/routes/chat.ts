import { Router, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { streamClient } from '../config/stream';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { normalizeStreamUserId } from '../utils/streamUserId';
import { supabaseService } from '../config/supabase';

const router = Router();

// GET /api/chat/unread-count (protected)
router.get('/unread-count', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const privyUserId = req.userId;
    if (!privyUserId) {
      throw new AppError('User not authenticated', 401);
    }

    const streamUserId = normalizeStreamUserId(privyUserId);
    logger.info(`[Chat] Getting unread count for streamUserId: ${streamUserId}`);

    try {
      // Get user's channel memberships with unread counts
      const response = await streamClient.queryChannels(
        { members: { $in: [streamUserId] } },
        { last_message_at: -1 },
        { state: true, watch: false }
      );

      // Calculate total unread count
      let totalUnread = 0;
      for (const channel of response) {
        const unreadCount = channel.state.read?.[streamUserId]?.unread_messages || 0;
        totalUnread += unreadCount;
      }

      logger.info(`[Chat] Total unread count for ${streamUserId}: ${totalUnread}`);
      res.json({ success: true, unreadCount: totalUnread });
    } catch (streamError: any) {
      // If user doesn't exist in Stream yet, return 0 unread
      if (streamError.message?.includes('user') || streamError.code === 4) {
        logger.info(`[Chat] User ${streamUserId} not found in Stream, returning 0 unread`);
        res.json({ success: true, unreadCount: 0 });
      } else {
        throw streamError;
      }
    }
  } catch (error) {
    logger.error('[Chat] Failed to get unread count:', error);
    next(error);
  }
});

// POST /api/chat/token (protected)
router.post('/token', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Use authenticated userId from Privy
    const privyUserId = req.userId;
    if (!privyUserId) {
      throw new AppError('User not authenticated', 401);
    }

    const streamUserId = normalizeStreamUserId(privyUserId);
    logger.info(
      `[Chat] Token request for privyUserId: ${privyUserId}, streamUserId: ${streamUserId}`
    );

    // Fetch user data from database to get their display name
    let userData: any = null;
    const { data: userDataResult, error: userError } = await supabaseService
      .from('users')
      .select('id, email, phone, display_name, first_name, last_name')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userError && userDataResult) {
      userData = userDataResult;
    } else if (!privyUserId.startsWith('did:privy:')) {
      // Try with the did:privy: prefix
      const { data: userDataWithPrefix } = await supabaseService
        .from('users')
        .select('id, email, phone, display_name, first_name, last_name')
        .eq('external_auth_id', `did:privy:${privyUserId}`)
        .single();
      
      if (userDataWithPrefix) {
        userData = userDataWithPrefix;
      }
    }

    // Create a proper display name
    let displayName = userData?.display_name || userData?.first_name || '';
    
    if (!displayName) {
      if (userData?.email) {
        displayName = userData.email.split('@')[0];
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      } else if (userData?.phone) {
        const last4 = userData.phone.slice(-4);
        displayName = `User ${last4}`;
      } else {
        displayName = 'Anonymous User';
      }
    }

    // Update the user in Stream Chat with their display name
    const streamUserData: any = {
      id: streamUserId,
      name: displayName,
    };
    
    // Add optional fields
    if (userData?.email) {
      streamUserData.email = userData.email;
    }
    if (userData?.phone) {
      streamUserData.phone = userData.phone;
    }
    
    await streamClient.upsertUser(streamUserData);

    logger.info(`[Chat] Updated Stream user ${streamUserId} with name: ${displayName}`);

    const token = streamClient.createToken(streamUserId);
    logger.info(`[Chat] Token created for streamUserId: ${streamUserId}`);
    res.json({ success: true, token, streamUserId, displayName });
  } catch (error) {
    logger.error('[Chat] Failed to create token:', error);
    next(error);
  }
});

export default router;
