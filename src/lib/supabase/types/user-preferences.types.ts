/**
 * TypeScript types for user_preferences table
 * Generated from database schema
 */

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          dietary_restrictions: string[] | null;
          alcohol_preferences: string | null;
          spice_tolerance: number | null;
          preferred_cuisines: string[] | null;
          cuisine_love_levels: Record<string, 'like' | 'love'> | null;
          cuisine_avoid: string[] | null;
          dining_atmospheres: string[] | null;
          dining_occasions: string[] | null;
          preferred_price_range: number[] | null;
          group_size_preference: string | null;
          location_zip_code: string | null;
          max_travel_distance: number | null;
          preferred_times: string[] | null;
          preferred_days: string[] | null;
          social_preferences: {
            social_level?: number;
            adventure_level?: number;
            formality_level?: number;
            interests?: string[];
            goals?: string[];
            languages?: string[];
            social_media?: {
              instagram?: string;
              linkedin?: string;
              twitter?: string;
            };
          } | null;
          foodie_profile: {
            bio?: string;
            fun_fact?: string;
            favorite_food?: string;
            food_bucket_list?: string;
            cooking_skill?: string;
            foodie_tags?: string[];
            hobbies?: string[];
          } | null;
          notification_preferences: {
            push_enabled?: boolean;
            email_enabled?: boolean;
            sms_enabled?: boolean;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dietary_restrictions?: string[] | null;
          alcohol_preferences?: string | null;
          spice_tolerance?: number | null;
          preferred_cuisines?: string[] | null;
          cuisine_love_levels?: Record<string, 'like' | 'love'> | null;
          cuisine_avoid?: string[] | null;
          dining_atmospheres?: string[] | null;
          dining_occasions?: string[] | null;
          preferred_price_range?: number[] | null;
          group_size_preference?: string | null;
          location_zip_code?: string | null;
          max_travel_distance?: number | null;
          preferred_times?: string[] | null;
          preferred_days?: string[] | null;
          social_preferences?: {
            social_level?: number;
            adventure_level?: number;
            formality_level?: number;
            interests?: string[];
            goals?: string[];
            languages?: string[];
            social_media?: {
              instagram?: string;
              linkedin?: string;
              twitter?: string;
            };
          } | null;
          foodie_profile?: {
            bio?: string;
            fun_fact?: string;
            favorite_food?: string;
            food_bucket_list?: string;
            cooking_skill?: string;
            foodie_tags?: string[];
            hobbies?: string[];
          } | null;
          notification_preferences?: {
            push_enabled?: boolean;
            email_enabled?: boolean;
            sms_enabled?: boolean;
          } | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dietary_restrictions?: string[] | null;
          alcohol_preferences?: string | null;
          spice_tolerance?: number | null;
          preferred_cuisines?: string[] | null;
          cuisine_love_levels?: Record<string, 'like' | 'love'> | null;
          cuisine_avoid?: string[] | null;
          dining_atmospheres?: string[] | null;
          dining_occasions?: string[] | null;
          preferred_price_range?: number[] | null;
          group_size_preference?: string | null;
          location_zip_code?: string | null;
          max_travel_distance?: number | null;
          preferred_times?: string[] | null;
          preferred_days?: string[] | null;
          social_preferences?: {
            social_level?: number;
            adventure_level?: number;
            formality_level?: number;
            interests?: string[];
            goals?: string[];
            languages?: string[];
            social_media?: {
              instagram?: string;
              linkedin?: string;
              twitter?: string;
            };
          } | null;
          foodie_profile?: {
            bio?: string;
            fun_fact?: string;
            favorite_food?: string;
            food_bucket_list?: string;
            cooking_skill?: string;
            foodie_tags?: string[];
            hobbies?: string[];
          } | null;
          notification_preferences?: {
            push_enabled?: boolean;
            email_enabled?: boolean;
            sms_enabled?: boolean;
          } | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];