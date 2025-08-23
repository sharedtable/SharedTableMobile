/**
 * Helper functions for Supabase operations with proper typing
 * This file provides type-safe wrappers around Supabase operations
 */

import { supabase } from './client';
import type { Database } from './types/database';

// Type aliases for tables
export type Tables = Database['public']['Tables'];
export type TablesInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TablesUpdate<T extends keyof Tables> = Tables[T]['Update'];
export type TablesRow<T extends keyof Tables> = Tables[T]['Row'];

// Helper function to get typed table reference
export function getTable<T extends keyof Tables>(tableName: T) {
  return supabase.from(tableName) as any;
}

// Export typed supabase client
export { supabase };