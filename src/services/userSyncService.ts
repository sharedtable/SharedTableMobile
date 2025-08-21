/**
 * User Sync Service
 * Synchronizes Privy authentication with Supabase database
 * Records wallet information in the production-grade wallets table
 */

import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';
// Try to use service client for wallet operations to bypass RLS
// Falls back to regular client if service client not available
import { supabaseService } from '@/lib/supabase/serviceClient';
import { __DEV__, logError } from '@/utils/env';

interface PrivyUserData {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  authProvider?: 'email' | 'google' | 'apple';
}

interface SupabaseUserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  auth_provider: 'credentials' | 'google' | 'apple';
  external_auth_id?: string;
  status: 'active' | 'inactive' | 'banned' | 'pending';
  email_verified_at?: string;
  last_active_at?: string;
}

interface WalletData {
  id?: string;
  user_id: string;
  wallet_address: string;
  wallet_type: 'embedded' | 'external' | 'smart' | 'hardware';
  chain_id?: number;
  chain_name?: string;
  label?: string;
  is_primary?: boolean;
  is_active?: boolean;
  verified_at?: string;
  verification_method?: string;
  last_active_at?: string;
  risk_score?: number;
  is_sanctioned?: boolean;
  kyc_status?: 'none' | 'pending' | 'verified' | 'failed' | 'expired';
  created_at?: string;
  updated_at?: string;
}

// Chain configuration
const CHAIN_CONFIG = {
  ethereum: { id: 1, name: 'ethereum' },
  polygon: { id: 137, name: 'polygon' },
  arbitrum: { id: 42161, name: 'arbitrum' },
  optimism: { id: 10, name: 'optimism' },
  base: { id: 8453, name: 'base' },
} as const;

export class UserSyncService {
  /**
   * Sync or create user in Supabase after Privy authentication
   * Also syncs wallet information to the wallets table
   */
  static async syncPrivyUser(
    privyUser: PrivyUserData
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (!privyUser.email) {
        return { success: false, error: 'Email is required for user sync' };
      }

      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, external_auth_id')
        .eq('email', privyUser.email.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new users
        logError('Failed to fetch user', fetchError);
        return { success: false, error: 'Failed to check existing user' };
      }

      let userId: string;

      if (existingUser) {
        // Update existing user
        userId = existingUser.id;
        const updateData = await this.prepareUpdateData(privyUser, existingUser);

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

          if (updateError) {
            logError('Failed to update user', updateError);
            return { success: false, error: 'Failed to update user information' };
          }
        }

        if (__DEV__) {
          console.log('Updated existing user:', userId);
        }
      } else {
        // Create new user
        const userData = await this.prepareUserData(privyUser);

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(userData)
          .select('id')
          .single();

        if (createError) {
          logError('Failed to create user', createError);
          return { success: false, error: 'Failed to create user account' };
        }

        userId = newUser.id;

        // Create user profile
        await this.createUserProfile(userId);

        if (__DEV__) {
          console.log('Created new user:', userId);
        }
      }

      // Sync wallet information if available
      if (privyUser.walletAddress) {
        await this.syncWallet(userId, privyUser.walletAddress);
      }

      // Update last active timestamp
      await this.updateLastActive(userId);

