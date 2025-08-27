/**
 * Supabase client configured to work with Privy JWT authentication
 * This maintains the highest security standards by using Privy's JWT
 * for Row Level Security policies in Supabase
 */

import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Database } from './types/database';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Store for the current Privy token
let currentPrivyToken: string | null = null;
let supabaseClientInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create Supabase client with Privy JWT
 */
export const getSupabaseClient = async (privyToken?: string): Promise<SupabaseClient<Database>> => {
  // Use provided token or get from storage
  const token = privyToken || (await SecureStore.getItemAsync('privy_access_token'));
  
  if (!token) {
    console.warn('⚠️ No Privy token available, using anonymous Supabase client');
  }

  // If token hasn't changed and we have a client, return it
  if (currentPrivyToken === token && supabaseClientInstance) {
    return supabaseClientInstance;
  }

  currentPrivyToken = token;

  // Create new Supabase client with Privy JWT
  supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false, // We'll handle refresh through Privy
      persistSession: false, // Privy handles session persistence
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client-Info': 'SharedTable-Mobile-Privy',
        'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
      },
    },
  });

  return supabaseClientInstance;
};

/**
 * Update the Supabase client with a new Privy token
 */
export const updateSupabaseAuth = async (privyToken: string | null) => {
  if (privyToken) {
    await SecureStore.setItemAsync('privy_access_token', privyToken);
  } else {
    await SecureStore.deleteItemAsync('privy_access_token');
  }
  
  // Force recreation of client on next use
  currentPrivyToken = null;
  supabaseClientInstance = null;
};

/**
 * Enhanced Supabase client with Privy auth
 * Use this for all database operations that need authentication
 */
export class PrivySupabaseClient {
  private static instance: PrivySupabaseClient;
  private privyToken: string | null = null;

  private constructor() {}

  static getInstance(): PrivySupabaseClient {
    if (!PrivySupabaseClient.instance) {
      PrivySupabaseClient.instance = new PrivySupabaseClient();
    }
    return PrivySupabaseClient.instance;
  }

  /**
   * Set the Privy access token
   */
  async setPrivyToken(token: string | null) {
    this.privyToken = token;
    await updateSupabaseAuth(token);
  }

  /**
   * Get authenticated Supabase client
   */
  async getClient(): Promise<SupabaseClient<Database>> {
    return getSupabaseClient(this.privyToken || undefined);
  }

  /**
   * Execute a database query with Privy authentication
   */
  async query<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    return queryFn(client);
  }
}

export const privySupabase = PrivySupabaseClient.getInstance();