import { Router } from 'express';
import { logger } from '../utils/logger';
import { streamClient } from '../config/stream';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { normalizeStreamUserId } from '../../../shared/streamUserId';

const router = Router();

// POST /api/chat/token (protected)
router.post('/token', verifyPrivyToken, async (req: AuthRequest, res, next) => {
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

    const token = streamClient.createToken(streamUserId);
    logger.info(`[Chat] Token created for streamUserId: ${streamUserId}`);
    res.json({ success: true, token, streamUserId });
  } catch (error) {
    logger.error('[Chat] Failed to create token:', error);
    next(error);
  }
});

export default router;