      return { success: true, userId };
    } catch (error) {
      logError('User sync failed', error);
      return { success: false, error: 'An unexpected error occurred during user sync' };
    }
  }

  /**
   * Sync wallet information to the production-grade wallets table
   */
  private static async syncWallet(userId: string, walletAddress: string): Promise<void> {
    try {
      // Use service client for wallet operations to bypass RLS
      const client = supabaseService || supabase;

      // Check if wallet already exists for this user
      const { data: existingWallet, error: fetchError } = await client
        .from('wallets')
        .select('id, wallet_address, is_primary')
        .eq('user_id', userId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('chain_id', CHAIN_CONFIG.ethereum.id) // Default to Ethereum mainnet
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new wallets
        logError('Failed to fetch wallet', fetchError);
        return;
      }

      if (!existingWallet) {
        // Check if user has any wallets to determine if this should be primary
        const { data: userWallets, error: countError } = await client
          .from('wallets')
          .select('id')
          .eq('user_id', userId);

        if (countError) {
          logError('Failed to count user wallets', countError);
        }

        const isFirstWallet = !userWallets || userWallets.length === 0;

        // Create new wallet record - using your existing columns plus new essential ones
        // Generate a unique wallet_id using expo-crypto
        const walletId = Crypto.randomUUID();

        const walletData: any = {
          user_id: userId,
          wallet_id: walletId,
          wallet_address: walletAddress.toLowerCase(),
          wallet_type: 'embedded', // Privy creates embedded wallets
          is_primary: isFirstWallet, // First wallet is primary by default
          is_active: true,
          network: 'ethereum', // Using your existing 'network' column
          chain_id: CHAIN_CONFIG.ethereum.id, // Optional numeric chain ID
          status: 'active', // Using your existing 'status' column
          label: isFirstWallet ? 'Primary Wallet' : undefined,
          // You can store additional data in the metadata JSONB column
          metadata: {
            source: 'privy',
            verified: true,
            verified_at: new Date().toISOString(),
          },
        };

        const { error: insertError } = await client.from('wallets').insert(walletData);

        if (insertError) {
          if (insertError.code === '23505') {
            if (__DEV__) {
              console.log('Wallet already exists for user');
            }
          } else {
            logError('Failed to insert wallet', insertError);
          }
        } else {
          if (__DEV__) {
            console.log('Wallet synced successfully:', walletAddress);
          }
        }
      } else {
        // Wallet already exists, update last_active_at
        const { error: updateError } = await client
          .from('wallets')
          .update({
            last_active_at: new Date().toISOString(),
          })
          .eq('id', existingWallet.id);

        if (updateError) {
          logError('Failed to update wallet activity', updateError);
        } else {
          if (__DEV__) {
            console.log('Wallet activity updated');
          }
        }
      }
    } catch (error) {
      logError('Wallet sync failed', error);
    }
  }

  /**
   * Prepare user data for Supabase insertion
   * Only includes fields that exist in the database
   */
  private static async prepareUserData(
    privyUser: PrivyUserData
  ): Promise<Partial<SupabaseUserData>> {
    const nameParts = this.parseDisplayName(privyUser.name);

    return {
      email: privyUser.email!.toLowerCase(),
      first_name: nameParts.firstName || 'User',
      last_name: nameParts.lastName || '',
      display_name: privyUser.name || nameParts.firstName || 'User',
      auth_provider: this.mapAuthProvider(privyUser.authProvider),
      external_auth_id: privyUser.id,
      status: 'active',
      email_verified_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
  }

  /**
   * Prepare update data for existing user
   * Only includes fields that exist in the database
   */
  private static async prepareUpdateData(
    privyUser: PrivyUserData,
    existingUser: any
  ): Promise<Partial<SupabaseUserData>> {
    const updateData: Partial<SupabaseUserData> = {
      last_active_at: new Date().toISOString(),
    };

    // Update external auth ID if not set
    if (!existingUser.external_auth_id && privyUser.id) {
      updateData.external_auth_id = privyUser.id;
    }

    // Update email verified if not set
    if (!existingUser.email_verified_at) {
      updateData.email_verified_at = new Date().toISOString();
    }

    return updateData;
  }

  /**
   * Create user profile for new users
   */
  private static async createUserProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_profiles').insert({
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error && error.code !== '23505') {
        // 23505 is unique violation, profile might already exist
        logError('Failed to create user profile', error);
      }
    } catch (error) {
      logError('Profile creation failed', error);
    }
  }

  /**
   * Update user's last active timestamp
   */
  private static async updateLastActive(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      // Non-critical error, log but don't fail
      if (__DEV__) {
        console.log('Failed to update last active:', error);
      }
    }
  }

  /**
   * Get user from Supabase by email
   */
  static async getUserByEmail(email: string): Promise<SupabaseUserData | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          logError('Failed to get user by email', error);
        }
        return null;
      }

      return data;
    } catch (error) {
      logError('Get user by email failed', error);
      return null;
    }
  }

  /**
   * Get user's primary wallet from the wallets table
   */
  static async getUserPrimaryWallet(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('wallet_address')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          logError('Failed to get primary wallet', error);
        }
        return null;
      }

      return data?.wallet_address || null;
    } catch (error) {
      logError('Get primary wallet failed', error);
      return null;
    }
  }

  /**
   * Get all active wallets for a user
   */
  static async getUserWallets(userId: string): Promise<WalletData[]> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logError('Failed to get user wallets', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logError('Get user wallets failed', error);
      return [];
    }
  }

  /**
   * Mark a wallet as primary
   */
  static async setWalletAsPrimary(walletId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ is_primary: true })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to set wallet as primary', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('Set primary wallet failed', error);
      return false;
    }
  }

  /**
   * Deactivate a wallet (soft delete)
   */
  static async deactivateWallet(walletId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to deactivate wallet', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('Deactivate wallet failed', error);
      return false;
    }
  }

  /**
   * Update wallet label
   */
  static async updateWalletLabel(
    walletId: string,
    userId: string,
    label: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          label,
          updated_at: new Date().toISOString(),
        })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) {
        logError('Failed to update wallet label', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('Update wallet label failed', error);
      return false;
    }
  }

  /**
   * Helper: Parse display name into first and last name
   */
  private static parseDisplayName(displayName?: string): { firstName?: string; lastName?: string } {
    if (!displayName) {
      return {};
    }

    const parts = displayName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0] };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  /**
   * Helper: Map Privy auth provider to Supabase enum
   */
  private static mapAuthProvider(
    provider?: 'email' | 'google' | 'apple'
  ): 'credentials' | 'google' | 'apple' {
    switch (provider) {
      case 'google':
        return 'google';
      case 'apple':
        return 'apple';
      case 'email':
      default:
        return 'credentials';
    }
  }
}
