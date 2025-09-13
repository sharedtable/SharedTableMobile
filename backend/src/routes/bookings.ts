import express, { Response } from 'express';
import { supabaseService, supabaseWithUser } from '../config/supabase';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { BookingCompletionScheduler } from '../services/bookingCompletionJob';
import { notificationService, NotificationType } from '../services/notificationService';

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
      .from('dinner_bookings')
      .select(`
        *,
        dinners(
          id,
          datetime,
          status
        )
      `)
      .eq('user_id', userId);
    
    // Note: Restaurant details would be fetched from a separate service
    // For now, we just return the bookings with dinner information

    if (error) {
      logger.error('Error fetching bookings:', { error, userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
        details: error.message,
      });
    }

    // Sort bookings by dinner datetime (most recent first)
    const sortedBookings = (bookings || []).sort((a, b) => {
      const dateA = a.dinners?.datetime ? new Date(a.dinners.datetime).getTime() : 0;
      const dateB = b.dinners?.datetime ? new Date(b.dinners.datetime).getTime() : 0;
      return dateB - dateA; // Descending order (most recent first)
    });

    return res.json({
      success: true,
      data: sortedBookings,
    });
  } catch (error) {
    logger.error('Error in my-bookings endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get past bookings for the authenticated user
router.get('/past', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
      logger.info(`User not found in database yet (likely new user): ${privyUserId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = userData.id;
    const now = new Date().toISOString();

    // Fetch past bookings with related dinner data
    const { data: bookings, error } = await supabaseService
      .from('dinner_bookings')
      .select(`
        *,
        dinners (
          id,
          datetime,
          status
        )
      `)
      .eq('user_id', userId)
      .in('status', ['confirmed', 'attended', 'completed']);

    if (error) {
      logger.error('Error fetching past bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch past bookings',
      });
    }

    // Filter past bookings in JavaScript since we can't filter by joined table directly
    const pastBookings = (bookings || []).filter((booking: any) => {
      const dinnerDate = booking.dinners?.datetime;
      return dinnerDate && new Date(dinnerDate) < new Date(now);
    }).sort((a: any, b: any) => {
      const dateA = a.dinners?.datetime || 0;
      const dateB = b.dinners?.datetime || 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return res.json({
      success: true,
      data: pastBookings,
    });
  } catch (error) {
    logger.error('Error in past bookings endpoint:', error);
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
      // For new users who haven't been synced yet, return empty array
      logger.info(`User not found in database yet (likely new user): ${privyUserId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = userData.id;

    const now = new Date().toISOString();

    // Fetch upcoming bookings with related dinner data
    const { data: bookings, error } = await supabaseService
      .from('dinner_bookings')
      .select(`
        *,
        dinners (
          id,
          datetime,
          status
        )
      `)
      .eq('user_id', userId)
      .in('status', ['confirmed', 'assigned', 'attended']);

    if (error) {
      logger.error('Error fetching upcoming bookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming bookings',
      });
    }

    // Filter upcoming bookings in JavaScript since we can't filter by joined table directly
    const upcomingBookings = (bookings || []).filter((booking: any) => {
      const dinnerDate = booking.dinners?.datetime;
      return dinnerDate && new Date(dinnerDate) >= new Date(now);
    }).sort((a: any, b: any) => {
      const dateA = a.dinners?.datetime || 0;
      const dateB = b.dinners?.datetime || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return res.json({
      success: true,
      data: upcomingBookings,
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

    logger.info(`Fetching booking details - bookingId: ${bookingId}, privyUserId: ${privyUserId}`);

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
      // For new users who haven't been synced yet, return empty array
      logger.info(`User not found in database yet (likely new user): ${privyUserId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = userData.id;
    logger.info(`Internal user ID: ${userId}`);

    // Fetch booking with related dinner data
    const { data: booking, error } = await supabaseService
      .from('dinner_bookings')
      .select(`
        *,
        dinners (
          id,
          datetime,
          status
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    logger.info(`Booking query result:`, { booking, error });

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

// Update booking status to attended
router.patch('/:bookingId/attend', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
        error: 'User not found',
      });
    }

    const userId = userData.id;

    // First check if the booking exists and is assigned, and get dinner details
    const { data: existingBooking, error: fetchError } = await supabaseService
      .from('dinner_bookings')
      .select('*, dinners!inner(id, datetime)')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (existingBooking.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        error: `Cannot check in. Current status: ${existingBooking.status}. You must be assigned to a group first.`,
      });
    }

    // Update booking status to attended
    const { data: booking, error } = await supabaseWithUser(userId)
      .from('dinner_bookings')
      .update({ 
        status: 'attended',
        attended_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error marking booking as attended:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
      });
    }

    // Schedule auto-completion after 1.5 hours from dinner start
    if (existingBooking.dinners?.datetime) {
      BookingCompletionScheduler.scheduleCompletion(
        bookingId,
        existingBooking.dinner_id,
        existingBooking.dinners.datetime
      );
      logger.info(`Scheduled auto-completion for booking ${bookingId}`);
    }

    // TODO: Trigger gamification points for attendance
    // await gamificationService.markDinnerAttended(userId, booking.event_id);

    return res.json({
      success: true,
      data: booking,
      message: 'Booking marked as attended. Will auto-complete 1.5 hours after dinner start.',
    });
  } catch (error) {
    logger.error('Error in attend booking endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Update booking status to completed
router.patch('/:bookingId/complete', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
        error: 'User not found',
      });
    }

    const userId = userData.id;

    // First check if the booking exists and is attended
    const { data: existingBooking, error: fetchError } = await supabaseService
      .from('dinner_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (!['confirmed', 'attended'].includes(existingBooking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot mark booking as completed. Current status: ${existingBooking.status}`,
      });
    }

    // Update booking status to completed
    const { data: booking, error } = await supabaseWithUser(userId)
      .from('dinner_bookings')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        attended_at: existingBooking.attended_at || new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error marking booking as completed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
      });
    }

    return res.json({
      success: true,
      data: booking,
      message: 'Booking marked as completed',
    });
  } catch (error) {
    logger.error('Error in complete booking endpoint:', error);
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
      // For new users who haven't been synced yet, return empty array
      logger.info(`User not found in database yet (likely new user): ${privyUserId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = userData.id;

    // Update booking status to cancelled with user context for audit logging
    const { data: booking, error } = await supabaseWithUser(userId)
      .from('dinner_bookings')
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

// Admin endpoint: Mark bookings as assigned when dinner groups are formed
router.post('/admin/mark-assigned', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { dinnerId, userIds } = req.body;

    if (!dinnerId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID and user IDs array are required',
      });
    }

    // TODO: Add admin permission check here

    // Update bookings from confirmed to assigned
    const { data: updatedBookings, error } = await supabaseService
      .from('dinner_bookings')
      .update({
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('dinner_id', dinnerId)
      .in('user_id', userIds)
      .eq('status', 'confirmed')
      .select();

    if (error) {
      logger.error('Error marking bookings as assigned:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
      });
    }

    return res.json({
      success: true,
      message: 'Bookings marked as assigned',
      data: updatedBookings,
      count: updatedBookings?.length || 0,
    });
  } catch (error) {
    logger.error('Error in mark assigned endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Admin endpoint: Bulk update bookings for a dinner that has ended
router.post('/admin/bulk-complete', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { dinnerId, attendedUserIds = [] } = req.body;

    if (!dinnerId) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID is required',
      });
    }

    // TODO: Add admin permission check here
    // For now, we'll just proceed with the update

    // Get all confirmed bookings for this dinner
    const { data: bookings, error: fetchError } = await supabaseService
      .from('dinner_bookings')
      .select('id, user_id')
      .eq('dinner_id', dinnerId)
      .eq('status', 'confirmed');

    if (fetchError) {
      logger.error('Error fetching bookings for bulk update:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
      });
    }

    if (!bookings || bookings.length === 0) {
      return res.json({
        success: true,
        message: 'No confirmed bookings to update',
        updated: 0,
      });
    }

    // Separate attended and no-show bookings
    const attendedBookingIds = bookings
      .filter(b => attendedUserIds.includes(b.user_id))
      .map(b => b.id);
    
    const noShowBookingIds = bookings
      .filter(b => !attendedUserIds.includes(b.user_id))
      .map(b => b.id);

    let completedCount = 0;

    // Update attended bookings to completed
    if (attendedBookingIds.length > 0) {
      const { error: attendedError } = await supabaseService
        .from('dinner_bookings')
        .update({
          status: 'completed',
          attended_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .in('id', attendedBookingIds);

      if (attendedError) {
        logger.error('Error updating attended bookings:', attendedError);
      } else {
        completedCount = attendedBookingIds.length;
      }
    }

    // Update no-show bookings to completed (but without attended_at)
    if (noShowBookingIds.length > 0) {
      const { error: noShowError } = await supabaseService
        .from('dinner_bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .in('id', noShowBookingIds);

      if (noShowError) {
        logger.error('Error updating no-show bookings:', noShowError);
      }
    }

    // TODO: Trigger gamification points for attended users
    // for (const userId of attendedUserIds) {
    //   await gamificationService.markDinnerAttended(userId, dinnerId);
    // }

    return res.json({
      success: true,
      message: 'Bookings updated successfully',
      stats: {
        total: bookings.length,
        attended: attendedBookingIds.length,
        noShow: noShowBookingIds.length,
        completed: completedCount
      }
    });
  } catch (error) {
    logger.error('Error in bulk complete endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get booking statistics by status
router.get('/stats/by-status', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
      return res.json({
        success: true,
        data: {
          confirmed: 0,
          attended: 0,
          completed: 0,
          cancelled: 0,
          total: 0
        },
      });
    }

    const userId = userData.id;

    // Get count of bookings by status
    const { data: bookings, error } = await supabaseService
      .from('dinner_bookings')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching booking stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking statistics',
      });
    }

    // Count bookings by status
    const stats = {
      confirmed: 0,
      attended: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    if (bookings) {
      bookings.forEach(booking => {
        if (booking.status in stats) {
          stats[booking.status as keyof typeof stats]++;
        }
        stats.total++;
      });
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error in booking stats endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Create a new booking
router.post('/create', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { dinnerId, preferences, plusOne } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!dinnerId) {
      return res.status(400).json({
        success: false,
        error: 'Dinner ID is required',
      });
    }

    // Get the internal user ID
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, first_name, last_name')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      logger.error('User not found:', { userError, privyUserId });
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userId = userData.id;
    const _userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';

    // Check if dinner exists and get its details
    const { data: dinnerData, error: dinnerError } = await supabaseService
      .from('dinners')
      .select('*, restaurants(*)')
      .eq('id', dinnerId)
      .single();

    if (dinnerError || !dinnerData) {
      logger.error('Dinner not found:', { dinnerError, dinnerId });
      return res.status(404).json({
        success: false,
        error: 'Dinner not found',
      });
    }

    // Check if user already has a booking for this dinner
    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('dinner_id', dinnerId)
      .single();

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'You already have a booking for this dinner',
      });
    }

    // Create the booking
    const bookingData = {
      user_id: userId,
      dinner_id: dinnerId,
      status: 'pending', // Will be updated based on availability
      preferences: preferences || null,
      plus_one: plusOne || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newBooking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .insert(bookingData)
      .select('*, dinners(*, restaurants(*))')
      .single();

    if (bookingError) {
      logger.error('Error creating booking:', bookingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking',
      });
    }

    // Send notification based on booking status
    const dinnerName = dinnerData.restaurants?.name || 'the dinner';
    const dinnerDate = dinnerData.datetime ? new Date(dinnerData.datetime) : undefined;
    
    try {
      await notificationService.sendBookingNotification(
        userId,
        newBooking.status as 'confirmed' | 'waitlisted' | 'cancelled' | 'assigned',
        dinnerName,
        newBooking.id,
        dinnerDate
      );

      // Schedule dinner reminder if confirmed
      if (newBooking.status === 'confirmed' && dinnerDate) {
        const twoHoursBefore = new Date(dinnerDate.getTime() - 2 * 60 * 60 * 1000);
        const oneHourBefore = new Date(dinnerDate.getTime() - 60 * 60 * 1000);
        
        if (twoHoursBefore > new Date()) {
          await notificationService.scheduleNotification(
            {
              userId,
              type: NotificationType.DINNER_REMINDER,
              title: '🍽️ Dinner Reminder',
              body: `Your dinner at ${dinnerName} is in 2 hours!`,
              data: { dinnerId, bookingId: newBooking.id },
              priority: 'high',
            },
            twoHoursBefore
          );
        }

        if (oneHourBefore > new Date()) {
          await notificationService.scheduleNotification(
            {
              userId,
              type: NotificationType.DINNER_REMINDER,
              title: '🍽️ Dinner Starting Soon',
              body: `Your dinner at ${dinnerName} is in 1 hour!`,
              data: { dinnerId, bookingId: newBooking.id },
              priority: 'high',
            },
            oneHourBefore
          );
        }
      }
    } catch (notifError) {
      logger.error('Failed to send booking notification:', notifError);
      // Don't fail the booking creation if notification fails
    }

    logger.info(`Booking created successfully for user ${userId} at dinner ${dinnerId}`);

    return res.json({
      success: true,
      data: newBooking,
      message: `Booking ${newBooking.status === 'confirmed' ? 'confirmed' : newBooking.status === 'waitlisted' ? 'waitlisted' : 'created'} successfully`,
    });
  } catch (error) {
    logger.error('Error in create booking endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Cancel a booking
router.post('/:bookingId/cancel', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
        error: 'User not found',
      });
    }

    const userId = userData.id;

    // Get the booking with dinner details
    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .select('*, dinners(*, restaurants(*))')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Update booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabaseService
      .from('dinner_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*, dinners(*, restaurants(*))')
      .single();

    if (updateError) {
      logger.error('Error cancelling booking:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel booking',
      });
    }

    // Send cancellation notification
    const dinnerName = booking.dinners?.restaurants?.name || 'the dinner';
    
    try {
      await notificationService.sendBookingNotification(
        userId,
        'cancelled',
        dinnerName,
        bookingId
      );
    } catch (notifError) {
      logger.error('Failed to send cancellation notification:', notifError);
    }

    logger.info(`Booking ${bookingId} cancelled successfully for user ${userId}`);

    return res.json({
      success: true,
      data: updatedBooking,
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

// Update booking status
router.patch('/:bookingId/status', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!status || !['confirmed', 'waitlisted', 'cancelled', 'assigned', 'attended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
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
        error: 'User not found',
      });
    }

    const userId = userData.id;

    // Get the booking with dinner details
    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .select('*, dinners(*, restaurants(*))')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseService
      .from('dinner_bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*, dinners(*, restaurants(*))')
      .single();

    if (updateError) {
      logger.error('Error updating booking status:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
      });
    }

    // Send status update notification
    const dinnerName = booking.dinners?.restaurants?.name || 'the dinner';
    const dinnerDate = booking.dinners?.datetime ? new Date(booking.dinners.datetime) : undefined;
    
    try {
      await notificationService.sendBookingNotification(
        userId,
        status as 'confirmed' | 'waitlisted' | 'cancelled' | 'assigned',
        dinnerName,
        bookingId,
        dinnerDate
      );

      // Schedule reminder if status changed to confirmed
      if (status === 'confirmed' && dinnerDate && dinnerDate > new Date()) {
        const twoHoursBefore = new Date(dinnerDate.getTime() - 2 * 60 * 60 * 1000);
        
        if (twoHoursBefore > new Date()) {
          await notificationService.scheduleNotification(
            {
              userId,
              type: NotificationType.DINNER_REMINDER,
              title: '🍽️ Dinner Reminder',
              body: `Your dinner at ${dinnerName} is in 2 hours!`,
              data: { dinnerId: booking.dinner_id, bookingId },
              priority: 'high',
            },
            twoHoursBefore
          );
        }
      }
    } catch (notifError) {
      logger.error('Failed to send status update notification:', notifError);
    }

    logger.info(`Booking ${bookingId} status updated to ${status} for user ${userId}`);

    return res.json({
      success: true,
      data: updatedBooking,
      message: `Booking status updated to ${status}`,
    });
  } catch (error) {
    logger.error('Error in update booking status endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;