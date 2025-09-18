// Database types for Supabase integration
// These should match your SharedTableWeb database schema

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          email_normalized: string;
          phone: string | null;
          phone_normalized: string | null;
          auth_provider: 'credentials' | 'google' | 'apple';
          external_auth_id: string | null;
          password_hash: string | null;
          email_verified_at: string | null;
          phone_verified_at: string | null;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          username: string | null;
          status: 'active' | 'inactive' | 'banned' | 'pending';
          last_active_at: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          role: 'user' | 'admin';
        };
        Insert: {
          id?: string;
          email: string;
          email_normalized?: string;
          phone?: string | null;
          phone_normalized?: string | null;
          auth_provider?: 'credentials' | 'google' | 'apple';
          external_auth_id?: string | null;
          password_hash?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          username?: string | null;
          status?: 'active' | 'inactive' | 'banned' | 'pending';
          last_active_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          role?: 'user' | 'admin';
        };
        Update: {
          id?: string;
          email?: string;
          email_normalized?: string;
          phone?: string | null;
          phone_normalized?: string | null;
          auth_provider?: 'credentials' | 'google' | 'apple';
          external_auth_id?: string | null;
          password_hash?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          username?: string | null;
          status?: 'active' | 'inactive' | 'banned' | 'pending';
          last_active_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          role?: 'user' | 'admin';
        };
      };
      user_profiles: {
        Row: {
          user_id: string;
          birth_date: string | null;
          age_years: number | null;
          gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          nationality: string | null;
          ethnicities: string[] | null;
          languages_spoken: string[] | null;
          education_level: string | null;
          field_of_study: string | null;
          university: string | null;
          graduation_year: number | null;
          occupation: string | null;
          employer: string | null;
          income_range: string | null;
          relationship_status: string | null;
          looking_for: string | null;
          interested_in_genders: string[] | null;
          age_preference_range: string | null;
          wants_children: string | null;
          has_children: boolean | null;
          height_cm: number | null;
          body_type: string | null;
          smoking_habits: string | null;
          drinking_habits: string | null;
          exercise_frequency: string | null;
          dietary_preferences: string[] | null;
          religion: string | null;
          political_views: string | null;
          mbti_type: string | null;
          enneagram_type: string | null;
          love_languages: string[] | null;
          hobbies: string[] | null;
          interests: string[] | null;
          favorite_cuisines: string[] | null;
          music_genres: string[] | null;
          movie_genres: string[] | null;
          current_location: string | null;
          preferred_locations: string[] | null;
          max_distance_km: number | null;
          social_links: Record<string, any> | null;
          bio: string | null;
          what_makes_me_unique: string | null;
          ideal_first_date: string | null;
          life_goals: string | null;
          personality_vector: number[] | null;
          interests_vector: number[] | null;
          bio_embedding: number[] | null;
          profile_completion_score: number;
          profile_views_count: number;
          last_profile_update: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          birth_date?: string | null;
          age_years?: number | null;
          gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          nationality?: string | null;
          ethnicities?: string[] | null;
          field_of_study?: string | null;
          university?: string | null;
          occupation?: string | null;
          relationship_status?: string | null;
          wants_children?: string | null;
          has_children?: boolean | null;
          smoking_habits?: string | null;
          dietary_preferences?: string[] | null;
          interests?: string[] | null;
          current_location?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          // ... other fields available but not essential for type checking
        };
        Update: {
          user_id?: string;
          birth_date?: string | null;
          age_years?: number | null;
          gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          nationality?: string | null;
          ethnicities?: string[] | null;
          field_of_study?: string | null;
          university?: string | null;
          occupation?: string | null;
          relationship_status?: string | null;
          wants_children?: string | null;
          has_children?: boolean | null;
          smoking_habits?: string | null;
          dietary_preferences?: string[] | null;
          interests?: string[] | null;
          current_location?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          // ... other fields available but not essential for type checking
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          event_type: string | null;
          event_date: string;
          start_time: string;
          end_time: string | null;
          timezone: string | null;
          venue_id: string | null;
          venue_details: any | null;
          min_capacity: number;
          max_capacity: number;
          current_capacity: number;
          price_cents: number | null;
          deposit_cents: number | null;
          target_age_range: any | null;
          target_genders: string[] | null;
          target_interests: string[] | null;
          target_relationship_goals: string[] | null;
          status: string;
          booking_opens_at: string | null;
          booking_closes_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
          cancellation_reason: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string;
          description?: string | null;
          event_type?: string | null;
          event_date: string;
          start_time: string;
          end_time?: string | null;
          timezone?: string | null;
          venue_id?: string | null;
          venue_details?: any | null;
          min_capacity: number;
          max_capacity: number;
          current_capacity?: number;
          price_cents?: number | null;
          deposit_cents?: number | null;
          target_age_range?: any | null;
          target_genders?: string[] | null;
          target_interests?: string[] | null;
          target_relationship_goals?: string[] | null;
          status?: string;
          booking_opens_at?: string | null;
          booking_closes_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          event_type?: string | null;
          event_date?: string;
          start_time?: string;
          end_time?: string | null;
          timezone?: string | null;
          venue_id?: string | null;
          venue_details?: any | null;
          min_capacity?: number;
          max_capacity?: number;
          current_capacity?: number;
          price_cents?: number | null;
          deposit_cents?: number | null;
          target_age_range?: any | null;
          target_genders?: string[] | null;
          target_interests?: string[] | null;
          target_relationship_goals?: string[] | null;
          status?: string;
          booking_opens_at?: string | null;
          booking_closes_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string; // booking_status enum
          payment_intent_id: string | null;
          payment_status: string; // payment_status enum
          amount_paid_cents: number | null;
          refund_amount_cents: number | null;
          checked_in_at: string | null;
          no_show_reported_at: string | null;
          dietary_restrictions: string[] | null;
          accessibility_needs: string[] | null;
          special_requests: string | null;
          booking_source: string | null;
          booking_ip: string | null;
          confirmation_code: string | null;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string;
          payment_intent_id?: string | null;
          payment_status?: string;
          amount_paid_cents?: number | null;
          refund_amount_cents?: number | null;
          checked_in_at?: string | null;
          no_show_reported_at?: string | null;
          dietary_restrictions?: string[] | null;
          accessibility_needs?: string[] | null;
          special_requests?: string | null;
          booking_source?: string | null;
          booking_ip?: string | null;
          confirmation_code?: string | null;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string;
          payment_intent_id?: string | null;
          payment_status?: string;
          amount_paid_cents?: number | null;
          refund_amount_cents?: number | null;
          checked_in_at?: string | null;
          no_show_reported_at?: string | null;
          dietary_restrictions?: string[] | null;
          accessibility_needs?: string[] | null;
          special_requests?: string | null;
          booking_source?: string | null;
          booking_ip?: string | null;
          confirmation_code?: string | null;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          cuisine_type: string | null;
          address: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          rating: number | null;
          price_range: number | null;
          capacity: number | null;
          features: string[] | null;
          dietary_options: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          cuisine_type?: string | null;
          address: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          rating?: number | null;
          price_range?: number | null;
          capacity?: number | null;
          features?: string[] | null;
          dietary_options?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          cuisine_type?: string | null;
          address?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          rating?: number | null;
          price_range?: number | null;
          capacity?: number | null;
          features?: string[] | null;
          dietary_options?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          restaurant_id: string | null;
          rating: number;
          title: string | null;
          content: string | null;
          food_rating: number | null;
          service_rating: number | null;
          ambiance_rating: number | null;
          would_recommend: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id?: string | null;
          restaurant_id?: string | null;
          rating: number;
          title?: string | null;
          content?: string | null;
          food_rating?: number | null;
          service_rating?: number | null;
          ambiance_rating?: number | null;
          would_recommend?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string | null;
          restaurant_id?: string | null;
          rating?: number;
          title?: string | null;
          content?: string | null;
          food_rating?: number | null;
          service_rating?: number | null;
          ambiance_rating?: number | null;
          would_recommend?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_cuisines: string[] | null;
          dietary_restrictions: string[] | null;
          preferred_price_range: number[] | null;
          preferred_times: string[] | null;
          preferred_days: string[] | null;
          max_travel_distance: number | null;
          group_size_preference: string | null;
          notification_preferences: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_cuisines?: string[] | null;
          dietary_restrictions?: string[] | null;
          preferred_price_range?: number[] | null;
          preferred_times?: string[] | null;
          preferred_days?: string[] | null;
          max_travel_distance?: number | null;
          group_size_preference?: string | null;
          notification_preferences?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_cuisines?: string[] | null;
          dietary_restrictions?: string[] | null;
          preferred_price_range?: number[] | null;
          preferred_times?: string[] | null;
          preferred_days?: string[] | null;
          max_travel_distance?: number | null;
          group_size_preference?: string | null;
          notification_preferences?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      auth_provider: 'credentials' | 'google' | 'apple';
      gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
      university_year: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
      event_status: 'active' | 'cancelled' | 'completed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Auth types
export type User = Database['public']['Tables']['users']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Event types
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

// Booking types
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

// Restaurant types
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];

// Review types
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

// User Preferences types
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

// Legacy Insert/Update types (keep for compatibility)
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];
