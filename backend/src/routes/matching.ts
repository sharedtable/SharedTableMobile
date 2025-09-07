import { Router, Request, Response } from 'express';
import { SharedTableMatchingService } from '../services/sharedTableMatchingService';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Run matching algorithm for a specific dinner
 * @route POST /api/matching/dinners/:dinnerId/match
 * @authenticated
 */
router.post(
  '/dinners/:dinnerId/match',
  verifyPrivyToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { dinnerId } = req.params;

      // Verify the dinner exists
      const { data: dinner, error: dinnerError } = await supabaseService
        .from('dinners')
        .select('*')
        .eq('id', dinnerId)
        .single();

      if (dinnerError || !dinner) {
        res.status(404).json({ 
          success: false,
          error: 'Dinner not found' 
        });
        return;
      }

      // Check if matching has already been done
      const { data: existingGroups } = await supabaseService
        .from('dinner_groups')
        .select('id')
        .eq('time_slot_id', dinnerId)
        .limit(1);

      if (existingGroups && existingGroups.length > 0) {
        res.status(400).json({ 
          success: false,
          error: 'Matching already completed for this dinner' 
        });
        return;
      }

      // Run the matching pipeline
      logger.info(`Starting matching for dinner ${dinnerId} by user ${req.userId}`);
      const result = await SharedTableMatchingService.runCompleteMatching(dinnerId);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: 'Matching failed',
          details: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Matching completed successfully',
        stats: {
          totalGroups: result.groups.length,
          totalMatches: result.matches.length,
          unmatchedGroups: result.unmatchedGroups || 0
        },
        groups: result.groups,
        matches: result.matches
      });
    } catch (error) {
      logger.error('Matching API error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get matching results for a dinner
 * @route GET /api/matching/dinners/:dinnerId/groups
 * @authenticated
 */
router.get(
  '/dinners/:dinnerId/groups',
  verifyPrivyToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { dinnerId } = req.params;

      const { data: groups, error } = await supabaseService
        .from('dinner_groups')
        .select(`
          *,
          dinner_group_members(
            user_id,
            users(
              id,
              display_name,
              email
            )
          ),
          restaurants(
            id,
            name,
            cuisine_type,
            price_range,
            location
          )
        `)
        .eq('slot_id', timeSlotId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        groups: groups || []
      });
    } catch (error) {
      logger.error('Error fetching groups:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch groups',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Health check endpoint for SharedTable services
 * @route GET /api/matching/services/health
 * @public
 */
router.get('/services/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = [
      { name: 'Data Processor', port: 8000, path: '/api/v1/health' },
      { name: 'User Preferences', port: 8001, path: '/health' },
      { name: 'People Matcher', port: 8002, path: '/api/v1/health' },
      { name: 'Group Aggregator', port: 8004, path: '/health' },
      { name: 'Restaurant Matcher', port: 8005, path: '/health' }
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await fetch(`http://localhost:${service.port}${service.path}`);
          return {
            name: service.name,
            port: service.port,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status
          };
        } catch (error) {
          return {
            name: service.name,
            port: service.port,
            status: 'offline',
            error: error instanceof Error ? error.message : 'Connection failed'
          };
        }
      })
    );

    const allHealthy = results.every((r) => r.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      allServicesHealthy: allHealthy,
      services: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check service health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;