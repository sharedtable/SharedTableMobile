/**
 * Simple Supabase client for use with Privy authentication
 * Since Supabase doesn't support Privy JWTs directly, we use application-level security
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from './types/database';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client for database operations
 * Security Note: RLS is disabled for user_preferences table
 * User isolation is enforced at the application level using Privy user IDs
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'SharedTable-Mobile',
      'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
    },
  },
});

// Export for use in API services
export default supabaseClient;