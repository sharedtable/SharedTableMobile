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

    // Prepare updates based on step
    const userUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const profileUpdates: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    switch (step) {
      case 'name':
        userUpdates.first_name = validatedData.firstName;
        userUpdates.last_name = validatedData.lastName;
        userUpdates.display_name = validatedData.nickname;
        break;
      case 'birthday':
        profileUpdates.birth_date = validatedData.birthDate;
        break;
      case 'gender':
        profileUpdates.gender = validatedData.gender;
        break;
    }

    // Update user table if needed
    if (Object.keys(userUpdates).length > 1) {
      const { error: updateUserError } = await supabaseService
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (updateUserError) {
        logger.error('Failed to update user during onboarding:', updateUserError);
        throw new AppError('Failed to save onboarding data', 500);
      }
    }

    // Update profile table if needed
    if (Object.keys(profileUpdates).length > 2) {
      const { error: updateProfileError } = await supabaseService
        .from('user_profiles')
        .upsert(profileUpdates);

      if (updateProfileError) {
        logger.error('Failed to update profile during onboarding:', updateProfileError);
        throw new AppError('Failed to save onboarding data', 500);
      }
    }

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
 * Complete the onboarding process with all required data
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
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Update user table
    const { error: updateUserError } = await supabaseService
      .from('users')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        display_name: validatedData.nickname,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('Failed to update user during onboarding:', updateUserError);
      throw new AppError('Failed to complete onboarding', 500);
    }

    // Update user_profiles table
    const { error: updateProfileError } = await supabaseService
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        birth_date: validatedData.birthDate,
        gender: validatedData.gender,
        updated_at: new Date().toISOString(),
      });

    if (updateProfileError) {
      logger.error('Failed to update profile during onboarding:', updateProfileError);
      throw new AppError('Failed to complete onboarding', 500);
    }

    logger.info(`User ${user.id} completed onboarding`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/status
 * Check if user has completed onboarding
 */
router.get('/status', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { data: user, error } = await supabaseService
      .from('users')
      .select('id, onboarding_completed_at')
      .eq('external_auth_id', req.userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      completed: !!user.onboarding_completed_at,
      completedAt: user.onboarding_completed_at,
    });
  } catch (error) {
    next(error);
  }
});

export default router;