/**
 * Production-grade onboarding service
 * Handles all onboarding data operations with Supabase integration
 */

import { supabase } from '@/lib/supabase/client';
import type { UserProfileInsert, UserUpdate } from '@/lib/supabase/types/database';

import type { CompleteOnboardingData } from './validation';
import { completeOnboardingSchema } from './validation';

// Service error types
export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  nextStep?: string;
}

export class OnboardingService {
  private static readonly ONBOARDING_STEPS = [
    'name',
    'birthday',
    'gender',
    'academic',
    'interests',
    'personality',
    'lifestyle',
    'photo',
  ] as const;

  /**
   * Get current onboarding progress for a user
   */
  static async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    try {
      // Check user completion status
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('onboarding_completed_at')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new OnboardingError('Failed to fetch user data', 'USER_FETCH_FAILED', { userError });
      }

      if (user?.onboarding_completed_at) {
        return {
          currentStep: this.ONBOARDING_STEPS.length,
          totalSteps: this.ONBOARDING_STEPS.length,
          completedSteps: [...this.ONBOARDING_STEPS],
        };
      }

      // Check profile completion status
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new users
        throw new OnboardingError('Failed to fetch profile data', 'PROFILE_FETCH_FAILED', {
          profileError,
        });
      }

      const completedSteps: string[] = [];
      let currentStep = 0;

      if (profile) {
        // Determine which steps are completed based on profile data
        // Note: Name is stored in users table, not profile table, so we check bio as indicator
        if (profile.bio !== null) {
          completedSteps.push('name');
          currentStep = Math.max(currentStep, 1);
        }

        if (profile.birth_date) {
          completedSteps.push('birthday');
          currentStep = Math.max(currentStep, 2);
        }

        if (profile.gender) {
          completedSteps.push('gender');
          currentStep = Math.max(currentStep, 3);
        }

        if (profile.major && profile.university_year) {
          completedSteps.push('academic');
          currentStep = Math.max(currentStep, 4);
        }

        if (profile.interests && profile.interests.length > 0) {
          completedSteps.push('interests');
          currentStep = Math.max(currentStep, 5);
        }

        if (profile.personality_traits && profile.personality_traits.length > 0) {
          completedSteps.push('personality');
          currentStep = Math.max(currentStep, 6);
        }

        if (profile.bio !== null || profile.dietary_restrictions || profile.location) {
          completedSteps.push('lifestyle');
          currentStep = Math.max(currentStep, 7);
        }

        if (profile.avatar_url) {
          completedSteps.push('photo');
          currentStep = Math.max(currentStep, 8);
        }
      }

      const nextStep =
        currentStep < this.ONBOARDING_STEPS.length ? this.ONBOARDING_STEPS[currentStep] : undefined;

      return {
        currentStep,
        totalSteps: this.ONBOARDING_STEPS.length,
        completedSteps,
        nextStep,
      };
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to get onboarding progress', 'PROGRESS_FETCH_FAILED', {
        originalError: error,
      });
    }
  }

  /**
   * Save onboarding step data
   */
  static async saveOnboardingStep(
    userId: string,
    stepData: Partial<CompleteOnboardingData>
  ): Promise<void> {
    try {
      // First ensure user record exists
      const { error: userError } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        throw new OnboardingError('Failed to update user record', 'USER_UPDATE_FAILED', {
          userError,
        });
      }

      // Prepare profile data for database
      const profileData: Partial<UserProfileInsert> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      // Map onboarding data to database fields
      if (stepData.birthDate) {
        profileData.birth_date = stepData.birthDate.toISOString().split('T')[0];
      }

      if (stepData.gender) {
        profileData.gender = stepData.gender;
      }

      if (stepData.major) {
        profileData.major = stepData.major;
      }

      if (stepData.universityYear) {
        profileData.university_year = stepData.universityYear;
      }

      if (stepData.interests) {
        profileData.interests = stepData.interests;
      }

      if (stepData.personalityTraits) {
        profileData.personality_traits = stepData.personalityTraits;
      }

      if (stepData.bio !== undefined) {
        profileData.bio = stepData.bio;
      }

      if (stepData.dietaryRestrictions !== undefined) {
        profileData.dietary_restrictions = stepData.dietaryRestrictions;
      }

      if (stepData.location !== undefined) {
        profileData.location = stepData.location;
      }

      if (stepData.avatarUrl !== undefined) {
        profileData.avatar_url = stepData.avatarUrl;
      }

      // Upsert profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData as UserProfileInsert, {
          onConflict: 'user_id',
        });

      if (profileError) {
        throw new OnboardingError('Failed to save profile data', 'PROFILE_SAVE_FAILED', {
          profileError,
        });
      }

      console.log('✅ [OnboardingService] Step saved successfully:', Object.keys(stepData));
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to save onboarding step', 'STEP_SAVE_FAILED', {
        originalError: error,
        stepData,
      });
    }
  }

  /**
   * Complete the onboarding process
   */
  static async completeOnboarding(
    userId: string,
    finalData: CompleteOnboardingData
  ): Promise<void> {
    try {
      // Validate complete data
      const validationResult = completeOnboardingSchema.safeParse(finalData);
      if (!validationResult.success) {
        throw new OnboardingError('Invalid onboarding data', 'VALIDATION_FAILED', {
          errors: validationResult.error.errors,
        });
      }

      const validatedData = validationResult.data;

      // Update user record to mark onboarding as complete
      const { error: userError } = await supabase
        .from('users')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          display_name: `${validatedData.firstName} ${validatedData.lastName}`,
          updated_at: new Date().toISOString(),
        } as UserUpdate)
        .eq('id', userId);

      if (userError) {
        throw new OnboardingError('Failed to complete user onboarding', 'USER_COMPLETION_FAILED', {
          userError,
        });
      }

      // Save complete profile data
      const profileData: UserProfileInsert = {
        user_id: userId,
        bio: validatedData.bio,
        avatar_url: validatedData.avatarUrl,
        birth_date: validatedData.birthDate.toISOString().split('T')[0],
        gender: validatedData.gender,
        dietary_restrictions: validatedData.dietaryRestrictions,
        interests: validatedData.interests,
        location: validatedData.location,
        university_year: validatedData.universityYear,
        major: validatedData.major,
        personality_traits: validatedData.personalityTraits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from('user_profiles').upsert(profileData, {
        onConflict: 'user_id',
      });

      if (profileError) {
        throw new OnboardingError('Failed to save complete profile', 'PROFILE_COMPLETION_FAILED', {
          profileError,
        });
      }

      console.log('✅ [OnboardingService] Onboarding completed successfully for user:', userId);
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to complete onboarding', 'COMPLETION_FAILED', {
        originalError: error,
        finalData,
      });
    }
  }

  /**
   * Get user's current profile data
   */
  static async getUserProfile(userId: string): Promise<UserProfileInsert | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new OnboardingError('Failed to fetch user profile', 'PROFILE_FETCH_FAILED', {
          error,
        });
      }

      return data || null;
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to get user profile', 'PROFILE_GET_FAILED', {
        originalError: error,
      });
    }
  }

  /**
   * Upload profile photo and return URL
   */
  static async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    try {
      // For now, we'll return the URI as-is
      // In a real implementation, you would upload to Supabase Storage
      // const { data, error } = await supabase.storage
      //   .from('profile-photos')
      //   .upload(`${userId}/avatar.jpg`, photo);

      // Placeholder implementation - in production you'd upload to Supabase Storage
      // and return the public URL
      console.log('📸 [OnboardingService] Photo upload placeholder for:', userId);

      // For demo, just return the local URI
      return imageUri;
    } catch (error) {
      throw new OnboardingError('Failed to upload profile photo', 'PHOTO_UPLOAD_FAILED', {
        originalError: error,
      });
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new OnboardingError('Failed to check onboarding status', 'STATUS_CHECK_FAILED', {
          error,
        });
      }

      return !!data?.onboarding_completed_at;
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError(
        'Failed to check onboarding completion',
        'COMPLETION_CHECK_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Reset user's onboarding progress (for testing/admin purposes)
   */
  static async resetOnboardingProgress(userId: string): Promise<void> {
    try {
      // Mark onboarding as incomplete
      const { error: userError } = await supabase
        .from('users')
        .update({
          onboarding_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        throw new OnboardingError('Failed to reset user onboarding', 'USER_RESET_FAILED', {
          userError,
        });
      }

      // Clear profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        throw new OnboardingError('Failed to reset profile data', 'PROFILE_RESET_FAILED', {
          profileError,
        });
      }

      console.log('🔄 [OnboardingService] Onboarding reset for user:', userId);
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to reset onboarding progress', 'RESET_FAILED', {
        originalError: error,
      });
    }
  }
}
