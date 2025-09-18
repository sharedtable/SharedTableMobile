import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';

import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Onboarding step schemas
const nameStepSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  nickname: z.string().min(1).max(30),
});

const birthdayStepSchema = z.object({
  birthDate: z.string().refine((date) => {
    const parsed = new Date(date);
    const age = new Date().getFullYear() - parsed.getFullYear();
    return age >= 16 && age <= 100;
  }, 'Age must be between 16 and 100 years'),
});

const genderStepSchema = z.object({
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
});

// Complete onboarding schema (only required fields)
const completeOnboardingSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  nickname: z.string().min(1).max(30),
  birthDate: z.string(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
});

/**
 * POST /api/onboarding/step
 * Save a single onboarding step
 */
router.post('/step', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { step, data } = req.body;

    if (!step || !data) {
      throw new AppError('Step and data are required', 400);
    }

    logger.info(`📍 [ONBOARDING STEP START] Processing step: ${step}`, {
      userId: req.userId,
      dataKeys: Object.keys(data || {}),
      dataValues: data,
    });

    // Validate step data based on step name
    let validatedData: any;
    switch (step) {
      case 'name':
        validatedData = nameStepSchema.parse(data);
        break;
      case 'birthday':
        validatedData = birthdayStepSchema.parse(data);
        break;
      case 'gender':
        validatedData = genderStepSchema.parse(data);
        break;
      // Optional profile questions - pass through validation for now
      case 'education':
      case 'work':
      case 'background':
      case 'ethnicity': // Alternative name for background
      case 'personality':
      case 'lifestyle':
      case 'foodPreferences': // New food preferences step
      case 'interests':
      case 'finalTouch': // New final touch questions
        validatedData = data; // Accept any data for optional fields
        break;
      default:
        throw new AppError(`Invalid onboarding step: ${step}`, 400);
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Prepare updates - SIMPLIFIED VERSION
    const userUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Prepare updates for onboarding_profiles table
    const profileUpdates: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Log exactly what data we received
    logger.info(`📦 [RAW DATA] Received for step ${step}:`, {
      validatedData,
      dataKeys: Object.keys(validatedData || {}),
      userId: user.id,
    });

    // Simple direct mapping to user_info table
    switch (step) {
      case 'name':
        userUpdates.first_name = validatedData.firstName;
        userUpdates.last_name = validatedData.lastName;
        userUpdates.display_name = validatedData.nickname;
        break;
        
      case 'birthday':
        // Birth date stays in users table for mandatory fields
        userUpdates.birthday = validatedData.birthDate;
        break;
        
      case 'gender':
        // Gender stays in users table for mandatory fields
        userUpdates.gender = validatedData.gender;
        break;
        
      case 'education':
      case 'work':
        // Map to onboarding_profiles columns
        if (validatedData.educationLevel) profileUpdates.education_level = validatedData.educationLevel;
        if (validatedData.fieldOfStudy) profileUpdates.field_of_study = validatedData.fieldOfStudy;
        if (validatedData.school) profileUpdates.school = validatedData.school;
        if (validatedData.jobTitle) profileUpdates.job_title = validatedData.jobTitle;
        if (validatedData.lineOfWork) profileUpdates.industry = validatedData.lineOfWork;
        if (validatedData.occupation) profileUpdates.job_title = validatedData.occupation; // Map to job_title since occupation column removed
        if (validatedData.company) profileUpdates.company = validatedData.company;
        break;
        
      case 'background':
      case 'ethnicity':
        // Map background/ethnicity to onboarding_profiles
        if (validatedData.ethnicity) profileUpdates.ethnicity = validatedData.ethnicity;
        if (validatedData.nationality) profileUpdates.nationality = validatedData.nationality;
        if (validatedData.religion) profileUpdates.religion = validatedData.religion;
        if (validatedData.relationshipStatus) profileUpdates.relationship_status = validatedData.relationshipStatus;
        if (validatedData.heightFeet !== undefined || validatedData.heightInches !== undefined) {
          const feet = parseInt(validatedData.heightFeet, 10) || 0;
          const inches = parseInt(validatedData.heightInches, 10) || 0;
          profileUpdates.height = (feet * 12) + inches;
        }
        break;
        
      case 'personality':
        // Map personality to onboarding_profiles
        if (validatedData.personalityTraits) profileUpdates.personality_traits = Array.isArray(validatedData.personalityTraits) ? validatedData.personalityTraits : [validatedData.personalityTraits];
        if (validatedData.mbti || validatedData.mbtiType) profileUpdates.mbti_type = validatedData.mbti || validatedData.mbtiType;
        if (validatedData.leadConversations !== undefined) profileUpdates.lead_conversations = validatedData.leadConversations;
        if (validatedData.willingCompromise !== undefined) profileUpdates.willing_compromise = validatedData.willingCompromise;
        if (validatedData.seekExperiences !== undefined) profileUpdates.seek_experiences = validatedData.seekExperiences;
        if (validatedData.roles) profileUpdates.roles = Array.isArray(validatedData.roles) ? validatedData.roles : [validatedData.roles];
        if (validatedData.conversationStyle) profileUpdates.conversation_style = validatedData.conversationStyle;
        break;
        
      case 'lifestyle':
        // Map lifestyle to onboarding_profiles
        if (validatedData.earlyBirdNightOwl !== undefined) profileUpdates.early_bird_night_owl = validatedData.earlyBirdNightOwl;
        if (validatedData.activePerson !== undefined) profileUpdates.active_person = validatedData.activePerson;
        if (validatedData.punctuality !== undefined) profileUpdates.punctuality = validatedData.punctuality;
        if (validatedData.workLifeBalance !== undefined) profileUpdates.work_life_balance = validatedData.workLifeBalance;
        if (validatedData.substances) profileUpdates.substances = Array.isArray(validatedData.substances) ? validatedData.substances : [validatedData.substances];
        break;
        
      case 'interests':
        // Map interests to onboarding_profiles
        if (validatedData.interests) profileUpdates.interests = Array.isArray(validatedData.interests) ? validatedData.interests : [validatedData.interests];
        if (validatedData.hobbies) profileUpdates.hobbies = Array.isArray(validatedData.hobbies) ? validatedData.hobbies : [validatedData.hobbies];
        break;
        
      case 'foodPreferences':
        // Map food preferences to onboarding_profiles
        if (validatedData.dietaryRestrictions) profileUpdates.dietary_restrictions = validatedData.dietaryRestrictions;
        if (validatedData.budget !== undefined) profileUpdates.food_budget = validatedData.budget;
        if (validatedData.spicyLevel !== undefined) profileUpdates.spicy_level = validatedData.spicyLevel;
        if (validatedData.drinkingLevel !== undefined) profileUpdates.drinking_level = validatedData.drinkingLevel;
        if (validatedData.adventurousLevel !== undefined) profileUpdates.adventurous_level = validatedData.adventurousLevel;
        if (validatedData.diningAtmospheres) profileUpdates.dining_atmospheres = Array.isArray(validatedData.diningAtmospheres) ? validatedData.diningAtmospheres : [validatedData.diningAtmospheres];
        if (validatedData.dinnerDuration) profileUpdates.dinner_duration = validatedData.dinnerDuration;
        if (validatedData.zipCode) profileUpdates.zipcode = validatedData.zipCode;
        if (validatedData.travelDistance !== undefined) profileUpdates.travel_distance = validatedData.travelDistance;
        if (validatedData.foodCraving) profileUpdates.food_craving = validatedData.foodCraving;
        if (validatedData.cuisinesToTry) profileUpdates.cuisines_to_try = Array.isArray(validatedData.cuisinesToTry) ? validatedData.cuisinesToTry : [validatedData.cuisinesToTry];
        if (validatedData.cuisinesToAvoid) profileUpdates.cuisines_to_avoid = Array.isArray(validatedData.cuisinesToAvoid) ? validatedData.cuisinesToAvoid : [validatedData.cuisinesToAvoid];
        break;
        
      case 'finalTouch':
        // Map final touch to onboarding_profiles
        if (validatedData.hopingToMeet) profileUpdates.hoping_to_meet = validatedData.hopingToMeet;
        if (validatedData.interestingFact) profileUpdates.interesting_fact = validatedData.interestingFact;
        break;
    }

    logger.info(`📝 [PROFILE UPDATES] Prepared for step ${step}:`, {
      profileUpdates,
      updateCount: Object.keys(profileUpdates).length,
      userId: user.id,
    });

    // Update user table if needed
    if (Object.keys(userUpdates).length > 1) {
      logger.info(`Updating user table for step ${step}:`, userUpdates);
      const { error: updateUserError } = await supabaseService
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (updateUserError) {
        logger.error('Failed to update user during onboarding:', updateUserError);
        throw new AppError('Failed to save onboarding data', 500);
      }
    }

    // Update or create onboarding_profiles if we have optional data
    // Note: We always have user_id and updated_at, so check for > 2 means we have actual data
    const hasActualData = Object.keys(profileUpdates).length > 2;
    logger.info(`🔍 [PROFILE CHECK] Checking if save needed:`, {
      updateCount: Object.keys(profileUpdates).length,
      hasData: hasActualData,
      fields: Object.keys(profileUpdates),
      step,
    });
    
    if (hasActualData) {
      // First check if onboarding_profiles exists
      const { data: existingInfo, error: checkError } = await supabaseService
        .from('onboarding_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('Error checking existing user_info:', checkError);
      }
      
      logger.info(`🔄 [PROFILE SAVE] ${existingInfo ? 'UPDATING' : 'CREATING'} record for step ${step}:`, {
        exists: !!existingInfo,
        userId: user.id,
        fieldsToSave: Object.keys(profileUpdates),
        data: profileUpdates,
      });
      
      let updateInfoError;
      if (existingInfo) {
        // Update existing onboarding_profiles
        const { error } = await supabaseService
          .from('onboarding_profiles')
          .update(profileUpdates)
          .eq('user_id', user.id);
        updateInfoError = error;
      } else {
        // Insert new onboarding_profiles - ensure created_at is set
        profileUpdates.created_at = new Date().toISOString();
        const { error } = await supabaseService
          .from('onboarding_profiles')
          .insert(profileUpdates);
        updateInfoError = error;
      }

      if (updateInfoError) {
        logger.error('Failed to update onboarding_profiles during onboarding:', {
          error: updateInfoError,
          step,
          userId: user.id,
          profileData: profileUpdates,
          errorCode: updateInfoError.code,
          errorMessage: updateInfoError.message,
          errorDetails: updateInfoError.details,
        });
        throw new AppError('Failed to save onboarding data', 500);
      }
      logger.info(`✅ [PROFILE SAVED] Successfully saved data for step ${step}`, {
        userId: user.id,
        fieldsUpdated: Object.keys(profileUpdates),
        operation: existingInfo ? 'UPDATE' : 'INSERT',
      });
    } else {
      logger.info(`⏭️ [PROFILE SKIPPED] No profile data to save for step ${step}`, {
        userId: user.id,
        updateCount: Object.keys(profileUpdates).length,
        fields: Object.keys(profileUpdates),
      });
    }

    logger.info(`🎉 [ONBOARDING STEP COMPLETE] Step '${step}' completed successfully`, {
      userId: user.id,
      profileSaved: Object.keys(profileUpdates).length > 2,
    });
    
    res.json({
      success: true,
      message: `Onboarding step '${step}' saved successfully`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/complete
 * Complete the mandatory onboarding stage
 */
router.post('/complete', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const validatedData = completeOnboardingSchema.parse(req.body);

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, onboarding_status')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Update user table with mandatory fields and status
    const { error: updateUserError } = await supabaseService
      .from('users')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        display_name: validatedData.nickname,
        birthday: validatedData.birthDate,
        gender: validatedData.gender,
        onboarding_status: 'mandatory_complete',
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('Failed to update user during onboarding:', updateUserError);
      throw new AppError('Failed to complete onboarding', 500);
    }

    // For mandatory fields, we'll store birth_date and gender in the users table
    // We could also create an initial onboarding_profiles record here if needed
    // But for now, we'll just track that mandatory onboarding is complete

    logger.info(`User ${user.id} completed mandatory onboarding`);

    res.json({
      success: true,
      message: 'Mandatory onboarding completed successfully',
      status: 'mandatory_complete',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/profile
 * Get user's profile data for debugging
 */
router.get('/profile', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user data
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, external_auth_id, first_name, last_name, onboarding_status')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      return res.json({
        success: false,
        error: 'User not found',
        privyId: req.userId,
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseService
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile && typeof profile.height === 'number' && profile.height > 0) {
      profile.height_feet = Math.floor(profile.height / 12);
      profile.height_inches = profile.height % 12;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        external_auth_id: user.external_auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        onboarding_status: user.onboarding_status,
      },
      profile: profile || null,
      profileExists: !!profile,
      profileError: profileError?.message || null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/status
 * Check user's onboarding completion status (mandatory vs optional)
 */
router.get('/status', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user data including onboarding_status
    const { data: user, error } = await supabaseService
      .from('users')
      .select('id, onboarding_status, onboarding_completed_at, first_name, last_name, display_name')
      .eq('external_auth_id', req.userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Get user profile to check optional fields
    const { data: profile } = await supabaseService
      .from('onboarding_profiles')
      .select('birth_date, gender, interests, dietary_preferences, job_title, field_of_study')
      .eq('user_id', user.id)
      .single();

    // Use the stored onboarding_status if available, otherwise determine from fields
    let status = user.onboarding_status || 'not_started';
    
    // Validate the status matches actual data (in case of inconsistencies)
    // Check mandatory fields (first_name, last_name, birth_date, gender)
    const hasMandatoryFields = !!(
      user.first_name && 
      user.last_name && 
      profile?.birth_date && 
      profile?.gender
    );
    
    // Check optional profile fields
    const hasOptionalFields = !!(
      profile?.interests?.length ||
      profile?.dietary_preferences?.length ||
      profile?.job_title ||
      profile?.field_of_study
    );
    
    // Check dining preference fields
    const hasDiningPreferences = !!(
      (profile as any)?.cuisine_preferences?.length ||
      (profile as any)?.dining_frequency ||
      (profile as any)?.meal_preferences?.length ||
      (profile as any)?.budget_preference ||
      (profile as any)?.ambiance_preferences?.length ||
      (profile as any)?.dining_goals?.length
    );

    // Determine actual status based on completed fields
    if (hasMandatoryFields && hasOptionalFields && hasDiningPreferences) {
      status = 'fully_complete';
    } else if (hasMandatoryFields && hasOptionalFields) {
      status = 'optional_complete';
    } else if (hasMandatoryFields) {
      status = 'mandatory_complete';
    } else {
      status = 'not_started';
    }

    res.json({
      success: true,
      status,
      mandatoryComplete: hasMandatoryFields,
      optionalComplete: hasOptionalFields,
      completedAt: user.onboarding_completed_at,
      missingFields: {
        mandatory: {
          firstName: !user.first_name,
          lastName: !user.last_name,
          birthDate: !profile?.birth_date,
          gender: !profile?.gender,
        },
        optional: {
          interests: !profile?.interests?.length,
          dietaryPreferences: !profile?.dietary_preferences?.length,
          jobTitle: !profile?.job_title,
          fieldOfStudy: !profile?.field_of_study,
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/update-status
 * Update user's onboarding status
 */
router.post('/update-status', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['not_started', 'mandatory_complete', 'optional_complete', 'fully_complete'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid onboarding status', 400);
    }

    // Prepare update data
    const updateData: any = {
      onboarding_status: status,
      updated_at: new Date().toISOString(),
    };
    
    // If marking as fully complete, set completion timestamp
    if (status === 'fully_complete') {
      updateData.onboarding_completed_at = new Date().toISOString();
    }
    
    // Update user status
    const { error } = await supabaseService
      .from('users')
      .update(updateData)
      .eq('external_auth_id', req.userId);

    if (error) {
      logger.error('Failed to update onboarding status:', error);
      throw new AppError('Failed to update status', 500);
    }
    
    // Also update user_info table status
    const { data: user } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();
      
    if (user) {
      await supabaseService
        .from('onboarding_profiles')
        .update({
          onboarding_status: status,
          onboarding_completed_at: status === 'fully_complete' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    logger.info(`User ${req.userId} onboarding status updated to: ${status}`);

    res.json({
      success: true,
      status,
      message: `Onboarding status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/test-save
 * Direct test endpoint to save optional data to user_info
 */
router.post('/test-save', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { data: user } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Direct save to user_info with exact field names
    const userInfoData = {
      user_id: user.id,
      education_level: req.body.educationLevel || 'bachelor',
      field_of_study: req.body.fieldOfStudy || 'Computer Science',
      school: req.body.school || 'Stanford University',
      job_title: req.body.jobTitle || 'Software Engineer',
      line_of_work: req.body.lineOfWork || 'Technology',
      company: req.body.company || 'Tech Company',
      hometown: req.body.hometown || 'San Francisco',
      updated_at: new Date().toISOString(),
    };

    logger.info('TEST SAVE - User info data:', userInfoData);

    // Check if user_info exists
    const { data: existing } = await supabaseService
      .from('onboarding_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabaseService
        .from('onboarding_profiles')
        .update(userInfoData)
        .eq('user_id', user.id)
        .select();
      result = { data, error };
      logger.info('TEST SAVE - Update result:', { data, error });
    } else {
      // Insert
      (userInfoData as any).created_at = new Date().toISOString();
      const { data, error } = await supabaseService
        .from('onboarding_profiles')
        .insert(userInfoData)
        .select();
      result = { data, error };
      logger.info('TEST SAVE - Insert result:', { data, error });
    }

    if (result.error) {
      logger.error('TEST SAVE - Failed:', result.error);
      throw new AppError('Failed to save test data', 500);
    }

    res.json({
      success: true,
      message: 'Test save to user_info successful',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/dining-preferences
 * Save user's dining preferences
 */
router.post('/dining-preferences', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      cuisinePreferences,
      diningFrequency,
      mealPreferences,
      budgetPreference,
      ambiancePreferences,
      diningGoals,
      availabilityPreferences,
    } = req.body;

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, onboarding_status')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Update user_info with dining preferences
    const { error: updateInfoError } = await supabaseService
      .from('onboarding_profiles')
      .upsert({
        user_id: user.id,
        cuisine_preferences: cuisinePreferences || [],
        dining_frequency: diningFrequency,
        meal_preferences: mealPreferences || [],
        budget_preference: budgetPreference,
        ambiance_preferences: ambiancePreferences || [],
        dining_goals: diningGoals || [],
        availability_preferences: availabilityPreferences || [],
        updated_at: new Date().toISOString(),
      });

    if (updateInfoError) {
      logger.error('Failed to update dining preferences:', updateInfoError);
      throw new AppError('Failed to save dining preferences', 500);
    }

    // Update onboarding status to fully complete after dining preferences
    let newStatus = 'fully_complete';

    if (newStatus !== user.onboarding_status) {
      await supabaseService
        .from('users')
        .update({
          onboarding_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    logger.info(`User ${user.id} saved dining preferences`);

    res.json({
      success: true,
      message: 'Dining preferences saved successfully',
      status: newStatus,
    });
  } catch (error) {
    next(error);
  }
});

export default router;