import { Router, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { streamClient } from '../config/stream';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { normalizeStreamUserId } from '../../../shared/streamUserId';
import { supabaseService } from '../config/supabase';

const router = Router();

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
