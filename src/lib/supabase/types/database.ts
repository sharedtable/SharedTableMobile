// Database types for Supabase integration
// These should match your SharedTableWeb database schema

export interface Database {
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
          description: string | null;
          location: string;
          date_time: string;
          max_participants: number;
          current_participants: number;
          created_by: string;
          status: 'active' | 'cancelled' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location: string;
          date_time: string;
          max_participants: number;
          current_participants?: number;
          created_by: string;
          status?: 'active' | 'cancelled' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string;
          date_time?: string;
          max_participants?: number;
          current_participants?: number;
          created_by?: string;
          status?: 'active' | 'cancelled' | 'completed';
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
  };
}

// Auth types
export type User = Database['public']['Tables']['users']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
