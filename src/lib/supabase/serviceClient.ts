import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import { Database } from './types/database';

// Service client for server-side operations that bypass RLS
// This should only be used for trusted operations like user sync

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

// IMPORTANT: You need to add the service role key to your environment
// This key bypasses RLS and should NEVER be exposed to the client
const supabaseServiceKey =
  Constants.expoConfig?.extra?.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY;

// For now, fallback to anon key if service key is not available
// In production, you should use the service key
const supabaseKey =
  supabaseServiceKey ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables.');
}

// Create service client that bypasses RLS
export const supabaseService = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'SharedTable-Mobile-Service',
    },
  },
});

// Warning message for development
if (!supabaseServiceKey && __DEV__) {
  console.warn(
    '⚠️ [ServiceClient] Using anon key instead of service key. RLS policies will apply. ' +
      'For proper wallet sync, either:\n' +
      '1. Run FIX_WALLETS_RLS.sql to update RLS policies, or\n' +
      '2. Add SUPABASE_SERVICE_KEY to your environment'
  );
}
