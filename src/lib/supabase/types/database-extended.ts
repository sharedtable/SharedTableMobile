/**
 * Extended Database Types for Personalization Features
 * This file extends the base database.ts with new fields added for personalization
 */

import { Database } from './database';

// Extract the base type first
type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

// Extended user_preferences with new fields
export interface ExtendedUserPreferences extends UserPreferencesRow {
  alcohol_preferences: string | null;
  spice_tolerance: number | null;
  dining_atmospheres: string[] | null;
  dining_occasions: string[] | null;
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
    bucket_list?: string;
    cooking_skill?: string;
    tags?: string[];
    hobbies?: string[];
  } | null;
  cuisine_love_levels: Record<string, 'like' | 'love'> | null;
  cuisine_avoid: string[] | null;
  zipcode: string | null;
}

// Extract the base type first
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

// Extended user_profiles with new fields
export interface ExtendedUserProfile extends UserProfileRow {
  languages_spoken: string[] | null;
  hobbies: string[] | null;
  interests: string[] | null;
  favorite_cuisines: string[] | null;
  dietary_preferences: string[] | null;
  drinking_habits: string | null;
  social_links: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  } | null;
  bio: string | null;
  what_makes_me_unique: string | null;
  current_location: string | null;
  max_distance_km: number | null;
  looking_for: string | null;
  favorite_food: string | null;
  food_bucket_list: string | null;
  cooking_skill: string | null;
  foodie_tags: string[] | null;
  fun_fact: string | null;
}

// Complete personalization view type
export interface UserPersonalizationComplete {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  onboarding_completed_at: string | null;
  
  // From user_preferences
  dietary_restrictions: string[] | null;
  alcohol_preferences: string | null;
  spice_tolerance: number | null;
  preferred_cuisines: string[] | null;
  cuisine_love_levels: Record<string, 'like' | 'love'> | null;
  cuisine_avoid: string[] | null;
  preferred_price_range: number[] | null;
  preferred_times: string[] | null;
  preferred_days: string[] | null;
  dining_atmospheres: string[] | null;
  dining_occasions: string[] | null;
  max_travel_distance: number | null;
  group_size_preference: string | null;
  zipcode: string | null;
  social_preferences: any | null;
  foodie_profile: any | null;
  
  // From user_profiles
  bio: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  birth_date: string | null;
  languages_spoken: string[] | null;
  hobbies: string[] | null;
  interests: string[] | null;
  profile_favorite_cuisines: string[] | null;
  profile_dietary_preferences: string[] | null;
  drinking_habits: string | null;
  social_links: any | null;
  current_location: string | null;
  max_distance_km: number | null;
  looking_for: string | null;
  what_makes_me_unique: string | null;
  favorite_food: string | null;
  food_bucket_list: string | null;
  cooking_skill: string | null;
  foodie_tags: string[] | null;
  fun_fact: string | null;
  profile_completion_score: number;
  
  // Timestamps
  preferences_created_at: string;
  preferences_updated_at: string;
  profile_created_at: string;
  profile_updated_at: string;
}

// Update/Insert types for the extended schema
export type ExtendedUserPreferencesInsert = {
  id?: string;
  user_id: string;
  preferred_cuisines?: string[] | null;
  dietary_restrictions?: string[] | null;
  alcohol_preferences?: string | null;
  spice_tolerance?: number | null;
  preferred_price_range?: number[] | null;
  preferred_times?: string[] | null;
  preferred_days?: string[] | null;
  dining_atmospheres?: string[] | null;
  dining_occasions?: string[] | null;
  max_travel_distance?: number | null;
  group_size_preference?: string | null;
  zipcode?: string | null;
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
    bucket_list?: string;
    cooking_skill?: string;
    tags?: string[];
    hobbies?: string[];
  } | null;
  cuisine_love_levels?: Record<string, 'like' | 'love'> | null;
  cuisine_avoid?: string[] | null;
  notification_preferences?: any | null;
  created_at?: string;
  updated_at?: string;
};

