import { Router, Response, NextFunction } from 'express';
import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * SIMPLIFIED ONBOARDING SAVE
 * POST /api/onboarding-simple/save
 * Save any onboarding data directly to user_info table
 */
router.post('/save', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Allow test user override for development
    const userId = req.headers['x-test-user-id'] as string || req.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { step, data } = req.body;

    logger.info(`🎯 [SIMPLE ONBOARDING] Saving step: ${step}`, {
      userId,
      dataKeys: Object.keys(data || {}),
      dataValues: data,
      headers: req.headers.authorization ? 'Has auth' : 'No auth'
    });

    // Get user ID from external_auth_id
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Build the update data for onboarding_profiles table
    const userInfoData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Process height separately to handle feet and inches together
    if (data.heightFeet !== undefined || data.heightInches !== undefined) {
      const feet = parseInt(data.heightFeet, 10) || 0;
      const inches = parseInt(data.heightInches, 10) || 0;
      userInfoData.height = (feet * 12) + inches;
    }

    // Direct field mapping to actual database columns
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      // Skip empty values
      if (value === undefined || value === null || value === '') return;
      
      // Map frontend fields to actual database columns
      switch(key) {
        // Name fields (also update users table)
        case 'firstName':
          supabaseService.from('users').update({ first_name: value }).eq('id', user.id);
          break;
        case 'lastName':
          supabaseService.from('users').update({ last_name: value }).eq('id', user.id);
          break;
        case 'nickname':
          supabaseService.from('users').update({ display_name: value }).eq('id', user.id);
          break;
          
        // Basic info - save to users table
        case 'birthDate':
          // Save birth_date to users table, not onboarding_profiles
          supabaseService.from('users').update({ date_of_birth: value }).eq('id', user.id);
          break;
        case 'gender':
          // Save gender to users table, not onboarding_profiles
          supabaseService.from('users').update({ gender: value }).eq('id', user.id);
          break;
          
        // Education fields
        case 'educationLevel':
          userInfoData.education_level = value;
          break;
        case 'fieldOfStudy':
          // Skip - we don't have this column in onboarding_profiles
          break;
        case 'major':
          // Skip - we don't have this column in onboarding_profiles
          break;
        case 'school':
          userInfoData.school = value;
          break;
          
        // Work fields
        case 'occupation':
          // Map occupation to job_title since occupation column was removed
          userInfoData.job_title = value;
          break;
        case 'industry':
          userInfoData.industry = value; // Map to industry column
          break;
        case 'lineOfWork':
          userInfoData.industry = value; // Also map lineOfWork to industry
          break;
        case 'jobTitle':
          userInfoData.job_title = value;
          break;
        case 'company':
          userInfoData.company = value;
          break;
          
        // Background/Ethnicity
        case 'ethnicity':
          userInfoData.ethnicity = value;
          break;
        case 'nationality':
          userInfoData.nationality = value;
          break;
        case 'religion':
          userInfoData.religion = value;
          break;
        case 'relationshipStatus':
          userInfoData.relationship_status = value;
          break;
        case 'heightFeet':
        case 'heightInches':
          // Already handled above
          break;
        case 'heightCm':
          // Skip - we don't have height_cm column
          break;
          
        // Personality fields
        case 'personalityTraits':
          userInfoData.personality_traits = Array.isArray(value) ? value : [value];
          break;
        case 'mbti':
        case 'mbtiType':
          userInfoData.mbti_type = value;
          // Don't set mbti - column doesn't exist
          break;
        case 'leadConversations':
          userInfoData.lead_conversations = value;
          break;
        case 'willingCompromise':
          userInfoData.willing_compromise = value;
          break;
        case 'seekExperiences':
          userInfoData.seek_experiences = value;
          break;
        case 'roles':
          userInfoData.roles = Array.isArray(value) ? value : [value];
          break;
        case 'conversationStyle':
          userInfoData.conversation_style = value;
          break;
          
        // Lifestyle fields
        case 'lifestyle':
          // Skip - we don't have life_goals column
          break;
        case 'beliefs':
          // Skip - we don't have beliefs column
          break;
        case 'smoking':
          // Skip - we don't have smoking column
          break;
        case 'drinking':
          // Skip - we don't have drinking column
          break;
        case 'earlyBirdNightOwl':
          userInfoData.early_bird_night_owl = value;
          break;
        case 'activePerson':
          userInfoData.active_person = value;
          break;
        case 'punctuality':
          userInfoData.punctuality = value;
          break;
        case 'workLifeBalance':
          userInfoData.work_life_balance = value;
          break;
        case 'substances':
          userInfoData.substances = Array.isArray(value) ? value : [value];
          break;
          
        // Food preference fields
        case 'dietaryRestrictions':
          userInfoData.dietary_restrictions = Array.isArray(value) ? value : value ? [value] : [];
          break;
        case 'budget':
          userInfoData.food_budget = value;
          break;
        case 'spicyLevel':
          userInfoData.spicy_level = value;
          break;
        case 'drinkingLevel':
          userInfoData.drinking_level = value;
          break;
        case 'adventurousLevel':
          userInfoData.adventurous_level = value;
          break;
        case 'diningAtmospheres':
          userInfoData.dining_atmospheres = Array.isArray(value) ? value : [value];
          break;
        case 'dinnerDuration':
          userInfoData.dinner_duration = value;
          break;
        case 'zipCode':
          userInfoData.zipcode = value;
          break;
        case 'travelDistance':
          userInfoData.travel_distance = value;
          break;
        case 'foodCraving':
          userInfoData.food_craving = Array.isArray(value) ? value : [value];
          break;
        case 'cuisinesToTry':
          userInfoData.cuisines_to_try = Array.isArray(value) ? value : [value];
          break;
        case 'cuisinesToAvoid':
          userInfoData.cuisines_to_avoid = Array.isArray(value) ? value : [value];
          break;
          
        // Interests fields
        case 'interests':
          userInfoData.interests = Array.isArray(value) ? value : [value];
          break;
        case 'hobbies':
          // hobbies is an array field
          userInfoData.hobbies = Array.isArray(value) ? value : [value];
          break;
          
        // Final Touch fields
        case 'hopingToMeet':
          userInfoData.hoping_to_meet = value;
          break;
        case 'interestingFact':
          userInfoData.interesting_fact = value;
          break;
      }
    });
    // user_info table has all fields as proper columns, no JSON conversion needed

    logger.info(`[SIMPLE ONBOARDING] Saving to user_info:`, {
      userId: user.id,
      fields: Object.keys(userInfoData),
      data: userInfoData
    });

    // Use the new onboarding_profiles table instead of user_info
    const { data: existingProfile } = await supabaseService
      .from('onboarding_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let saveError;
    if (existingProfile) {
      // Update existing record
      logger.info(`[SIMPLE ONBOARDING] Updating existing profile for user ${user.id}`);
      const { error } = await supabaseService
        .from('onboarding_profiles')
        .update(userInfoData)
        .eq('user_id', user.id);
      saveError = error;
    } else {
      // Insert new record
      logger.info(`[SIMPLE ONBOARDING] Creating new profile for user ${user.id}`);
      userInfoData.created_at = new Date().toISOString();
      const { error } = await supabaseService
        .from('onboarding_profiles')
        .insert(userInfoData);
      saveError = error;
    }

    if (saveError) {
      logger.error('❌ [SIMPLE ONBOARDING] Failed to save:', {
        error: saveError,
        table: 'onboarding_profiles',
        userId: user.id,
        step
      });
      throw new AppError('Failed to save onboarding data', 500);
    }

    logger.info(`✅ [SIMPLE ONBOARDING] Successfully saved step: ${step}`, {
      table: 'onboarding_profiles',
      userId: user.id,
      operation: existingProfile ? 'UPDATE' : 'INSERT',
      fieldsUpdated: Object.keys(userInfoData)
    });

    const response = {
      success: true,
      message: `Onboarding step '${step}' saved successfully`,
    };
    
    logger.info(`✅ [SIMPLE ONBOARDING] Sending response:`, response);
    
    res.json(response);
  } catch (error) {
    logger.error('❌ [SIMPLE ONBOARDING] Route error:', error);
    next(error);
  }
});

