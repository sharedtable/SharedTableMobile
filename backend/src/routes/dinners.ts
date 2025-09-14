import express, { Response } from 'express';
import { supabaseService } from '../config/supabase';
import { verifyPrivyToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all available dinners for signup
router.get('/available', async (_req: AuthRequest, res: Response) => {
  try {
    // Get time slots that are in the future and still open
    const now = new Date();
    const { data: slots, error } = await supabaseService
      .from('dinners')
      .select('*')
      .eq('status', 'open')
      .gte('datetime', now.toISOString())
      .order('datetime', { ascending: true });

    if (error) {
      logger.error('Error fetching dinners:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch available dinners',
      });
    }

    return res.json({
      success: true,
      data: slots || [],
    });
  } catch (error) {
    logger.error('Error in available dinners endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Sign up for a dinner
router.post('/signup', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { dinnerId, dietaryRestrictions, preferences } = req.body;

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
      .select('id')
      .eq('external_auth_id', privyUserId)
      .single();

    if (userError || !userData) {
      // User needs to be synced first
      logger.warn(`User not found for signup: ${privyUserId}. User needs to sync first.`);
      return res.status(404).json({
        success: false,
        error: 'Please wait for your account to sync. Try again in a moment.',
      });
    }

    const userId = userData.id;

    // Check if dinner is still available
    const { data: slot, error: slotError } = await supabaseService
      .from('dinners')
      .select('*')
      .eq('id', dinnerId)
      .eq('status', 'open')
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Dinner not available',
      });
    }

    // Check if user already has a booking for this dinner
    const { data: existingBooking } = await supabaseService
      .from('dinner_bookings')
      .select('id, status')
      .eq('dinner_id', dinnerId)
      .eq('user_id', userId)
      .single();

    // If there's an active booking, reject
    if (existingBooking && existingBooking.status !== 'cancelled') {
      return res.status(409).json({
        success: false,
        error: 'You have already signed up for this dinner',
      });
    }

    let signup, signupError;

    if (existingBooking && existingBooking.status === 'cancelled') {
      // Reactivate the cancelled booking
      const result = await supabaseService
        .from('dinner_bookings')
        .update({
          dietary_restrictions: dietaryRestrictions,
          preferences: preferences,
          status: 'confirmed',
          signed_up_at: new Date().toISOString(),
        })
        .eq('id', existingBooking.id)
        .select()
        .single();
      
      signup = result.data;
      signupError = result.error;
    } else {
      // Create new booking
      const result = await supabaseService
        .from('dinner_bookings')
        .insert({
          dinner_id: dinnerId,
          user_id: userId,
          dietary_restrictions: dietaryRestrictions,
          preferences: preferences,
          status: 'confirmed',
          signed_up_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      signup = result.data;
      signupError = result.error;
    }

    if (signupError) {
      logger.error('Error creating signup:', signupError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create signup',
      });
    }

    // Update the signup count
    const { error: updateError } = await supabaseService
      .from('dinners')
      .update({ 
        current_signups: slot.current_signups + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dinnerId);

    if (updateError) {
      logger.error('Error updating signup count:', updateError);
    }

    return res.json({
      success: true,
      data: signup,
      message: 'Successfully signed up for the dinner',
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
      // For new users who haven't been synced yet, return empty array
      logger.info(`User not found in database yet (likely new user): ${privyUserId}`);
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = userData.id;
    logger.info(`Fetching signups for user ${userId} (Privy: ${privyUserId})`);

    // Get user's dinner bookings
    const { data: signups, error } = await supabaseService
      .from('dinner_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('signed_up_at', { ascending: false });
    
    // If we have signups, fetch the dinner details separately
    let enhancedSignups = signups || [];
    if (signups && signups.length > 0) {
      const dinnerIds = [...new Set(signups.map(s => s.dinner_id))];
      const { data: dinners } = await supabaseService
        .from('dinners')
        .select('*')
        .in('id', dinnerIds);
      
      if (dinners) {
        const dinnerMap = new Map(dinners.map(d => [d.id, d]));
        enhancedSignups = signups.map(signup => ({
          ...signup,
          dinner: dinnerMap.get(signup.dinner_id) || null
        }));
      }
    }

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
router.get('/my-group/:dinnerId', verifyPrivyToken, async (req: AuthRequest, res: Response) => {
  try {
    const privyUserId = req.userId;
    const { dinnerId } = req.params;

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
      // For new users, return not found for group assignment
      logger.info(`User not found for group assignment: ${privyUserId}`);
      return res.status(404).json({
        success: false,
        error: 'No group assignment found',
      });
    }

    const userId = userData.id;

    // Since group_members table doesn't exist yet, return not found
    // TODO: Implement when group_members table is created
    logger.info(`Group assignment requested for user ${userId} and dinner ${dinnerId} - table not yet implemented`);
    
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
      // For new users, they shouldn't have any signups to cancel
      logger.info(`User not found for cancel: ${privyUserId}`);
      return res.status(404).json({
        success: false,
        error: 'Signup not found',
      });
    }

    const userId = userData.id;

    // Get the signup to verify ownership and status
    const { data: signup, error: signupError } = await supabaseService
      .from('dinner_bookings')
      .select('*')
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
    
    // Get the dinner details to update signup count
    const { data: dinner } = await supabaseService
      .from('dinners')
      .select('current_signups')
      .eq('id', signup.dinner_id)
      .single();

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
    if (dinner) {
      const { error: updateError } = await supabaseService
        .from('dinners')
        .update({ 
          current_signups: (dinner.current_signups || 1) - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signup.dinner_id);
      
      if (updateError) {
        logger.error('Error updating signup count:', updateError);
      }
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