export type ExtendedUserPreferencesUpdate = Partial<ExtendedUserPreferencesInsert>;

export type ExtendedUserProfileInsert = {
  user_id: string;
  birth_date?: string | null;
  age_years?: number | null;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  nationality?: string | null;
  ethnicities?: string[] | null;
  languages_spoken?: string[] | null;
  education_level?: string | null;
  field_of_study?: string | null;
  university?: string | null;
  graduation_year?: number | null;
  occupation?: string | null;
  employer?: string | null;
  income_range?: string | null;
  relationship_status?: string | null;
  looking_for?: string | null;
  interested_in_genders?: string[] | null;
  age_preference_range?: string | null;
  wants_children?: string | null;
  has_children?: boolean | null;
  height_cm?: number | null;
  body_type?: string | null;
  smoking_habits?: string | null;
  drinking_habits?: string | null;
  exercise_frequency?: string | null;
  dietary_preferences?: string[] | null;
  religion?: string | null;
  political_views?: string | null;
  mbti_type?: string | null;
  enneagram_type?: string | null;
  love_languages?: string[] | null;
  hobbies?: string[] | null;
  interests?: string[] | null;
  favorite_cuisines?: string[] | null;
  music_genres?: string[] | null;
  movie_genres?: string[] | null;
  current_location?: string | null;
  preferred_locations?: string[] | null;
  max_distance_km?: number | null;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  } | null;
  bio?: string | null;
  what_makes_me_unique?: string | null;
  ideal_first_date?: string | null;
  life_goals?: string | null;
  favorite_food?: string | null;
  food_bucket_list?: string | null;
  cooking_skill?: string | null;
  foodie_tags?: string[] | null;
  fun_fact?: string | null;
  personality_vector?: number[] | null;
  interests_vector?: number[] | null;
  bio_embedding?: number[] | null;
  profile_completion_score?: number;
  profile_views_count?: number;
  last_profile_update?: string;
  created_at?: string;
  updated_at?: string;
};

export type ExtendedUserProfileUpdate = Partial<ExtendedUserProfileInsert>;

// Helper type for profile completion calculation
export interface ProfileCompletionFactors {
  hasDietaryRestrictions: boolean;
  hasAlcoholPreferences: boolean;
  hasSpiceTolerance: boolean;
  hasCuisinePreferences: boolean;
  hasPriceRange: boolean;
  hasDiningAtmospheres: boolean;
  hasSocialPreferences: boolean;
  hasLocation: boolean;
  hasBio: boolean;
  hasHobbies: boolean;
  hasInterests: boolean;
  hasLanguages: boolean;
  hasCookingSkill: boolean;
  hasFoodieTags: boolean;
  hasFunFact: boolean;
}

// Enums for better type safety
export enum AlcoholPreference {
  NO_DRINK = 'no_drink',
  WINE_ONLY = 'wine_only',
  BEER_ONLY = 'beer_only',
  COCKTAILS = 'cocktails',
  EVERYTHING = 'everything',
  SOBER_CURIOUS = 'sober_curious',
}

export enum CookingSkillLevel {
  BEGINNER = 'beginner',
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum GroupSizePreference {
  SOLO = 'solo',
  COUPLE = 'couple',
  SMALL_GROUP = 'small_group',
  LARGE_GROUP = 'large_group',
  PARTY = 'party',
}

export enum DiningAtmosphere {
  CASUAL = 'casual',
  TRENDY = 'trendy',
  ROMANTIC = 'romantic',
  LIVELY = 'lively',
  FINE_DINING = 'fine_dining',
  FAMILY_FRIENDLY = 'family_friendly',
}

export enum DiningOccasion {
  WEEKDAY_LUNCH = 'weekday_lunch',
  WEEKDAY_DINNER = 'weekday_dinner',
  WEEKEND_BRUNCH = 'weekend_brunch',
  WEEKEND_DINNER = 'weekend_dinner',
  LATE_NIGHT = 'late_night',
}