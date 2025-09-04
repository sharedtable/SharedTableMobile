import { Router, Response, NextFunction } from 'express';
import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/debug/user-info
 * Get current user's onboarding_profiles record for debugging
 */
router.get('/user-info', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.json({ error: 'Not authenticated' });
    }

    // Get user
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, email, first_name, last_name, onboarding_status')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      return res.json({ error: 'User not found', privyId: req.userId });
    }

    // Get onboarding_profiles
    const { data: userInfo, error: infoError } = await supabaseService
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Count filled fields
    let filledFields = 0;
    let emptyFields = [];
    let filledData = {};
    
    if (userInfo) {
      const fieldsToCheck = [
        'education_level', 'school', 'occupation', 'industry', 'job_title', 'company',
        'ethnicity', 'nationality', 'religion', 'relationship_status', 'height_feet', 'height_inches',
        'personality_traits', 'mbti_type', 'lead_conversations', 'willing_compromise', 'seek_experiences', 'roles',
        'early_bird_night_owl', 'active_person', 'punctuality', 'work_life_balance', 'substances',
        'dietary_restrictions', 'food_budget', 'spicy_level', 'drinking_level', 'adventurous_level',
        'dining_atmospheres', 'dinner_duration', 'zip_code', 'travel_distance', 'food_craving',
        'cuisines_to_try', 'cuisines_to_avoid', 'interests', 'hobbies', 'hoping_to_meet', 'interesting_fact'
      ];
      
      fieldsToCheck.forEach(field => {
        if (userInfo[field]) {
          filledFields++;
          filledData[field] = userInfo[field];
        } else {
          emptyFields.push(field);
        }
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        onboarding_status: user.onboarding_status,
      },
      profile_exists: !!userInfo,
      profile: userInfo,
      stats: {
        filled_fields: filledFields,
        empty_fields: emptyFields.length,
        filled_data: filledData,
      },
      error: infoError?.message || null,
    });
  } catch (error) {
    logger.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/debug/create-profile
 * Force create an onboarding_profiles record
 */
router.post('/create-profile', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.json({ error: 'Not authenticated' });
    }

    // Get user
    const { data: user } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (!user) {
      return res.json({ error: 'User not found' });
    }

    // Check if exists
    const { data: existing } = await supabaseService
      .from('onboarding_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return res.json({ 
        message: 'Onboarding profile already exists',
        user_id: user.id,
      });
    }

    // Create with minimal data
    const { data, error } = await supabaseService
      .from('onboarding_profiles')
      .insert({
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return res.json({ error: error.message });
    }

    res.json({
      message: 'Onboarding profile created',
      data,
    });
  } catch (error) {
    logger.error('Create profile error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;