import express, { Response } from 'express';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { supabaseService } from '../config/supabase';
import { logger } from '../utils/logger';
import { sendInvitationEmail } from '../services/emailService';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate a unique invitation code
 */
function generateInvitationCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

/**
 * Send invitation to a friend for a specific dinner
 */
router.post('/send', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { bookingId, inviteeName, inviteeEmail, inviteePhone } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!bookingId || !inviteeName || (!inviteeEmail && !inviteePhone)) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID, invitee name, and email or phone are required',
      });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, name, email')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .select(`
        id,
        event_id,
        user_id,
        status,
        events (
          id,
          title,
          event_date,
          start_time,
          restaurant_name,
          address
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', userData.id)
      .eq('status', 'confirmed')
      .single();

    if (bookingError || !booking) {
      logger.error('Booking not found or not confirmed:', bookingError);
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not confirmed',
      });
    }

    // Check if invitation already exists for this booking
    const { data: existingInvitation } = await supabaseService
      .from('dinner_invitations')
      .select('id, status')
      .eq('inviter_booking_id', bookingId)
      .in('status', ['pending', 'viewed', 'accepted'])
      .single();

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'An active invitation already exists for this booking',
      });
    }

    // Check if invitee is already a user
    let existingUser = null;
    if (inviteeEmail) {
      const { data: userByEmail } = await supabaseService
        .from('users')
        .select('id, name')
        .eq('email', inviteeEmail)
        .single();
      existingUser = userByEmail;
    }

    // Create invitation
    const invitationCode = generateInvitationCode();
    const { data: invitation, error: invitationError } = await supabaseService
      .from('dinner_invitations')
      .insert({
        inviter_user_id: userData.id,
        inviter_booking_id: bookingId,
        event_id: booking.event_id,
        invitation_code: invitationCode,
        invitee_name: inviteeName,
        invitee_email: inviteeEmail,
        invitee_phone: inviteePhone,
        invitee_user_id: existingUser?.id || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      })
      .select()
      .single();

    if (invitationError) {
      logger.error('Failed to create invitation:', invitationError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create invitation',
      });
    }

    // Send invitation email/SMS
    if (inviteeEmail) {
      await sendInvitationEmail({
        to: inviteeEmail,
        inviterName: userData.name,
        inviteeName,
        eventDetails: booking.events,
        invitationCode,
        invitationUrl: `${process.env.APP_URL}/invitation/${invitationCode}`,
      });
    }

    // TODO: Implement SMS sending for inviteePhone

    return res.json({
      success: true,
      data: {
        invitationId: invitation.id,
        invitationCode,
        status: 'sent',
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    logger.error('Error sending invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send invitation',
    });
  }
});

/**
 * Get invitation details by code (public endpoint for invitees)
 */
router.get('/code/:invitationCode', async (req: Request, res: Response) => {
  try {
    const { invitationCode } = req.params;

    const { data: invitation, error } = await supabaseService
      .from('dinner_invitations')
      .select(`
        id,
        invitation_code,
        invitee_name,
        status,
        expires_at,
        event_id,
        inviter_user_id,
        users!inviter_user_id (
          name,
          profile_picture_url
        ),
        events (
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          restaurant_name,
          address,
          city,
          price_per_person,
          cuisine_type,
          max_capacity,
          current_capacity
        )
      `)
      .eq('invitation_code', invitationCode)
      .single();

    if (error || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
      });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status if not already expired
      if (invitation.status === 'pending') {
        await supabaseService
          .from('dinner_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
      }

      return res.status(400).json({
        success: false,
        error: 'Invitation has expired',
      });
    }

    // Mark as viewed if still pending
    if (invitation.status === 'pending') {
      await supabaseService
        .from('dinner_invitations')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
    }

    return res.json({
      success: true,
      data: {
        invitationId: invitation.id,
        inviterName: invitation.users.name,
        inviterProfilePicture: invitation.users.profile_picture_url,
        inviteeName: invitation.invitee_name,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        event: invitation.events,
        spotsRemaining: invitation.events.max_capacity - invitation.events.current_capacity,
      },
    });
  } catch (error) {
    logger.error('Error fetching invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation details',
    });
  }
});

/**
 * Accept invitation (requires authentication)
 */
