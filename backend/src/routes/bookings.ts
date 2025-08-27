import express, { Response } from 'express';
import { supabaseService } from '../config/supabase';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all bookings for the authenticated user
router.get('/my-bookings', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // First, get the internal user ID from the Privy external auth ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      logger.error('Error fetching user:', { userError, privyUserId });
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;

    // Now fetch bookings with the internal user ID
    // First, let's just get bookings without the join
    const { data: bookings, error } = await supabaseService
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // If we have bookings, fetch the associated events separately
    if (bookings && bookings.length > 0) {
      const eventIds = bookings.map(b => b.event_id).filter(Boolean);
      
      if (eventIds.length > 0) {
        const { data: events, error: eventsError } = await supabaseService
          .from('events')
          .select('*')
          .in('id', eventIds);
        
        if (eventsError) {
          logger.error('Error fetching events:', eventsError);
        } else if (events) {
          // Map events to bookings
          const eventsMap = new Map(events.map(e => [e.id, e]));
          bookings.forEach(booking => {
            if (booking.event_id) {
              booking.event = eventsMap.get(booking.event_id);
            }
          });
        }
      }
    }

    if (error) {
      logger.error('Error fetching bookings:', { error, userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
        details: error.message,
      });
    }

    return res.json({
      success: true,
      data: bookings || [],
    });
  } catch (error) {
    logger.error('Error in my-bookings endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get upcoming bookings for the authenticated user
router.get('/upcoming', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get the internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;

    const now = new Date().toISOString();

    // Fetch upcoming bookings with related event data
    const { data: bookings, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        event:events (
          id,
          title,
          description,
          restaurant_name,
          event_date,
          start_time,
          end_time,
          address,
          city,
          price_per_person,
          cuisine_type,
          dining_style,
          host_id,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('events.event_date', now)
      .order('events.event_date', { ascending: true });

    if (error) {
      logger.error('Error fetching upcoming bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming bookings',
      });
    }

    return res.json({
      success: true,
      data: bookings || [],
    });
  } catch (error) {
    logger.error('Error in upcoming bookings endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get a specific booking by ID
router.get('/:bookingId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId } = req.params;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get the internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;

    // Fetch booking with related event data
    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        event:events (
          id,
          title,
          description,
          restaurant_name,
          event_date,
          start_time,
          end_time,
          address,
          city,
          price_per_person,
          cuisine_type,
          dining_style,
          host_id,
          status
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }
      
      logger.error('Error fetching booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking',
      });
    }

    return res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('Error in get booking endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Cancel a booking
router.delete('/:bookingId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId } = req.params;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get the internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;

    // Update booking status to cancelled
    const { data: booking, error } = await supabaseService
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }
      
      logger.error('Error cancelling booking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel booking',
      });
    }

    return res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    logger.error('Error in cancel booking endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;