/**
 * POST /api/onboarding-simple/complete
 * Mark onboarding as complete
 */
router.post('/complete', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Allow test user override for development
    const userId = req.headers['x-test-user-id'] as string || req.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Update user's onboarding status in both tables
    const timestamp = new Date().toISOString();
    
    // Update users table
    const { error: usersError } = await supabaseService
      .from('users')
      .update({
        onboarding_status: 'fully_complete',
        onboarding_completed_at: timestamp,
        updated_at: timestamp,
      })
      .eq('external_auth_id', userId);
      
    // Also update onboarding_profiles table
    const { error: infoError } = await supabaseService
      .from('onboarding_profiles')
      .update({
        updated_at: timestamp,
      })
      .eq('user_id', (await supabaseService.from('users').select('id').eq('external_auth_id', userId).single()).data?.id);
    
    const error = usersError || infoError;

    if (error) {
      logger.error('Failed to update onboarding status:', error);
      throw new AppError('Failed to complete onboarding', 500);
    }

    logger.info(`User ${req.userId} completed onboarding`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      status: 'fully_complete',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding-simple/resume-info
 * Get information about where to resume onboarding
 */
router.get('/resume-info', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }
    
    // Get user from database
    const { data: user } = await supabaseService
      .from('users')
      .select('id, onboarding_status')
      .eq('external_auth_id', userId)
      .single();
    
    if (!user) {
      return res.json({
        success: false,
        canResume: false,
        message: 'User not found'
      });
    }
    
    // Get onboarding profile to check progress
    const { data: profile } = await supabaseService
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      return res.json({
        success: true,
        canResume: false,
        nextStep: 'education',
        completedSteps: [],
        message: 'No onboarding progress found'
      });
    }
    
    // Determine which steps are completed based on filled data
    const completedSteps = [];
    const optionalSteps = [
      { step: 'education', fields: ['education_level', 'school'] },
      { step: 'work', fields: ['job_title', 'company'] },
      { step: 'ethnicity', fields: ['ethnicity', 'nationality'] },
      { step: 'personality', fields: ['lead_conversations', 'willing_compromise', 'seek_experiences'] },
      { step: 'lifestyle', fields: ['early_bird_night_owl', 'active_person'] },
      { step: 'foodPreferences1', fields: ['dietary_restrictions', 'food_budget'] },
      { step: 'foodPreferences2', fields: ['dinner_duration', 'zipcode'] },
      { step: 'foodPreferences3', fields: ['cuisines_to_try'] },
      { step: 'foodPreferences4', fields: ['cuisines_to_avoid'] },
      { step: 'interests', fields: ['interests'] },
      { step: 'hobbies', fields: ['hobbies'] },
      { step: 'hopingToMeet', fields: ['hoping_to_meet'] },
      { step: 'interestingFact', fields: ['interesting_fact'] }
    ];
    
    // Check which steps have data
    for (const stepInfo of optionalSteps) {
      const hasData = stepInfo.fields.some(field => {
        const value = profile[field];
        return value !== null && value !== undefined && 
               (Array.isArray(value) ? value.length > 0 : true);
      });
      
      if (hasData) {
        completedSteps.push(stepInfo.step);
      }
    }
    
    // Determine next step
    const allSteps = optionalSteps.map(s => s.step);
    const nextStepIndex = completedSteps.length;
    const nextStep = nextStepIndex < allSteps.length ? allSteps[nextStepIndex] : 'completed';
    
    // Map step names to screen names
    const stepToScreen: Record<string, string> = {
      'education': 'onboarding-education',
      'work': 'onboarding-work',
      'ethnicity': 'onboarding-ethnicity',
      'personality': 'onboarding-personality',
      'lifestyle': 'onboarding-lifestyle',
      'foodPreferences1': 'onboarding-food-preferences-1',
      'foodPreferences2': 'onboarding-food-preferences-2',
      'foodPreferences3': 'onboarding-food-preferences-3',
      'foodPreferences4': 'onboarding-food-preferences-4',
      'interests': 'onboarding-interests',
      'hobbies': 'onboarding-hobbies',
      'hopingToMeet': 'onboarding-hoping-to-meet',
      'interestingFact': 'onboarding-interesting-fact',
      'completed': 'completed'
    };
    
    const percentComplete = Math.round((completedSteps.length / allSteps.length) * 100);
    
    return res.json({
      success: true,
      canResume: completedSteps.length > 0 && completedSteps.length < allSteps.length,
      lastCompletedStep: completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : null,
      nextStep: nextStep,
      nextScreen: stepToScreen[nextStep],
      completedSteps: completedSteps,
      totalSteps: allSteps.length,
      percentComplete: percentComplete,
      message: completedSteps.length > 0 
        ? `You're ${percentComplete}% complete. Continue where you left off!`
        : 'Start your optional profile'
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;