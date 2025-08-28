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
      .from('time_slots')
      .select('*')
      .eq('status', 'open')
      .gte('slot_date', now.toISOString().split('T')[0])
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });

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
      .from('time_slots')
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
      .from('slot_signups')
      .select('id')
      .eq('time_slot_id', timeSlotId)
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
      .from('slot_signups')
      .insert({
        time_slot_id: timeSlotId,
        user_id: userId,
        dietary_restrictions: dietaryRestrictions,
        preferences: preferences,
        status: 'pending',
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
      .from('time_slots')
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
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userId = userData.id;

    // Get user's signups with time slot details
    const { data: signups, error } = await supabaseService
      .from('slot_signups')
      .select(`
        *,
        time_slot:time_slots(*)
      `)
      .eq('user_id', userId)
      .order('signed_up_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user signups:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch signups',
      });
    }

    // For grouped signups, fetch the dinner group details
    const enhancedSignups = await Promise.all(
      (signups || []).map(async (signup) => {
        if (signup.status === 'grouped') {
          // Fetch the dinner group for this signup
          const { data: groupMember } = await supabaseService
            .from('group_members')
            .select(`
              *,
              dinner_group:dinner_groups(*)
            `)
            .eq('user_id', userId)
            .eq('dinner_group.time_slot_id', signup.time_slot_id)
            .single();

          if (groupMember?.dinner_group) {
            return {
              ...signup,
              dinner_group: groupMember.dinner_group,
            };
          }
        }
        return signup;
      })
    );

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

    // Get all members in the group
    const { data: members, error } = await supabaseService
      .from('group_members')
      .select(`
        *,
        user:users(id, email, first_name, last_name, display_name)
      `)
      .eq('dinner_group_id', dinnerGroupId);

    if (error) {
      logger.error('Error fetching group members:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch group members',
      });
    }

    return res.json({
      success: true,
      data: members || [],
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

    // Get the user's group assignment
    const { data: groupMember, error } = await supabaseService
      .from('group_members')
      .select(`
        *,
        dinner_group:dinner_groups(*),
        user:users(id, name, email)
      `)
      .eq('user_id', userId)
      .eq('dinner_group.time_slot_id', timeSlotId)
      .single();

    if (error || !groupMember) {
      return res.status(404).json({
        success: false,
        error: 'No group assignment found for this time slot',
      });
    }

    // Get all members in the same group
    const { data: allMembers, error: membersError } = await supabaseService
      .from('group_members')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .eq('dinner_group_id', groupMember.dinner_group_id);

    if (membersError) {
      logger.error('Error fetching group members:', membersError);
    }

    return res.json({
      success: true,
      data: {
        group: groupMember.dinner_group,
        myStatus: groupMember.status,
        members: allMembers || [],
      },
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
      .from('slot_signups')
      .select('*, time_slot:time_slots(*)')
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
      .from('slot_signups')
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
      .from('time_slots')
      .update({ 
        current_signups: signup.time_slot.current_signups - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', signup.time_slot_id);

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