import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';

import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  displayName: z.string().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  birthday: z.string().optional(), // Date string in ISO format
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  foodPreferences: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  lifestyleChoices: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional(),
});

/**
 * GET /api/users/me
 * Get current user's complete profile
 */
router.get('/me', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // First try to find by external_auth_id
    let { data: user, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('external_auth_id', req.userId)
      .single();

    // If not found and we have email, try by email
    if ((error || !user) && req.user?.email) {
      const emailResult = await supabaseService
        .from('users')
        .select('*')
        .eq('email', req.user.email)
        .single();
        
      user = emailResult.data;
      error = emailResult.error;
      
      // Update external_auth_id if we found the user by email
      if (user && !user.external_auth_id) {
        await supabaseService
          .from('users')
          .update({ external_auth_id: req.userId })
          .eq('id', user.id);
      }
    }

    if (error || !user) {
      logger.error('User not found:', { userId: req.userId, email: req.user?.email, error });
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId
 * Get user profile by ID
 */
router.get('/:userId', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Only return sensitive data if requesting own profile
    const isOwnProfile = req.user && user.external_auth_id === req.userId;

    if (!isOwnProfile) {
      // Remove sensitive fields for other users
      delete user.email;
      delete user.external_auth_id;
      delete user.last_active_at;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const validatedData = updateProfileSchema.parse(req.body);

    // Get user from database - try external_auth_id first, then email
    let { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    // If not found and we have email, try by email
    if ((userError || !user) && req.user?.email) {
      const emailResult = await supabaseService
        .from('users')
        .select('id')
        .eq('email', req.user.email)
        .single();
        
      user = emailResult.data;
      userError = emailResult.error;
      
      // Update external_auth_id if we found the user by email
      if (user) {
        await supabaseService
          .from('users')
          .update({ external_auth_id: req.userId })
          .eq('id', user.id);
      }
    }

    if (userError || !user) {
      logger.error('User not found for profile update:', { userId: req.userId, email: req.user?.email, error: userError });
      throw new AppError('User not found', 404);
    }

    // Update user table fields
    const userUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.firstName !== undefined) userUpdates.first_name = validatedData.firstName;
    if (validatedData.lastName !== undefined) userUpdates.last_name = validatedData.lastName;
    // Use display_name for nickname until we add the column
    if (validatedData.nickname !== undefined) userUpdates.display_name = validatedData.nickname;
    if (validatedData.displayName !== undefined) userUpdates.display_name = validatedData.displayName;
    if (validatedData.gender !== undefined) userUpdates.gender = validatedData.gender;
    if (validatedData.birthday !== undefined) userUpdates.birthday = validatedData.birthday;
    // These fields will be added via migration
    // For now, comment them out to avoid errors
    // if (validatedData.bio !== undefined) userUpdates.bio = validatedData.bio;
    // if (validatedData.jobTitle !== undefined) userUpdates.job_title = validatedData.jobTitle;
    // if (validatedData.company !== undefined) userUpdates.company = validatedData.company;
    // if (validatedData.foodPreferences !== undefined) userUpdates.food_preferences = JSON.stringify(validatedData.foodPreferences);
    // if (validatedData.dietaryRestrictions !== undefined) userUpdates.dietary_restrictions = JSON.stringify(validatedData.dietaryRestrictions);
    // if (validatedData.lifestyleChoices !== undefined) userUpdates.lifestyle_choices = JSON.stringify(validatedData.lifestyleChoices);
    // if (validatedData.interests !== undefined) userUpdates.interests = JSON.stringify(validatedData.interests);

    const { error: updateUserError } = await supabaseService
      .from('users')
      .update(userUpdates)
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('Failed to update user:', updateUserError);
      throw new AppError('Failed to update user profile', 500);
    }

    // Fetch updated user data
    const { data: updatedUser, error: fetchError } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch updated user:', fetchError);
      throw new AppError('Failed to fetch updated user', 500);
    }

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/account
 * Delete user account (soft delete)
 */
router.delete('/account', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
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

    // Soft delete user (set status to inactive)
    const { error: deleteError } = await supabaseService
      .from('users')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (deleteError) {
      logger.error('Failed to delete user:', deleteError);
      throw new AppError('Failed to delete user account', 500);
    }

    // Deactivate all wallets
    await supabaseService
      .from('wallets')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    logger.info(`User account deleted: ${user.id}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/search
 * Search users by name or email (authenticated only)
 */
router.get('/search', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('Search query is required', 400);
    }

    const searchTerm = `%${q}%`;

    const { data: users, error } = await supabaseService
      .from('users')
      .select('id, first_name, last_name, display_name, avatar_url')
      .or(`display_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .eq('status', 'active')
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      logger.error('Search failed:', error);
      throw new AppError('Search failed', 500);
    }

    res.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
