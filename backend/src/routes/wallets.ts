import crypto from 'crypto';

import { Router } from 'express';
import { z } from 'zod';

import { supabaseService } from '../config/supabase';
import { AuthRequest, verifyPrivyToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const addWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  walletType: z.enum(['embedded', 'external', 'smart', 'hardware']).optional(),
  label: z.string().optional(),
  chainId: z.number().optional(),
});

const updateWalletSchema = z.object({
  label: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

/**
 * GET /api/wallets
 * Get all wallets for the authenticated user
 */
router.get('/', verifyPrivyToken, async (req: AuthRequest, res, next) => {
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

    // Get user's wallets
    const { data: wallets, error } = await supabaseService
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch wallets:', error);
      throw new AppError('Failed to fetch wallets', 500);
    }

    res.json({
      success: true,
      data: wallets || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallets
 * Add a new wallet for the authenticated user
 */
router.post('/', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const validatedData = addWalletSchema.parse(req.body);

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabaseService
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('wallet_address', validatedData.walletAddress.toLowerCase())
      .single();

    if (existingWallet) {
      throw new AppError('Wallet already exists', 400);
    }

    // Check if this is the first wallet
    const { data: userWallets } = await supabaseService
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isFirstWallet = !userWallets || userWallets.length === 0;

    // Create new wallet
    const walletData = {
      user_id: user.id,
      wallet_id: crypto.randomUUID(),
      wallet_address: validatedData.walletAddress.toLowerCase(),
      wallet_type: validatedData.walletType || 'external',
      is_primary: isFirstWallet,
      is_active: true,
      network: 'ethereum',
      chain_id: validatedData.chainId || 1,
      status: 'active',
      label:
        validatedData.label ||
        (isFirstWallet ? 'Primary Wallet' : `Wallet ${(userWallets?.length || 0) + 1}`),
      metadata: {
        source: 'manual',
        verified: false,
        added_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newWallet, error: insertError } = await supabaseService
      .from('wallets')
      .insert(walletData)
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to add wallet:', insertError);
      throw new AppError('Failed to add wallet', 500);
    }

    res.json({
      success: true,
      data: newWallet,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/wallets/:walletId
 * Update wallet details
 */
router.put('/:walletId', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { walletId } = req.params;
    const validatedData = updateWalletSchema.parse(req.body);

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Verify wallet belongs to user
    const { data: wallet, error: walletError } = await supabaseService
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // If setting as primary, unset other primary wallets
    if (validatedData.isPrimary === true) {
      await supabaseService
        .from('wallets')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', walletId);
    }

    // Update wallet
    const updateData: Record<string, string | boolean> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.label !== undefined) updateData.label = validatedData.label;
    if (validatedData.isPrimary !== undefined) updateData.is_primary = validatedData.isPrimary;

    const { data: updatedWallet, error: updateError } = await supabaseService
      .from('wallets')
      .update(updateData)
      .eq('id', walletId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update wallet:', updateError);
      throw new AppError('Failed to update wallet', 500);
    }

    res.json({
      success: true,
      data: updatedWallet,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/wallets/:walletId
 * Deactivate a wallet (soft delete)
 */
router.delete('/:walletId', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { walletId } = req.params;

    // Get user from database
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id')
      .eq('external_auth_id', req.userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // Verify wallet belongs to user
    const { data: wallet, error: walletError } = await supabaseService
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Don't allow deleting the only primary wallet
    if (wallet.is_primary) {
      const { data: otherWallets } = await supabaseService
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('id', walletId);

      if (!otherWallets || otherWallets.length === 0) {
        throw new AppError('Cannot delete the only wallet', 400);
      }

      // Set another wallet as primary
      await supabaseService
        .from('wallets')
        .update({ is_primary: true })
        .eq('id', otherWallets[0].id);
    }

    // Soft delete wallet
    const { error: deleteError } = await supabaseService
      .from('wallets')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletId);

    if (deleteError) {
      logger.error('Failed to delete wallet:', deleteError);
      throw new AppError('Failed to delete wallet', 500);
    }

    res.json({
      success: true,
      message: 'Wallet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallets/:walletAddress/verify
 * Verify wallet ownership (placeholder for future implementation)
 */
router.get('/:walletAddress/verify', verifyPrivyToken, async (req: AuthRequest, res, next) => {
  try {
    const { walletAddress } = req.params;

    // TODO: Implement wallet verification logic
    // This could involve:
    // 1. Sending a message to sign
    // 2. Verifying the signature
    // 3. Updating the wallet as verified

    res.json({
      success: true,
      message: 'Wallet verification not yet implemented',
      data: {
        walletAddress,
        verified: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
