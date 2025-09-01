/**
 * API routes for user feature processing
 */

import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
// import { embeddingService } from '../services/embeddingService';
import { featureProcessingWorker } from '../services/featureProcessingWorker';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /api/features/status
 * Get feature processing status for current user
 */
router.get('/status', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Check feature status
    const { data: features, error: _featuresError } = await supabase
      .from('user_features')
      .select('processing_status, version, updated_at, processed_at')
      .eq('user_id', userId)
      .single();
    
    // Check queue status
    const { data: queueItem, error: _queueError } = await supabase
      .from('feature_processing_queue')
      .select('status, priority, created_at, started_at, retry_count')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();
    
    res.json({
      success: true,
      features: features || { processing_status: 'not_processed' },
      queue: queueItem || null
    });
  } catch (error) {
    console.error('Error getting feature status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feature status'
    });
  }
});

/**
 * POST /api/features/process
 * Manually trigger feature processing for current user
 */
router.post('/process', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { priority = 3 } = req.body;
    
    // Add to processing queue
    await featureProcessingWorker.processUser(userId, priority);
    
    res.json({
      success: true,
      message: 'Feature processing queued',
      priority
    });
  } catch (error) {
    console.error('Error queueing feature processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue feature processing'
    });
  }
});

/**
 * GET /api/features/data
 * Get processed features for current user
 */
router.get('/data', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    const { data, error } = await supabase
      .from('user_features')
      .select('features, version, updated_at')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Features not found'
      });
    }
    
    res.json({
      success: true,
      features: data.features,
      version: data.version,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Error getting features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get features'
    });
  }
});

/**
 * POST /api/features/process-batch
 * Process features for multiple users (admin only)
 */
router.post('/process-batch', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin (you'll need to implement this check)
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userIds, priority = 5 } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userIds array required'
      });
    }
    
    // Add all users to queue
    const queuePromises = userIds.map(userId => 
      featureProcessingWorker.processUser(userId, priority)
    );
    
    await Promise.allSettled(queuePromises);
    
    res.json({
      success: true,
      message: `Queued ${userIds.length} users for processing`,
      priority
    });
  } catch (error) {
    console.error('Error batch processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue batch processing'
    });
  }
});

/**
 * GET /api/features/queue/stats
 * Get processing queue statistics (admin only)
 */
router.get('/queue/stats', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const stats = await featureProcessingWorker.getQueueStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics'
    });
  }
});

/**
 * POST /api/features/worker/start
 * Start the feature processing worker (admin only)
 */
router.post('/worker/start', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    featureProcessingWorker.start();
    
    res.json({
      success: true,
      message: 'Feature processing worker started'
    });
  } catch (error) {
    console.error('Error starting worker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start worker'
    });
  }
});

/**
 * POST /api/features/worker/stop
 * Stop the feature processing worker (admin only)
 */
router.post('/worker/stop', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    featureProcessingWorker.stop();
    
    res.json({
      success: true,
      message: 'Feature processing worker stopped'
    });
  } catch (error) {
    console.error('Error stopping worker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop worker'
    });
  }
});

/**
 * POST /api/features/queue/cleanup
 * Clean up old queue items (admin only)
 */
router.post('/queue/cleanup', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { daysOld = 7 } = req.body;
    const deletedCount = await featureProcessingWorker.cleanupQueue(daysOld);
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old queue items`
    });
  } catch (error) {
    console.error('Error cleaning queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean queue'
    });
  }
});

export default router;