import crypto from 'crypto';

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { privyClient } from '../config/privy';
import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const syncUserSchema = z.object({
  privyUserId: z.string(),
  email: z.string().email().optional(), // Make email optional for SMS auth
  phoneNumber: z.string().optional(), // Add phone number support
  walletAddress: z.string().optional(), // Wallet address from frontend
  name: z.string().optional(),
  authProvider: z.enum(['email', 'sms', 'google', 'apple']).optional(),
});

const verifyTokenSchema = z.object({
  token: z.string(),
});

/**
 * POST /api/auth/sync
 * Sync Privy user with Supabase database
 * This endpoint should be called after successful Privy authentication
 */
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = syncUserSchema.parse(req.body);

    // Log incoming data for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.info('Sync request received:', {
        privyUserId: validatedData.privyUserId,
        email: validatedData.email,
        walletAddress: validatedData.walletAddress,
        authProvider: validatedData.authProvider,
      });
    }

    // Check if user exists in Supabase by email or phone
    let existingUser = null;
    let fetchError = null;

    if (validatedData.email) {
      const result = await supabaseService
        .from('users')
        .select('id, email, phone, external_auth_id, wallet_address')
        .eq('email', validatedData.email.toLowerCase())
        .single();
      existingUser = result.data;
      fetchError = result.error;
    } else if (validatedData.phoneNumber) {
      // Normalize the phone for comparison (same format as we store)
      let normalizedPhone = validatedData.phoneNumber.replace(/[^\d+]/g, '');
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = `+${normalizedPhone}`;
      }
      const result = await supabaseService
        .from('users')
        .select('id, email, phone, external_auth_id, wallet_address')
        .eq('phone', normalizedPhone)
        .single();
      existingUser = result.data;
      fetchError = result.error;
    } else {
      // Check by Privy ID if no email or phone
      const result = await supabaseService
        .from('users')
        .select('id, email, phone, external_auth_id, wallet_address')
        .eq('external_auth_id', validatedData.privyUserId)
        .single();
      existingUser = result.data;
      fetchError = result.error;
    }

    let userId: string;
    let isNewUser = false;

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Failed to fetch user:', fetchError);
      throw new AppError('Failed to check existing user', 500);
    }

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;

      const updateData: Record<string, string> = {
        last_active_at: new Date().toISOString(),
      };

      // Always update external auth ID to ensure it's current
      // This handles cases where users were created before we had Privy
      updateData.external_auth_id = validatedData.privyUserId;

      // Update wallet address if provided and different
      if (
        validatedData.walletAddress &&
        validatedData.walletAddress !== existingUser.wallet_address
      ) {
        updateData.wallet_address = validatedData.walletAddress.toLowerCase();
        logger.info(`Updating wallet address for user ${userId}: ${validatedData.walletAddress}`);
      }

      logger.info(`Updating user ${userId} with:`, updateData);
      
      const { error: updateError } = await supabaseService
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        logger.error('Failed to update user:', updateError);
        throw new AppError('Failed to update user', 500);
      }

      logger.info(`Successfully updated user ${userId} with external_auth_id: ${updateData.external_auth_id}`);
    } else {
      // Before creating a new user, double-check by Privy ID to prevent race conditions
      const { data: privyCheck } = await supabaseService
        .from('users')
        .select('id')
        .eq('external_auth_id', validatedData.privyUserId)
        .single();

      if (privyCheck) {
        // User was created by another concurrent request
        userId = privyCheck.id;
        isNewUser = false;
        logger.info(`Found user created by concurrent request: ${userId}`);
      } else {
        // Create new user
        isNewUser = true;
        userId = crypto.randomUUID();

        // Map auth provider to database enum values
        const mapAuthProvider = (provider?: string) => {
          switch (provider) {
            case 'google':
              return 'google';
            case 'apple':
              return 'apple';
            case 'sms':
              return 'sms';
            case 'email':
            default:
              return 'email'; // Now database accepts 'email' directly
          }
        };

        // Helper function to normalize phone number
        const normalizePhone = (phone: string) => {
          // Remove all non-digit characters except the leading +
          let normalized = phone.replace(/[^\d+]/g, '');
          // Ensure it starts with + for international format
          if (!normalized.startsWith('+')) {
            normalized = `+${normalized}`;
          }
          return normalized;
        };

        const userData: Record<string, string | boolean | null> = {
          id: userId,
          email: validatedData.email ? validatedData.email.toLowerCase() : null,
          phone: validatedData.phoneNumber ? normalizePhone(validatedData.phoneNumber) : null,
          wallet_address: validatedData.walletAddress
            ? validatedData.walletAddress.toLowerCase()
            : null,
          first_name: null, // Let user fill during onboarding
          last_name: null, // Let user fill during onboarding
          display_name: null, // Let user fill during onboarding
          auth_provider: mapAuthProvider(validatedData.authProvider),
          external_auth_id: validatedData.privyUserId,
          status: 'active',
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (validatedData.walletAddress) {
          logger.info(`Creating user with wallet address: ${validatedData.walletAddress}`);
        }

        // Only set email_verified_at if email exists
        if (validatedData.email) {
          userData.email_verified_at = new Date().toISOString();
        }

        // Set phone_verified_at if phone exists
        if (validatedData.phoneNumber) {
          userData.phone_verified_at = new Date().toISOString();
        }

        const { error: createError } = await supabaseService.from('users').insert(userData);

        if (createError) {
          // Check if it's a duplicate key error
          if (createError.code === '23505' && createError.message.includes('external_auth_id')) {
            logger.warn('User with this Privy ID already exists, fetching existing user');
            // User already exists with this external_auth_id, fetch them instead
            const { data: existingUser } = await supabaseService
              .from('users')
              .select('id')
              .eq('external_auth_id', validatedData.privyUserId)
              .single();

            if (existingUser) {
              userId = existingUser.id;
              isNewUser = false;
            } else {
              throw new AppError('Failed to create or find user', 500);
            }
          } else {
            logger.error('Failed to create user:', {
              error: createError,
              userData,
              message: createError.message,
              details: createError.details,
              hint: createError.hint,
              code: createError.code,
            });
            throw new AppError(`Failed to create user account: ${createError.message}`, 500);
          }
        }

        // Create user profile (only for new users)
        if (isNewUser) {
          const { error: profileError } = await supabaseService.from('user_profiles').insert({
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (profileError && profileError.code !== '23505') {
            logger.error('Failed to create user profile:', profileError);
          }

          logger.info(`Created new user: ${userId} with Privy ID: ${validatedData.privyUserId}`);
        }
      } // Close the else block for creating new user
    }

    // Fetch complete user data to return
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.error('Failed to fetch user data:', userError);
      throw new AppError('Failed to fetch user data', 500);
    }

    // Log successful sync
    logger.info(`User sync successful:`, {
      userId: userData.id,
      privyUserId: userData.external_auth_id,
      authProvider: userData.auth_provider,
      isNewUser,
    });

    res.json({
      success: true,
      data: {
        user: userData,
        isNewUser,
        needsOnboarding: !userData.onboarding_completed,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify
 * Verify a Privy authentication token
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = verifyTokenSchema.parse(req.body);

    try {
      const verifiedClaims = await privyClient.verifyAuthToken(token);

      res.json({
        success: true,
        data: {
          userId: verifiedClaims.userId,
          user: {
            id: verifiedClaims.userId,
          },
        },
      });
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user's data
 */
router.get('/me', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    logger.info('GET /auth/me - Looking for user:', {
      privyId: req.userId,
      email: req.user?.email,
    });

    // Get user from Supabase using Privy ID
    // Try multiple strategies to find the user
    let user = null;
    let error = null;

    // First try with the ID as-is
    const result1 = await supabaseService
      .from('users')
      .select('*')
      .eq('external_auth_id', req.userId)
      .single();

    user = result1.data;
    error = result1.error;
    
    if (user) {
      logger.info('Found user by external_auth_id:', user.id);
    }

    // If not found and ID doesn't start with did:privy:, try adding the prefix
    if (error && !req.userId.startsWith('did:privy:')) {
      const result2 = await supabaseService
        .from('users')
        .select('*')
        .eq('external_auth_id', `did:privy:${req.userId}`)
        .single();

      user = result2.data;
      error = result2.error;
    }

    // If still not found and we have user email from token, try finding by email
    if (error && req.user?.email) {
      const result3 = await supabaseService
        .from('users')
        .select('*')
        .eq('email', req.user.email.toLowerCase())
        .single();

      if (result3.data) {
        user = result3.data;
        error = null;
        
        // Update the external_auth_id for future lookups
        await supabaseService
          .from('users')
          .update({ external_auth_id: req.userId })
          .eq('id', user.id);
      }
    }

    if (error || !user) {
      logger.warn(`User not found for Privy ID: ${req.userId}, email: ${req.user?.email}`);
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user,
        privyUser: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', verifyPrivyToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user from database using Privy ID
    // Try both with and without did:privy: prefix
    let user = null;
    let fetchError = null;

    // First try with the ID as-is
    const result1 = await supabaseService
      .from('users')
      .select('id, external_auth_id')
      .eq('external_auth_id', req.userId)
      .single();

    user = result1.data;
    fetchError = result1.error;

    // If not found and ID doesn't start with did:privy:, try adding the prefix
    if (fetchError && !req.userId.startsWith('did:privy:')) {
      const result2 = await supabaseService
        .from('users')
        .select('id, external_auth_id')
        .eq('external_auth_id', `did:privy:${req.userId}`)
        .single();

      user = result2.data;
      fetchError = result2.error;
    }

    if (fetchError || !user) {
      logger.error('User not found in database:', {
        privyUserId: req.userId,
        error: fetchError,
      });
      throw new AppError('User not found', 404);
    }

    // Validate profile data
    const profileSchema = z.object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
      display_name: z.string().min(1).optional(),
      onboarding_completed: z.boolean().optional(),
    });

    const validatedData = profileSchema.parse(req.body);

    // Prepare update data
    const updateData: Record<string, string | boolean> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.first_name !== undefined) {
      updateData.first_name = validatedData.first_name;
    }
    if (validatedData.last_name !== undefined) {
      updateData.last_name = validatedData.last_name;
    }
    if (validatedData.display_name !== undefined) {
      updateData.display_name = validatedData.display_name;
    }
    if (validatedData.onboarding_completed !== undefined) {
      updateData.onboarding_completed = validatedData.onboarding_completed;
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabaseService
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update user profile:', updateError);
      throw new AppError('Failed to update profile', 500);
    }

    logger.info(`Updated profile for user: ${user.id}`);

    res.json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
