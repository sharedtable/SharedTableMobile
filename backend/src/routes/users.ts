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
  displayName: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
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
      .select(
        `
        *,
        user_profiles (*)
      `
      )
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

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Update user table fields
    const userUpdates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.firstName) userUpdates.first_name = validatedData.firstName;
    if (validatedData.lastName) userUpdates.last_name = validatedData.lastName;
    if (validatedData.displayName) userUpdates.display_name = validatedData.displayName;

    const { error: updateUserError } = await supabaseService
      .from('users')
      .update(userUpdates)
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('Failed to update user:', updateUserError);
      throw new AppError('Failed to update user profile', 500);
    }

    // Update user_profiles table
    const profileUpdates: Record<string, string | Record<string, unknown>> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.bio) profileUpdates.bio = validatedData.bio;
    if (validatedData.avatarUrl) profileUpdates.avatar_url = validatedData.avatarUrl;
    if (validatedData.preferences) profileUpdates.preferences = validatedData.preferences;

    // Upsert profile (create if doesn't exist)
    const { error: updateProfileError } = await supabaseService.from('onboarding_profiles').upsert({
      user_id: user.id,
      ...profileUpdates,
    });

    if (updateProfileError) {
      logger.error('Failed to update user profile:', updateProfileError);
      throw new AppError('Failed to update user profile', 500);
    }

    // Fetch updated user data
    const { data: updatedUser, error: fetchError } = await supabaseService
      .from('users')
      .select(
        `
        *,
        user_profiles (*)
      `
      )
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
