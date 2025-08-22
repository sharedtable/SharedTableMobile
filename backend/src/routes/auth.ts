import crypto from 'crypto';

import { Router } from 'express';
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
  email: z.string().email(),
  name: z.string().optional(),
  walletAddress: z.string().optional(),
  authProvider: z.enum(['email', 'sms', 'google', 'apple']).optional(),
});

const verifyTokenSchema = z.object({
  token: z.string(),
});

/**
 * POST /api/auth/sync
 * Sync Privy user with Supabase database
 * This endpoint should be called after successful Privy authentication
 * Note: This endpoint doesn't require authentication as it's called during the login process
 */
router.post('/sync', async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = syncUserSchema.parse(req.body);

    // Log the incoming request for debugging (only in dev)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Sync user request:', {
        privyUserId: validatedData.privyUserId,
        email: validatedData.email,
        authProvider: validatedData.authProvider,
      });
    }

    // Skip Privy verification for now - we trust the frontend has authenticated
    // In production, you'd want to verify the auth token instead
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Sync request for Privy user:', validatedData.privyUserId);
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: fetchError } = await supabaseService
      .from('users')
      .select('id, email, external_auth_id')
      .eq('email', validatedData.email.toLowerCase())
      .single();

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

      // Update external auth ID if not set
      if (!existingUser.external_auth_id) {
        updateData.external_auth_id = validatedData.privyUserId;
      }

      const { error: updateError } = await supabaseService
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        logger.error('Failed to update user:', updateError);
        throw new AppError('Failed to update user', 500);
      }

      logger.info(`Updated existing user: ${userId}`);
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

      const userData = {
        id: userId,
        email: validatedData.email.toLowerCase(),
        first_name: null, // Let user fill during onboarding
        last_name: null, // Let user fill during onboarding
        display_name: null, // Let user fill during onboarding
        auth_provider: mapAuthProvider(validatedData.authProvider),
        external_auth_id: validatedData.privyUserId,
        status: 'active',
        email_verified_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: createError } = await supabaseService.from('users').insert(userData);

      if (createError) {
        logger.error('Failed to create user:', createError);
        throw new AppError('Failed to create user account', 500);
      }

      // Create user profile
      const { error: profileError } = await supabaseService.from('user_profiles').insert({
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError && profileError.code !== '23505') {
        logger.error('Failed to create user profile:', profileError);
      }

      logger.info(`Created new user: ${userId}`);
    }

    // Sync wallet if provided
    if (validatedData.walletAddress) {
      await syncWallet(userId, validatedData.walletAddress);
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

    res.json({
      success: true,
      data: {
        user: userData,
        isNewUser,
        needsOnboarding: !userData.onboarding_completed, // Check actual database field
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
router.post('/verify', async (req, res, next) => {
  try {
    const { token } = verifyTokenSchema.parse(req.body);

    try {
      const verifiedClaims = await privyClient.verifyAuthToken(token);
      const user = await privyClient.getUser(verifiedClaims.userId);

      res.json({
        success: true,
        data: {
          userId: verifiedClaims.userId,
          user,
        },
      });
    } catch (error) {
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
router.get('/me', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user from Supabase using Privy ID
    const { data: user, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('external_auth_id', req.userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Get user's wallets
    const { data: wallets } = await supabaseService
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    res.json({
      success: true,
      data: {
        user,
        wallets: wallets || [],
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
router.put('/profile', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user from database using Privy ID
    const { data: user, error: fetchError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (fetchError || !user) {
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

/**
 * Helper function to sync wallet
 */
async function syncWallet(userId: string, walletAddress: string) {
  try {
    // Check if wallet exists
    const { data: existingWallet, error: fetchError } = await supabaseService
      .from('wallets')
      .select('id, updated_at')
      .eq('user_id', userId)
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Failed to fetch wallet:', fetchError);
      return;
    }

    if (existingWallet) {
      // If wallet was updated in the last 10 seconds, skip (prevent duplicate syncs)
      const lastUpdated = new Date(existingWallet.updated_at);
      const now = new Date();
      const timeDiff = (now.getTime() - lastUpdated.getTime()) / 1000;

      if (timeDiff < 10) {
        logger.debug(`Wallet sync skipped (recently updated ${timeDiff}s ago)`);
        return;
      }
    }

    if (!existingWallet) {
      // Check if this is the first wallet
      const { data: userWallets } = await supabaseService
        .from('wallets')
        .select('id')
        .eq('user_id', userId);

      const isFirstWallet = !userWallets || userWallets.length === 0;

      // Create new wallet
      const walletData = {
        user_id: userId,
        wallet_id: crypto.randomUUID(),
        wallet_address: walletAddress.toLowerCase(),
        wallet_type: 'embedded',
        is_primary: isFirstWallet,
        is_active: true,
        network: 'ethereum',
        chain_id: 1,
        status: 'active',
        label: isFirstWallet ? 'Primary Wallet' : undefined,
        metadata: {
          source: 'privy',
          verified: true,
          verified_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabaseService.from('wallets').insert(walletData);

      if (insertError && insertError.code !== '23505') {
        logger.error('Failed to insert wallet:', insertError);
      } else if (process.env.NODE_ENV === 'development') {
        logger.debug(`Wallet synced: ${walletAddress}`);
      }
    }
  } catch (error) {
    logger.error('Wallet sync failed:', error);
  }
}

export default router;
