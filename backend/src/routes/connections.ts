import { Router, Response } from 'express';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// CONNECTIONS (FRIENDS) ENDPOINTS
// ============================================================================

/**
 * GET /api/connections
 * Get all accepted connections (friends) for the authenticated user
 */
router.get('/', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    
    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Get all accepted connections with user details
    const { data: connections, error } = await supabaseService
      .from('v_user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('connected_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch connections:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch connections' });
    }

    res.json({ 
      success: true, 
      data: connections || []
    });
  } catch (error) {
    logger.error('Error in /connections:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/connections/pending
 * Get all pending connection requests received by the authenticated user
 */
router.get('/pending', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    
    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Get pending requests where this user is the recipient
    const { data: requests, error } = await supabaseService
      .from('v_pending_requests')
      .select('*')
      .eq('connected_user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch connection requests:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }

    res.json({ 
      success: true, 
      data: requests || []
    });
  } catch (error) {
    logger.error('Error in /connections/pending:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/connections
 * Send a new connection request to another user
 * Body: { userId: string, message?: string }
 */
router.post('/', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { userId: targetUserId, message } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'Target user ID is required' });
    }

    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Check if users are the same
    if (userId === targetUserId) {
      return res.status(400).json({ success: false, error: 'Cannot connect with yourself' });
    }

    // Check if connection already exists (in either direction)
    const { data: existingConnection } = await supabaseService
      .from('connections')
      .select('id, status')
      .or(`and(user_id.eq.${userId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${userId})`)
      .single();

    if (existingConnection) {
      return res.status(400).json({ 
        success: false, 
        error: `Connection already ${existingConnection.status}` 
      });
    }

    // Create new connection request
    const { data: newConnection, error: createError } = await supabaseService
      .from('connections')
      .insert({
        user_id: userId,
        connected_user_id: targetUserId,
        status: 'pending',
        message: message || null,
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create connection request:', createError);
      return res.status(500).json({ success: false, error: 'Failed to send connection request' });
    }

    res.json({ 
      success: true, 
      message: 'Connection request sent',
      data: newConnection
    });
  } catch (error) {
    logger.error('Error in /connections/send:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/connections/:connectionId/accept
 * Accept a pending connection request
 */
router.put('/:connectionId/accept', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { connectionId } = req.params;
    
    // Extract the actual connection ID (remove the suffix if present)
    const actualConnectionId = connectionId.replace(/_requester$|_recipient$/, '');

    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Verify this user is the recipient of the request
    const { data: connection, error: connError } = await supabaseService
      .from('connections')
      .select('*')
      .eq('id', actualConnectionId || connectionId)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    // Accept the connection request
    const { data: updatedConnection, error } = await supabaseService
      .from('connections')
      .update({ 
        status: 'accepted', 
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', actualConnectionId || connectionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to accept connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to accept connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection accepted',
      data: updatedConnection
    });
  } catch (error) {
    logger.error('Error in /connections/accept:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/connections/:connectionId/decline
 * Decline a pending connection request
 */
router.put('/:connectionId/decline', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { connectionId } = req.params;
    
    // Extract the actual connection ID (remove the suffix if present)
    const actualConnectionId = connectionId.replace(/_requester$|_recipient$/, '');

    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Verify this user is the recipient of the request
    const { data: connection, error: connError } = await supabaseService
      .from('connections')
      .select('*')
      .eq('id', actualConnectionId || connectionId)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    // Decline the connection request
    const { error } = await supabaseService
      .from('connections')
      .update({ 
        status: 'declined', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', actualConnectionId || connectionId);

    if (error) {
      logger.error('Failed to decline connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to decline connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection declined'
    });
  } catch (error) {
    logger.error('Error in /connections/decline:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/connections/:connectionId
 * Remove an existing connection (unfriend)
 */
router.delete('/:connectionId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { connectionId } = req.params;

    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Extract the actual connection ID (remove the suffix if present)
    const actualConnectionId = connectionId.replace(/_requester$|_recipient$/, '');
    
    // Verify this user is part of the connection
    const { data: connection, error: connError } = await supabaseService
      .from('connections')
      .select('*')
      .eq('id', actualConnectionId)
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }
    
    // Delete the connection
    const { error } = await supabaseService
      .from('connections')
      .delete()
      .eq('id', actualConnectionId);

    if (error) {
      logger.error('Failed to remove connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to remove connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection removed'
    });
  } catch (error) {
    logger.error('Error in /connections/remove:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/connections/search
 * Search for users to connect with
 * Query: { q?: string, limit?: number, offset?: number }
 */
router.get('/search', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { q: searchQuery } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userData.id;

    // Build query
    let query = supabaseService
      .from('users')
      .select('id, email, first_name, last_name, nickname')
      .neq('id', userId) // Exclude self
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (searchQuery && typeof searchQuery === 'string') {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,nickname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // Execute query
    const { data: users, error } = await query;

    if (error) {
      logger.error('Failed to search users:', error);
      return res.status(500).json({ success: false, error: 'Failed to search users' });
    }

    // Get connection status for each user
    const usersWithStatus = await Promise.all(
      (users || []).map(async (user) => {
        // Get connection status
        const { data: connection } = await supabaseService
          .from('connections')
          .select('status')
          .or(`and(user_id.eq.${userId},connected_user_id.eq.${user.id}),and(user_id.eq.${user.id},connected_user_id.eq.${userId})`)
          .single();

        return {
          ...user,
          profile_photo_url: null, // No photo support yet
          connectionStatus: connection?.status || null
        };
      })
    );

    res.json({ 
      success: true, 
      data: usersWithStatus
    });
  } catch (error) {
    logger.error('Error in /connections/search:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;