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
    'dependents',
    'work',
    'ethnicity',
    'relationship',
    'lifestyle',
    'interests',
    'personality',
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
      // Prepare user update data
      const userUpdateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update first/last name if they exist in step data
      if (stepData.firstName) {
        userUpdateData.first_name = stepData.firstName;
      }
      if (stepData.lastName) {
        userUpdateData.last_name = stepData.lastName;
      }
      if (stepData.firstName && stepData.lastName) {
        userUpdateData.display_name = `${stepData.firstName} ${stepData.lastName}`;
      }

      // Ensure user record exists and is updated
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', userId);

      if (userError) {
        console.error('❌ [OnboardingService] User update error:', userError);
        throw new OnboardingError('Failed to update user record', 'USER_UPDATE_FAILED', {
          userError,
        });
      }

      // Check if profile exists first - use user_id since 'id' column doesn't exist
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      // Ignore "not found" errors - profile just doesn't exist yet
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('❌ [OnboardingService] Profile check error:', profileCheckError);
      }

      // Prepare profile data for database
      const profileData: Partial<UserProfileInsert> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      // Only set created_at for new profiles
      if (!existingProfile) {
        profileData.created_at = new Date().toISOString();
      }

      // Map onboarding data to database fields
      if (stepData.birthDate) {
        profileData.birth_date = stepData.birthDate.toISOString().split('T')[0];
      }

      if (stepData.gender) {
        profileData.gender = stepData.gender;
      }

      if (stepData.major) {
        profileData.field_of_study = stepData.major;
      }

      if (stepData.universityYear) {
        // Store university year in bio metadata since we don't have exact mapping
        // profileData.university_year = stepData.universityYear;
      }

      if (stepData.interests) {
        profileData.interests = stepData.interests;
      }

      // Note: personality_traits column doesn't exist in database yet
      // We'll store it in additionalData instead
      // if (stepData.personalityTraits) {
      //   profileData.personality_traits = stepData.personalityTraits;
      // }

      if (stepData.bio !== undefined) {
        profileData.bio = stepData.bio;
      }

      if (stepData.dietaryRestrictions !== undefined) {
        profileData.dietary_preferences = stepData.dietaryRestrictions;
      }

      if (stepData.location !== undefined) {
        profileData.current_location = stepData.location;
      }

      // Note: avatar_url column doesn't exist in database yet
      // Store it in additionalData instead
      // if (stepData.avatarUrl !== undefined) {
      //   profileData.avatar_url = stepData.avatarUrl;
      // }

      // Map onboarding data to proper database columns
      if (stepData.hasDependents !== undefined) {
        profileData.has_children = stepData.hasDependents === 'yes';
        console.log(
          '🔍 [OnboardingService] Mapping hasDependents:',
          stepData.hasDependents,
          '→',
          profileData.has_children
        );
      }

      if (stepData.lineOfWork !== undefined) {
        profileData.occupation = stepData.lineOfWork;
        console.log(
          '🔍 [OnboardingService] Mapping lineOfWork:',
          stepData.lineOfWork,
          '→',
          profileData.occupation
        );
      }

      if (stepData.ethnicity !== undefined) {
        profileData.ethnicities = [stepData.ethnicity]; // Array field
        console.log(
          '🔍 [OnboardingService] Mapping ethnicity:',
          stepData.ethnicity,
          '→',
          profileData.ethnicities
        );
      }

      if (stepData.relationshipType !== undefined) {
        // Map user-friendly values to database enum values
        const relationshipTypeMap: Record<string, string> = {
          Single: 'single',
          'In relationship': 'in_relationship',
          Married: 'married',
          Divorced: 'divorced',
          Other: 'single', // Default to single for Other
        };

        const mappedValue = relationshipTypeMap[stepData.relationshipType];

        if (!mappedValue) {
          console.error(
            '❌ [OnboardingService] Unknown relationshipType:',
            stepData.relationshipType
          );
          console.error(
            '❌ [OnboardingService] Available mappings:',
            Object.keys(relationshipTypeMap)
          );
          throw new OnboardingError(
            `Invalid relationship type: ${stepData.relationshipType}`,
            'INVALID_RELATIONSHIP_TYPE'
          );
        }

        profileData.relationship_status = mappedValue;
      }

      if (stepData.wantChildren !== undefined) {
        profileData.wants_children = stepData.wantChildren;
      }

      if (stepData.smokingHabit !== undefined) {
        profileData.smoking_habits = stepData.smokingHabit;
      }

      // Store additional fields that don't have dedicated database columns yet
      const additionalData: Record<string, unknown> = {};

      if (stepData.timeSinceLastRelationship !== undefined) {
        additionalData.timeSinceLastRelationship = stepData.timeSinceLastRelationship;
      }

      if (stepData.personalityTraits !== undefined) {
        additionalData.personalityTraits = stepData.personalityTraits;
      }

      if (stepData.avatarUrl !== undefined) {
        additionalData.avatarUrl = stepData.avatarUrl;
      }

      // Store additional data in bio field temporarily (or create a metadata field)
      if (Object.keys(additionalData).length > 0) {
        const existingBio = profileData.bio || '';
        const metadataString = `\n__METADATA__:${JSON.stringify(additionalData)}`;
        profileData.bio = existingBio + metadataString;
      }

      // Upsert profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData as UserProfileInsert, {
          onConflict: 'user_id',
        })
        .select();

      if (profileError) {
        console.error('❌ [OnboardingService] Database error:', profileError);

        // Handle specific database constraint errors
        if (
          profileError.code === '22P02' &&
          profileError.message?.includes('relationship_status')
        ) {
          const relationshipValue = profileData.relationship_status;
          console.error(
            `❌ [OnboardingService] Invalid relationship_status value: "${relationshipValue}"`
          );
          console.error(
            '❌ [OnboardingService] Valid values should be: single, in_relationship, married, divorced'
          );
          throw new OnboardingError(
            `Invalid relationship status. Please select a valid option.`,
            'INVALID_RELATIONSHIP_STATUS',
            {
              invalidValue: relationshipValue,
              validValues: ['single', 'in_relationship', 'married', 'divorced'],
              originalError: profileError,
            }
          );
        }

        throw new OnboardingError('Failed to save profile data', 'PROFILE_SAVE_FAILED', {
          profileError,
          profileData,
        });
      }

      console.log('✅ [OnboardingService] Step saved successfully');
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
      // Note: Some fields like personality_traits and avatar_url don't exist in the actual database
      // Store them in bio field as JSON metadata for now
      const additionalData: Record<string, unknown> = {};
      if (validatedData.personalityTraits) {
        additionalData.personalityTraits = validatedData.personalityTraits;
      }
      if (validatedData.avatarUrl) {
        additionalData.avatarUrl = validatedData.avatarUrl;
      }

      let finalBio = validatedData.bio || '';
      if (Object.keys(additionalData).length > 0) {
        const metadataString = `\n__METADATA__:${JSON.stringify(additionalData)}`;
        finalBio = finalBio + metadataString;
      }

      const profileData = {
        user_id: userId,
        bio: finalBio,
        birth_date: validatedData.birthDate.toISOString().split('T')[0],
        gender: validatedData.gender,
        dietary_preferences: validatedData.dietaryRestrictions,
        interests: validatedData.interests,
        current_location: validatedData.location,
        field_of_study: validatedData.major,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserProfileInsert;

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
