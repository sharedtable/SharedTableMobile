/**
 * User Preferences API Service
 * Direct mapping to user_preferences table - single source of truth
 * Security: Application-level with Privy user IDs (RLS disabled)
 */

import { supabase } from '@/lib/supabase/client';
import type { 
  ExtendedUserPreferencesUpdate
} from '@/lib/supabase/types/database-extended';

// Direct interfaces matching the database schema
export interface DietaryPreferences {
  dietary_restrictions: string[];
  alcohol_preferences: string;
  spice_tolerance: number;
}

export interface CuisinePreferences {
  cuisine_preferences: string[];
  cuisine_love_levels: Record<string, 'like' | 'love'>;
  cuisine_avoid: string[];
}

export interface DiningStylePreferences {
  dining_atmospheres: string[];
  dining_occasions: string[];
  preferred_price_range: [number, number];
  group_size_preference: string;
  zip_code: string;
  max_travel_distance: number;
}

export interface SocialPreferences {
  social_level: number;
  adventure_level: number;
  formality_level: number;
  interests: string[];
  goals: string[];
  languages: string[];
  social_media: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface FoodieProfile {
  bio: string;
  fun_fact: string;
  favorite_food: string;
  food_bucket_list: string;
  cooking_skill: string;
  foodie_tags: string[];
  hobbies: string[];
}

// Complete preferences type
export interface CompleteUserPreferences {
  dietary?: DietaryPreferences;
  cuisine?: CuisinePreferences;
  dining_style?: DiningStylePreferences;
  social?: SocialPreferences;
  foodie_profile?: FoodieProfile;
}

class UserPreferencesAPI {
  /**
   * Ensure user_preferences record exists
   */
  private async ensurePreferencesRecord(userId: string) {
    console.log(`🔍 Ensuring preferences record for user: ${userId}`);
    
    // Validate Privy user ID format
    if (!userId || !userId.startsWith('did:privy:')) {
      throw new Error(`Invalid Privy user ID format: ${userId}`);
    }
    
    const { data: existing, error: selectError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      console.error('Error checking existing preferences:', selectError);
      throw selectError;
    }

    if (!existing) {
      console.log(`📝 Creating new preferences record for user: ${userId}`);
      const { data: inserted, error: insertError } = await (supabase as any)
        .from('user_preferences')
        .insert([{ user_id: userId }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating preferences record:', insertError);
        throw insertError;
      }

      console.log('✅ Created new preferences record:', inserted);
    } else {
      console.log('✅ Found existing preferences record:', existing);
    }
  }

  /**
   * Save dietary preferences (Stage 1)
   */
  async saveDietaryPreferences(userId: string, preferences: DietaryPreferences) {
    try {
      console.log(`📤 Saving dietary preferences for user: ${userId}`, preferences);
      
      await this.ensurePreferencesRecord(userId);

      const updateData: ExtendedUserPreferencesUpdate = {
        dietary_restrictions: preferences.dietary_restrictions,
        alcohol_preferences: preferences.alcohol_preferences,
        spice_tolerance: preferences.spice_tolerance,
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Updating database with:', updateData);

      const { data: updated, error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }
      
      console.log('✅ Dietary preferences saved successfully:', updated);
      return { success: true, data: updated };
    } catch (error) {
      console.error('❌ Error saving dietary preferences:', error);
      throw error;
    }
  }

  /**
   * Save cuisine preferences (Stage 2)
   */
  async saveCuisinePreferences(userId: string, preferences: CuisinePreferences) {
    try {
      await this.ensurePreferencesRecord(userId);

      const updateData: ExtendedUserPreferencesUpdate = {
        preferred_cuisines: preferences.cuisine_preferences,
        cuisine_love_levels: preferences.cuisine_love_levels,
        cuisine_avoid: preferences.cuisine_avoid,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Cuisine preferences saved:', updateData);
      return { success: true };
    } catch (error) {
      console.error('Error saving cuisine preferences:', error);
      throw error;
    }
  }

  /**
   * Save dining style preferences (Stage 3)
   */
  async saveDiningStylePreferences(userId: string, preferences: DiningStylePreferences) {
    try {
      await this.ensurePreferencesRecord(userId);

      const updateData: ExtendedUserPreferencesUpdate = {
        dining_atmospheres: preferences.dining_atmospheres,
        dining_occasions: preferences.dining_occasions,
        preferred_price_range: preferences.preferred_price_range,
        group_size_preference: preferences.group_size_preference,
        location_zip_code: preferences.zip_code,
        max_travel_distance: preferences.max_travel_distance,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Dining style preferences saved:', updateData);
      return { success: true };
    } catch (error) {
      console.error('Error saving dining style preferences:', error);
      throw error;
    }
  }

  /**
   * Save social preferences (Stage 4)
   */
  async saveSocialPreferences(userId: string, preferences: SocialPreferences) {
    try {
      await this.ensurePreferencesRecord(userId);

      // Store as JSONB in social_preferences column
      const socialData = {
        social_level: preferences.social_level,
        adventure_level: preferences.adventure_level,
        formality_level: preferences.formality_level,
        interests: preferences.interests,
        goals: preferences.goals,
        languages: preferences.languages,
        social_media: preferences.social_media,
      };

      const updateData: ExtendedUserPreferencesUpdate = {
        social_preferences: socialData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Social preferences saved:', socialData);
      return { success: true };
    } catch (error) {
      console.error('Error saving social preferences:', error);
      throw error;
    }
  }

  /**
   * Save foodie profile (Stage 5 - Final)
   */
  async saveFoodieProfile(userId: string, profile: FoodieProfile) {
    try {
      await this.ensurePreferencesRecord(userId);

      // Store as JSONB in foodie_profile column
      const foodieData = {
        bio: profile.bio,
        fun_fact: profile.fun_fact,
        favorite_food: profile.favorite_food,
        food_bucket_list: profile.food_bucket_list,
        cooking_skill: profile.cooking_skill,
        foodie_tags: profile.foodie_tags,
        hobbies: profile.hobbies,
      };

      const updateData: ExtendedUserPreferencesUpdate = {
        foodie_profile: foodieData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      // Mark onboarding as complete
      const { error: userError } = await (supabase as any)
        .from('users')
        .update({
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (userError) {
        console.error('Error marking onboarding complete:', userError);
      }

      console.log('✅ Foodie profile saved and onboarding completed:', foodieData);
      return { success: true };
    } catch (error) {
      console.error('Error saving foodie profile:', error);
      throw error;
    }
  }

  /**
   * Save all preferences at once (bulk update)
   */
  async saveAllPreferences(userId: string, preferences: CompleteUserPreferences) {
    try {
      await this.ensurePreferencesRecord(userId);

      const updateData: ExtendedUserPreferencesUpdate = {
        updated_at: new Date().toISOString(),
      };

      // Map all preferences directly
      if (preferences.dietary) {
        updateData.dietary_restrictions = preferences.dietary.dietary_restrictions;
        updateData.alcohol_preferences = preferences.dietary.alcohol_preferences;
        updateData.spice_tolerance = preferences.dietary.spice_tolerance;
      }

      if (preferences.cuisine) {
        updateData.preferred_cuisines = preferences.cuisine.cuisine_preferences;
        updateData.cuisine_love_levels = preferences.cuisine.cuisine_love_levels;
        updateData.cuisine_avoid = preferences.cuisine.cuisine_avoid;
      }

      if (preferences.dining_style) {
        updateData.dining_atmospheres = preferences.dining_style.dining_atmospheres;
        updateData.dining_occasions = preferences.dining_style.dining_occasions;
        updateData.preferred_price_range = preferences.dining_style.preferred_price_range;
        updateData.group_size_preference = preferences.dining_style.group_size_preference;
        updateData.location_zip_code = preferences.dining_style.zip_code;
        updateData.max_travel_distance = preferences.dining_style.max_travel_distance;
      }

      if (preferences.social) {
        updateData.social_preferences = {
          social_level: preferences.social.social_level,
          adventure_level: preferences.social.adventure_level,
          formality_level: preferences.social.formality_level,
          interests: preferences.social.interests,
          goals: preferences.social.goals,
          languages: preferences.social.languages,
          social_media: preferences.social.social_media,
        };
      }

      if (preferences.foodie_profile) {
        updateData.foodie_profile = {
          bio: preferences.foodie_profile.bio,
          fun_fact: preferences.foodie_profile.fun_fact,
          favorite_food: preferences.foodie_profile.favorite_food,
          bucket_list: (preferences.foodie_profile as any).bucket_list || '',
          cooking_skill: preferences.foodie_profile.cooking_skill,
          tags: (preferences.foodie_profile as any).tags || [],
          hobbies: preferences.foodie_profile.hobbies,
        };
      }

      const { error } = await (supabase as any)
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      // Mark onboarding complete if we have foodie profile
      if (preferences.foodie_profile) {
        await (supabase as any)
          .from('users')
          .update({
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      console.log('✅ All preferences saved:', updateData);
      return { success: true };
    } catch (error) {
      console.error('Error saving all preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<CompleteUserPreferences | null> {
    try {
      console.log(`🔍 Fetching preferences for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 No preferences found for user:', userId);
        } else {
          console.error('❌ Error fetching preferences:', error);
        }
        return null;
      }

      if (!data) {
        console.log('📭 No preferences data for user:', userId);
        return null;
      }

      console.log('✅ Retrieved preferences from database:', data);

      const typedData = data as any;

      // Map database fields back to interface structure
      return {
        dietary: typedData.dietary_restrictions || typedData.alcohol_preferences || typedData.spice_tolerance ? {
          dietary_restrictions: typedData.dietary_restrictions || [],
          alcohol_preferences: typedData.alcohol_preferences || '',
          spice_tolerance: typedData.spice_tolerance || 5,
        } : undefined,
        cuisine: typedData.preferred_cuisines || typedData.cuisine_love_levels || typedData.cuisine_avoid ? {
          cuisine_preferences: typedData.preferred_cuisines || [],
          cuisine_love_levels: typedData.cuisine_love_levels || {},
          cuisine_avoid: typedData.cuisine_avoid || [],
        } : undefined,
        dining_style: typedData.dining_atmospheres || typedData.location_zip_code ? {
          dining_atmospheres: typedData.dining_atmospheres || [],
          dining_occasions: typedData.dining_occasions || [],
          preferred_price_range: typedData.preferred_price_range as [number, number] || [0, 100],
          group_size_preference: typedData.group_size_preference || 'small_group',
          zip_code: typedData.location_zip_code || '',
          max_travel_distance: typedData.max_travel_distance || 10,
        } : undefined,
        social: typedData.social_preferences ? {
          social_level: typedData.social_preferences.social_level || 5,
          adventure_level: typedData.social_preferences.adventure_level || 5,
          formality_level: typedData.social_preferences.formality_level || 5,
          interests: typedData.social_preferences.interests || [],
          goals: typedData.social_preferences.goals || [],
          languages: typedData.social_preferences.languages || [],
          social_media: typedData.social_preferences.social_media || {},
        } : undefined,
        foodie_profile: typedData.foodie_profile ? {
          bio: typedData.foodie_profile.bio || '',
          fun_fact: typedData.foodie_profile.fun_fact || '',
          favorite_food: typedData.foodie_profile.favorite_food || '',
          food_bucket_list: typedData.foodie_profile.food_bucket_list || '',
          cooking_skill: typedData.foodie_profile.cooking_skill || '',
          foodie_tags: typedData.foodie_profile.foodie_tags || [],
          hobbies: typedData.foodie_profile.hobbies || [],
        } : undefined,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Get preference completion percentage
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_preference_completion', { user_id_param: userId } as any);

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  }

  /**
   * Check if user has completed specific preference stage
   */
  async hasCompletedStage(userId: string, stage: keyof CompleteUserPreferences): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) return false;

    const stageData = preferences[stage];
    if (!stageData) return false;

    // Check if stage has meaningful data
    switch (stage) {
      case 'dietary': {
        const dietary = stageData as DietaryPreferences;
        return dietary.dietary_restrictions.length > 0 || 
               !!dietary.alcohol_preferences || 
               !!dietary.spice_tolerance;
      }
      
      case 'cuisine': {
        const cuisine = stageData as CuisinePreferences;
        return cuisine.cuisine_preferences.length > 0;
      }
      
      case 'dining_style': {
        const dining = stageData as DiningStylePreferences;
        return dining.dining_atmospheres.length > 0 || !!dining.zip_code;
      }
      
      case 'social': {
        const social = stageData as SocialPreferences;
        return social.interests.length > 0 || social.goals.length > 0;
      }
      
      case 'foodie_profile': {
        const foodie = stageData as FoodieProfile;
        return !!foodie.bio && foodie.bio.length > 10;
      }
      
      default:
        return false;
    }
  }
}

export const userPreferencesAPI = new UserPreferencesAPI();