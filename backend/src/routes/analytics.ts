import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/analytics/notifications
 * Track notification events from the mobile app
 */
router.post('/notifications', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { events } = req.body;
    
    // Log analytics events for monitoring
    if (events && Array.isArray(events)) {
      events.forEach(event => {
        logger.info('Notification Analytics Event', {
          userId: req.userId,
          type: event.type,
          timestamp: event.timestamp,
          properties: event.properties
        });
      });
    }
    
    // In production, you would send these to your analytics service
    // For now, just acknowledge receipt
    res.json({ 
      success: true,
      message: 'Analytics events received',
      count: events?.length || 0
    });
  } catch (error) {
    logger.error('Error in analytics/notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to process analytics events' });
  }
});

/**
 * POST /api/analytics/events
 * Track general analytics events from the mobile app
 */
router.post('/events', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { events } = req.body;
    
    // Log analytics events
    if (events && Array.isArray(events)) {
      events.forEach(event => {
        logger.info('Analytics Event', {
          userId: req.userId,
          name: event.name,
          timestamp: event.timestamp,
          properties: event.properties
        });
      });
    }
    
    res.json({ 
      success: true,
      message: 'Analytics events received',
      count: events?.length || 0
    });
  } catch (error) {
    logger.error('Error in analytics/events:', error);
    res.status(500).json({ success: false, error: 'Failed to process analytics events' });
  }
});

export default router;