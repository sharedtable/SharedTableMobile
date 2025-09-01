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
    logger.error('Error in /connections/list:', error);
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
    logger.error('Error in /connections/requests:', error);
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

    // Check if connection already exists
    const { data: existingConnection } = await supabaseService
      .from('connections')
      .select('id, status')
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .or(`user_id.eq.${targetUserId},connected_user_id.eq.${targetUserId}`)
      .single();

    if (existingConnection) {
      return res.status(400).json({ 
        success: false, 
        error: `Connection already ${existingConnection.status}` 
      });
    }

    // Send connection request using the database function
    const { data, error } = await supabaseService
      .rpc('send_connection_request', {
        p_user_id: userId,
        p_connected_user_id: targetUserId,
        p_message: message || null
      });

    if (error) {
      logger.error('Failed to send connection request:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ 
      success: true, 
      data: { connectionId: data }
    });
  } catch (error) {
    logger.error('Error in /connections/request:', error);
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
      .eq('id', connectionId)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    // Accept the connection request
    const { data: _data, error } = await supabaseService
      .rpc('accept_connection_request', {
        p_connection_id: connectionId
      });

    if (error) {
      logger.error('Failed to accept connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to accept connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection accepted successfully'
    });
  } catch (error) {
    logger.error('Error in /connections/accept:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/connections/:connectionId/reject
 * Reject a pending connection request
 */
router.put('/:connectionId/reject', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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

    // Verify this user is the recipient of the request
    const { data: connection, error: connError } = await supabaseService
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    // Reject the connection request
    const { error } = await supabaseService
      .from('connections')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (error) {
      logger.error('Failed to reject connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to reject connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection request rejected'
    });
  } catch (error) {
    logger.error('Error in /connections/:id/reject:', error);
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

    // Verify this user is part of the connection
    const { data: connection, error: connError } = await supabaseService
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Decline/remove the connection
    const { data: _data2, error } = await supabaseService
      .rpc('decline_connection', {
        p_connection_id: connectionId
      });

    if (error) {
      logger.error('Failed to remove connection:', error);
      return res.status(500).json({ success: false, error: 'Failed to remove connection' });
    }

    res.json({ 
      success: true, 
      message: 'Connection removed successfully'
    });
  } catch (error) {
    logger.error('Error in /connections/delete:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/connections/users/:userId/block
 * Block a specific user
 */
router.post('/users/:userId/block', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const blockedUserId = req.params.userId;

    if (!blockedUserId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
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

    // Block the user
    const { data: _data3, error } = await supabaseService
      .rpc('block_user', {
        p_user_id: userId,
        p_blocked_user_id: blockedUserId
      });

    if (error) {
      logger.error('Failed to block user:', error);
      return res.status(500).json({ success: false, error: 'Failed to block user' });
    }

    res.json({ 
      success: true, 
      message: 'User blocked successfully'
    });
  } catch (error) {
    logger.error('Error in /connections/block:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/connections/users/search
 * Search for users to connect with
 * Query params: ?q=searchTerm
 */
router.get('/users/search', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const searchQuery = req.query.q;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query parameter "q" is required' });
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

    // Search for users (excluding self and already connected users)
    const { data: users, error } = await supabaseService
      .from('users')
      .select('id, first_name, last_name, display_name, email')
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .neq('id', userId)
      .limit(20);

    if (error) {
      logger.error('Failed to search users:', error);
      return res.status(500).json({ success: false, error: 'Failed to search users' });
    }

    // Check connection status for each user and format name
    const usersWithStatus = await Promise.all(
      (users || []).map(async (user) => {
        const { data: connection } = await supabaseService
          .from('connections')
          .select('status')
          .or(`and(user_id.eq.${userId},connected_user_id.eq.${user.id}),and(user_id.eq.${user.id},connected_user_id.eq.${userId})`)
          .single();

        // Format name from available fields
        const name = user.display_name || 
                     (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                     user.first_name || 
                     user.email;

        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name,
          name, // Add formatted name field
          avatar_url: null,  // Avatar not implemented yet
          bio: null,  // Bio not implemented yet
          connectionStatus: connection?.status || 'none'
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

/**
 * GET /api/connections/users/:userId/mutual
 * Get mutual connections count with another user
 */
router.get('/users/:userId/mutual', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const otherUserId = req.params.userId;

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

    // Get mutual connections count
    const { data, error } = await supabaseService
      .rpc('get_mutual_connections_count', {
        p_user_id: userId,
        p_other_user_id: otherUserId
      });

    if (error) {
      logger.error('Failed to get mutual connections:', error);
      return res.status(500).json({ success: false, error: 'Failed to get mutual connections' });
    }

    res.json({ 
      success: true, 
      data: { count: data || 0 }
    });
  } catch (error) {
    logger.error('Error in /connections/mutual:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;