router.post('/accept', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { invitationCode } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        error: 'Invitation code is required',
      });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, name, email, onboarding_completed')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has completed mandatory onboarding
    if (!userData.onboarding_completed) {
      return res.status(400).json({
        success: false,
        error: 'Please complete onboarding before accepting invitations',
        requiresOnboarding: true,
      });
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseService
      .from('dinner_invitations')
      .select(`
        *,
        events (
          id,
          max_capacity,
          current_capacity
        )
      `)
      .eq('invitation_code', invitationCode)
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
      });
    }

    // Validate invitation status
    if (invitation.status !== 'pending' && invitation.status !== 'viewed') {
      return res.status(400).json({
        success: false,
        error: `Invitation is ${invitation.status}`,
      });
    }

    // Check if event has capacity
    if (invitation.events.current_capacity >= invitation.events.max_capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is fully booked',
      });
    }

    // Check if user already has a booking for this event
    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id')
      .eq('user_id', userData.id)
      .eq('event_id', invitation.event_id)
      .eq('status', 'confirmed')
      .single();

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'You already have a booking for this event',
      });
    }

    // Create booking for invitee
    const { data: inviteeBooking, error: bookingError } = await supabaseService
      .from('dinner_bookings')
      .insert({
        user_id: userData.id,
        event_id: invitation.event_id,
        status: 'confirmed',
        linked_booking_id: invitation.inviter_booking_id,
        is_linked_booking: true,
        linked_by_invitation_id: invitation.id,
        booking_source: 'friend_invitation',
      })
      .select()
      .single();

    if (bookingError) {
      logger.error('Failed to create booking:', bookingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking',
      });
    }

    // Update invitation status
    const { error: updateError } = await supabaseService
      .from('dinner_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invitee_user_id: userData.id,
        invitee_booking_id: inviteeBooking.id,
      })
      .eq('id', invitation.id);

    if (updateError) {
      logger.error('Failed to update invitation:', updateError);
    }

    // Update inviter's booking to link it
    await supabaseService
      .from('dinner_bookings')
      .update({
        linked_booking_id: inviteeBooking.id,
        is_linked_booking: true,
      })
      .eq('id', invitation.inviter_booking_id);

    // Update event capacity
    await supabaseService
      .from('events')
      .update({
        current_capacity: invitation.events.current_capacity + 1,
      })
      .eq('id', invitation.event_id);

    // Update user referral info if first time
    if (!userData.referred_by_user_id) {
      await supabaseService
        .from('users')
        .update({
          referred_by_user_id: invitation.inviter_user_id,
          referral_code: invitationCode,
          signup_source: 'friend_invitation',
        })
        .eq('id', userData.id);
    }

    return res.json({
      success: true,
      data: {
        bookingId: inviteeBooking.id,
        eventId: invitation.event_id,
        message: 'Invitation accepted successfully',
      },
    });
  } catch (error) {
    logger.error('Error accepting invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept invitation',
    });
  }
});

/**
 * Decline invitation
 */
router.post('/decline', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        error: 'Invitation code is required',
      });
    }

    const { error } = await supabaseService
      .from('dinner_invitations')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
      })
      .eq('invitation_code', invitationCode)
      .in('status', ['pending', 'viewed']);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decline invitation',
      });
    }

    return res.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    logger.error('Error declining invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to decline invitation',
    });
  }
});

/**
 * Get user's sent invitations
 */
router.get('/sent', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { data: invitations, error } = await supabaseService
      .from('dinner_invitations')
      .select(`
        *,
        events (
          title,
          event_date,
          start_time,
          restaurant_name
        ),
        users!invitee_user_id (
          name,
          profile_picture_url
        )
      `)
      .eq('inviter_user_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching sent invitations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch invitations',
      });
    }

    return res.json({
      success: true,
      data: invitations || [],
    });
  } catch (error) {
    logger.error('Error in sent invitations endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Cancel an invitation
 */
router.post('/:invitationId/cancel', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { invitationId } = req.params;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { data: userData } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { error } = await supabaseService
      .from('dinner_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('inviter_user_id', userData.id)
      .in('status', ['pending', 'viewed']);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel invitation',
      });
    }

    return res.json({
      success: true,
      message: 'Invitation cancelled',
    });
  } catch (error) {
    logger.error('Error cancelling invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation',
    });
  }
});

export default router;