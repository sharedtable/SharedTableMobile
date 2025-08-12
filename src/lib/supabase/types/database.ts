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
          id: string;
          user_id: string;
          bio: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          dietary_restrictions: string[] | null;
          interests: string[] | null;
          location: string | null;
          university_year:
            | 'freshman'
            | 'sophomore'
            | 'junior'
            | 'senior'
            | 'graduate'
            | 'other'
            | null;
          major: string | null;
          personality_traits: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          dietary_restrictions?: string[] | null;
          interests?: string[] | null;
          location?: string | null;
          university_year?:
            | 'freshman'
            | 'sophomore'
            | 'junior'
            | 'senior'
            | 'graduate'
            | 'other'
            | null;
          major?: string | null;
          personality_traits?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
          dietary_restrictions?: string[] | null;
          interests?: string[] | null;
          location?: string | null;
          university_year?:
            | 'freshman'
            | 'sophomore'
            | 'junior'
            | 'senior'
            | 'graduate'
            | 'other'
            | null;
          major?: string | null;
          personality_traits?: string[] | null;
          created_at?: string;
          updated_at?: string;
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
