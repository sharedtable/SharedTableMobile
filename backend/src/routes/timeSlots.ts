import express, { Response } from 'express';
import { supabaseService } from '../config/supabase';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all available time slots for signup
router.get('/available', async (_req: AuthRequest, res: Response) => {
  try {
    // Get time slots that are in the future and still open
    const now = new Date();
    const { data: slots, error } = await supabaseService
      .from('timeslots')
      .select('*')
      .eq('status', 'open')
      .gte('datetime', now.toISOString())
      .order('datetime', { ascending: true });

    if (error) {
      logger.error('Error fetching time slots:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch available time slots',
      });
    }

    return res.json({
      success: true,
      data: slots || [],
    });
  } catch (error) {
    logger.error('Error in available time slots endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Sign up for a time slot
router.post('/signup', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { timeSlotId, dietaryRestrictions, preferences } = req.body;

    if (!privyUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        error: 'Time slot ID is required',
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

    // Check if slot is still available
    const { data: slot, error: slotError } = await supabaseService
      .from('timeslots')
      .select('*')
      .eq('id', timeSlotId)
      .eq('status', 'open')
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not available',
      });
    }

    // Check if user already signed up for this slot
    const { data: existingSignup } = await supabaseService
      .from('dinner_bookings')
      .select('id')
      .eq('timeslot_id', timeSlotId)
      .eq('user_id', userId)
      .single();

    if (existingSignup) {
      return res.status(409).json({
        success: false,
        error: 'You have already signed up for this time slot',
      });
    }

    // Create the signup
    const { data: signup, error: signupError } = await supabaseService
      .from('dinner_bookings')
      .insert({
        timeslot_id: timeSlotId,
        user_id: userId,
        dietary_restrictions: dietaryRestrictions,
        preferences: preferences,
        status: 'pending',
        signed_up_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (signupError) {
      logger.error('Error creating signup:', signupError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create signup',
      });
    }

    // Update the signup count
    const { error: updateError } = await supabaseService
      .from('timeslots')
      .update({ 
        current_signups: slot.current_signups + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeSlotId);

    if (updateError) {
      logger.error('Error updating signup count:', updateError);
    }

    return res.json({
      success: true,
      data: signup,
      message: 'Successfully signed up for the time slot',
    });
  } catch (error) {
    logger.error('Error in signup endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get user's signups
router.get('/my-signups', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
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
      logger.error('User not found:', { privyUserId, userError });
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;
    logger.info(`Fetching signups for user ${userId} (Privy: ${privyUserId})`);

    // Get user's dinner bookings
    const { data: signups, error } = await supabaseService
      .from('dinner_bookings')
      .select('*, timeslot:timeslots(*)')
      .eq('user_id', userId)
      .order('signed_up_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user signups:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId,
        privyUserId
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch signups',
        details: error.message // Add more details in response for debugging
      });
    }

    // For grouped signups, fetch the dinner group details
    // Note: group_members table doesn't exist yet, so we'll just return signups as-is
    const enhancedSignups = signups || [];

    return res.json({
      success: true,
      data: enhancedSignups,
    });
  } catch (error) {
    logger.error('Error in my-signups endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get group members for a dinner group
router.get('/group-members/:dinnerGroupId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { dinnerGroupId } = req.params;

    // Since group_members table doesn't exist yet, return empty array
    // TODO: Implement when group_members table is created
    logger.info(`Group members requested for dinner group ${dinnerGroupId} - table not yet implemented`);
    
    return res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    logger.error('Error in group-members endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get user's assigned dinner group (after grouping algorithm runs)
router.get('/my-group/:timeSlotId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { timeSlotId } = req.params;

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

    // Since group_members table doesn't exist yet, return not found
    // TODO: Implement when group_members table is created
    logger.info(`Group assignment requested for user ${userId} and time slot ${timeSlotId} - table not yet implemented`);
    
    return res.status(404).json({
      success: false,
      error: 'Group assignments not yet available',
    });
  } catch (error) {
    logger.error('Error in my-group endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Cancel a signup (only if not yet grouped)
router.delete('/signup/:signupId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { signupId } = req.params;

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

    // Get the signup to verify ownership and status
    const { data: signup, error: signupError } = await supabaseService
      .from('dinner_bookings')
      .select('*, timeslot:timeslots(*)')
      .eq('id', signupId)
      .eq('user_id', userId)
      .single();

    if (signupError || !signup) {
      return res.status(404).json({
        success: false,
        error: 'Signup not found',
      });
    }

    if (signup.status === 'grouped') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel signup after groups have been formed',
      });
    }

    // Delete the signup
    const { error: deleteError } = await supabaseService
      .from('dinner_bookings')
      .delete()
      .eq('id', signupId);

    if (deleteError) {
      logger.error('Error deleting signup:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel signup',
      });
    }

    // Update the signup count
    const { error: updateError } = await supabaseService
      .from('timeslots')
      .update({ 
        current_signups: signup.timeslot.current_signups - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', signup.timeslot_id);

    if (updateError) {
      logger.error('Error updating signup count:', updateError);
    }

    return res.json({
      success: true,
      message: 'Signup cancelled successfully',
    });
  } catch (error) {
    logger.error('Error in cancel signup endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;