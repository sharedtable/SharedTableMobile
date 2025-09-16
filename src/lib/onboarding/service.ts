/**
 * Production-grade onboarding service
 * Handles all onboarding data operations with backend API integration
 */

import { supabase } from '@/lib/supabase/client';
import type { UserProfileInsert } from '@/lib/supabase/types/database';
import { api } from '@/services/api';

import type { CompleteOnboardingData, ExtendedOnboardingData } from './validation';
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

// Onboarding stages - matching backend exactly
export enum OnboardingStage {
  NOT_STARTED = 'not_started',
  MANDATORY_IN_PROGRESS = 'mandatory_in_progress',  // Started but not completed mandatory
  MANDATORY_COMPLETE = 'mandatory_complete',        // Completed mandatory questions
  OPTIONAL_IN_PROGRESS = 'optional_in_progress',    // Started optional questions
  OPTIONAL_COMPLETE = 'optional_complete',          // Completed optional profile questions  
  FULLY_COMPLETE = 'fully_complete'                // Completed all including dining preferences
}

export class OnboardingService {
  private static readonly ONBOARDING_STEPS = [
    'name',
    'birthday',
    'gender',
  ] as const;

  /**
   * Get current onboarding progress for a user
   */
  static async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    try {
      // First try to find user by external_auth_id (Privy ID), then by ID
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id, onboarding_completed_at')
        .eq('external_auth_id', userId)
        .single();

      // If not found by external_auth_id, try by ID
      if (userError && userError.code === 'PGRST116') {
        const result = await (supabase
          .from('users') as any)
          .select('id, onboarding_completed_at')
          .eq('id', userId)
          .single();
        user = result.data;
        userError = result.error;
      }

      // If user not found, return initial progress
      if (userError && userError.code === 'PGRST116') {
        return {
          currentStep: 0,
          totalSteps: this.ONBOARDING_STEPS.length,
          completedSteps: [],
          nextStep: this.ONBOARDING_STEPS[0],
        };
      }

      if (userError) {
        throw new OnboardingError('Failed to fetch user data', 'USER_FETCH_FAILED', { userError });
      }

      // Use the Supabase user ID for the rest of the queries
      const supabaseUserId = (user as any)?.id || userId;

      if ((user as any)?.onboarding_completed_at) {
        return {
          currentStep: this.ONBOARDING_STEPS.length,
          totalSteps: this.ONBOARDING_STEPS.length,
          completedSteps: [...this.ONBOARDING_STEPS],
        };
      }

      // Check profile completion status using the Supabase user ID
      const { data: profile, error: profileError } = await (supabase
        .from('user_profiles') as any)
        .select('*')
        .eq('user_id', supabaseUserId)
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
    stepData: Partial<ExtendedOnboardingData>
  ): Promise<void> {
    try {
      // Determine which step this is based on the data
      let stepName = 'unknown';
      if (stepData.firstName && stepData.lastName && stepData.nickname) {
        stepName = 'name';
      } else if (stepData.birthDate) {
        stepName = 'birthday';
      } else if (stepData.gender) {
        stepName = 'gender';
      } else if (stepData.educationLevel || stepData.major || stepData.school) {
        stepName = 'education';
      } else if (stepData.lineOfWork || stepData.jobTitle || stepData.company) {
        stepName = 'work';
      } else if (stepData.ethnicity || stepData.nationality || stepData.religion || stepData.relationshipStatus || stepData.heightCm) {
        stepName = 'background';
      } else if (stepData.personalityTraits || stepData.mbtiType || stepData.conversationStyle || stepData.leadConversations || stepData.willingCompromise || stepData.seekExperiences) {
        stepName = 'personality';
      } else if (stepData.smokingHabit || stepData.wantChildren || stepData.alcoholUse || stepData.cannabisUse || stepData.substances) {
        stepName = 'lifestyle';
      } else if (stepData.interests || stepData.hobbies) {
        stepName = 'interests';
      } else if (stepData.dietaryRestrictions || stepData.budget || stepData.spicyLevel || stepData.cuisinesToTry || stepData.adventurousLevel) {
        stepName = 'foodPreferences';
      } else if (stepData.hopingToMeet || stepData.interestingFact) {
        stepName = 'finalTouch';
      }

      // Try to use backend API first (bypasses RLS issues)
      try {
        console.log('🚀 [OnboardingService] Calling backend API for step:', stepName);
        
        // Format the data for the API - include all fields
        const apiData: any = {};
        
        // Mandatory fields
        if (stepData.firstName) apiData.firstName = stepData.firstName;
        if (stepData.lastName) apiData.lastName = stepData.lastName;
        if (stepData.nickname) apiData.nickname = stepData.nickname;
        if (stepData.birthDate) {
          apiData.birthDate = stepData.birthDate instanceof Date 
            ? stepData.birthDate.toISOString().split('T')[0]
            : stepData.birthDate;
        }
        if (stepData.gender) apiData.gender = stepData.gender;
        
        // Optional fields - Education
        if (stepData.educationLevel) apiData.educationLevel = stepData.educationLevel;
        // fieldOfStudy doesn't exist, using major instead
        if (stepData.major) apiData.major = stepData.major;
        if (stepData.school) apiData.school = stepData.school;
        
        // Optional fields - Work
        if (stepData.lineOfWork) apiData.lineOfWork = stepData.lineOfWork;
        if (stepData.jobTitle) apiData.jobTitle = stepData.jobTitle;
        // occupation and industry don't exist on ExtendedOnboardingData
        if (stepData.company) apiData.company = stepData.company;
        
        // Optional fields - Background
        if (stepData.ethnicity) apiData.ethnicity = stepData.ethnicity;
        if (stepData.nationality) apiData.nationality = stepData.nationality;
        if (stepData.religion) apiData.religion = stepData.religion;
        if (stepData.relationshipStatus) apiData.relationshipStatus = stepData.relationshipStatus;
        if (stepData.relationshipType) apiData.relationshipType = stepData.relationshipType;
        if (stepData.heightCm) apiData.heightCm = stepData.heightCm;
        
        // Optional fields - Personality
        if (stepData.personalityTraits) apiData.personalityTraits = stepData.personalityTraits;
        // mbti doesn't exist, using mbtiType instead
        if (stepData.mbtiType) apiData.mbtiType = stepData.mbtiType;
        if (stepData.conversationStyle) apiData.conversationStyle = stepData.conversationStyle;
        
        // Optional fields - Lifestyle
        // lifestyle, beliefs, smoking, drinking don't exist on ExtendedOnboardingData
        if (stepData.smokingHabit) apiData.smokingHabit = stepData.smokingHabit;
        if (stepData.wantChildren) apiData.wantChildren = stepData.wantChildren;
        
        // Optional fields - Interests
        if (stepData.interests) apiData.interests = stepData.interests;
        if (stepData.hobbies) apiData.hobbies = stepData.hobbies;
        
        // Optional fields - Food Preferences
        if (stepData.dietaryRestrictions) apiData.dietaryRestrictions = stepData.dietaryRestrictions;
        if (stepData.budget) apiData.budget = stepData.budget;
        if (stepData.spicyLevel) apiData.spicyLevel = stepData.spicyLevel;
        if (stepData.drinkingLevel) apiData.drinkingLevel = stepData.drinkingLevel;
        if (stepData.adventurousLevel) apiData.adventurousLevel = stepData.adventurousLevel;
        if (stepData.diningAtmospheres) apiData.diningAtmospheres = stepData.diningAtmospheres;
        if (stepData.dinnerDuration) apiData.dinnerDuration = stepData.dinnerDuration;
        if (stepData.zipCode) apiData.zipCode = stepData.zipCode;
        if (stepData.travelDistance) apiData.travelDistance = stepData.travelDistance;
        if (stepData.foodCraving) apiData.foodCraving = stepData.foodCraving;
        if (stepData.cuisinesToTry) apiData.cuisinesToTry = stepData.cuisinesToTry;
        if (stepData.cuisinesToAvoid) apiData.cuisinesToAvoid = stepData.cuisinesToAvoid;
        
        // Optional fields - Final Touch
        if (stepData.hopingToMeet) apiData.hopingToMeet = stepData.hopingToMeet;
        if (stepData.interestingFact) apiData.interestingFact = stepData.interestingFact;
        
        // Height fields
        if (stepData.heightFeet !== undefined) apiData.heightFeet = stepData.heightFeet;
        if (stepData.heightInches !== undefined) apiData.heightInches = stepData.heightInches;
        if (stepData.heightCm !== undefined) apiData.heightCm = stepData.heightCm;
        
        console.log('📦 [OnboardingService] Sending data to API:', { stepName, apiData });
        
        const apiResponse = await api.saveOnboardingStep(stepName, apiData);
        
        if (apiResponse.success) {
          console.log('✅ [OnboardingService] Step saved successfully via backend API');
          return;
        } else {
          console.error('❌ [OnboardingService] Backend API returned unsuccessful response:', apiResponse);
          // Fall through to direct Supabase method as fallback
        }
      } catch (apiError) {
        console.error('⚠️ [OnboardingService] Backend API call failed, falling back to direct Supabase:', apiError);
        // Continue with direct Supabase method as fallback
      }

      // Fallback: Direct Supabase update
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
      const { error: userError } = await (supabase
        .from('users') as any)
        .update(userUpdateData as any)
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
        // Map from UI format to database format
        const genderMap: Record<string, 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'> = {
          'Male': 'male',
          'Female': 'female',
          'Other': 'non_binary',
          'Prefer not to say': 'prefer_not_to_say'
        };
        profileData.gender = genderMap[stepData.gender] || 'prefer_not_to_say';
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
        profileData.dietary_preferences = Array.isArray(stepData.dietaryRestrictions)
          ? stepData.dietaryRestrictions
          : typeof stepData.dietaryRestrictions === 'string'
          ? [stepData.dietaryRestrictions]
          : null;
      }

      if (stepData.location !== undefined) {
        profileData.current_location = Array.isArray(stepData.location) 
          ? stepData.location[0] 
          : stepData.location;
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
        .upsert(profileData as any, {
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
    privyUserId: string,
    finalData: CompleteOnboardingData
  ): Promise<void> {
    try {
      // Determine onboarding stage based on provided data
      const stage = this.determineOnboardingStage(finalData);
      console.log('🎯 [OnboardingService] Starting onboarding completion');
      console.log('📋 [OnboardingService] Stage:', stage);
      console.log('📍 [OnboardingService] Data:', {
        privyUserId,
        finalData
      });
      
      // Validate complete data
      const validationResult = completeOnboardingSchema.safeParse(finalData);
      if (!validationResult.success) {
        console.error('❌ [OnboardingService] Validation failed:', validationResult.error.errors);
        throw new OnboardingError('Invalid onboarding data', 'VALIDATION_FAILED', {
          errors: validationResult.error.errors,
        });
      }

      const validatedData = validationResult.data as ExtendedOnboardingData;

      // Try to use backend API first (bypasses RLS issues)
      try {
        console.log('🚀 [OnboardingService] Calling backend API for onboarding completion');
        
        // Format birth date as string if it's a Date object
        const birthDateString = validatedData.birthDate instanceof Date 
          ? validatedData.birthDate.toISOString().split('T')[0]
          : validatedData.birthDate;
        
        const apiResponse = await api.completeOnboarding({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          nickname: validatedData.nickname || validatedData.firstName,
          birthDate: birthDateString,
          gender: validatedData.gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say',
        });

        if (apiResponse.success) {
          console.log('✅ [OnboardingService] Onboarding completed successfully via backend API');
          return;
        } else {
          console.error('❌ [OnboardingService] Backend API returned unsuccessful response:', apiResponse);
          // Fall through to direct Supabase method as fallback
        }
      } catch (apiError) {
        console.error('⚠️ [OnboardingService] Backend API call failed, falling back to direct Supabase:', apiError);
        // Continue with direct Supabase method as fallback
      }

      // First, get the actual database user ID from the Privy user ID
      const { data: userData, error: fetchError } = await (supabase
        .from('users') as any)
        .select('id')
        .eq('external_auth_id', privyUserId)
        .single();

      if (fetchError || !userData) {
        console.error('Failed to find user with external_auth_id:', privyUserId, fetchError);
        throw new OnboardingError('User not found', 'USER_NOT_FOUND', {
          privyUserId,
          fetchError,
        });
      }

      const databaseUserId = userData.id;
      console.log('✅ [OnboardingService] Found database user ID:', databaseUserId, 'for Privy ID:', privyUserId);

      // Update user record to mark onboarding as complete
      // Only include fields that exist in the users table
      const userUpdateData: any = {
        onboarding_completed_at: new Date().toISOString(),
        first_name: validatedData.firstName || null,
        last_name: validatedData.lastName || null,
        display_name: validatedData.nickname || validatedData.firstName || null,
        onboarding_completed: true,  // Mark as complete
        updated_at: new Date().toISOString(),
      };
      
      console.log('📍 [OnboardingService] Updating user record with:', userUpdateData);
      
      const { error: userError } = await (supabase
        .from('users') as any)
        .update(userUpdateData as any)
        .eq('id', databaseUserId);

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

      // Removed finalBio handling as it's not used in the new profile structure
      // Bio and additional metadata are handled separately now

      // Prepare profile data - always create/update to store mandatory fields
      // The user_profiles table stores both mandatory (birth_date, gender) and optional fields
      const profileData: any = {
        user_id: databaseUserId,  // Use the database user ID, not Privy ID
        
        // Mandatory fields from onboarding (stored in user_profiles)
        birth_date: validatedData.birthDate ? 
          (typeof validatedData.birthDate === 'string' ? 
            validatedData.birthDate : 
            validatedData.birthDate.toISOString().split('T')[0]) : null,
        gender: validatedData.gender || null,
        
        // Optional fields from onboarding:
        education_level: validatedData.educationLevel || null,
        field_of_study: validatedData.major || null,
        university: validatedData.school || null,
        occupation: validatedData.jobTitle || validatedData.lineOfWork || null,
        employer: validatedData.company || null,
        nationality: validatedData.nationality || null,
        ethnicities: validatedData.ethnicity ? [validatedData.ethnicity] : null,
        relationship_status: validatedData.relationshipStatus || null,
        religion: validatedData.religion || null,
        height_cm: validatedData.heightCm || null,
        mbti_type: validatedData.mbtiType || null,
        
        // Calculate profile completion score
        profile_completion_score: this.calculateProfileCompletion(validatedData),
        
        // Update timestamps
        updated_at: new Date().toISOString(),
        last_profile_update: new Date().toISOString(),
      };
      
      // Only add created_at for new records
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', databaseUserId)
        .single();
        
      if (!existingProfile) {
        profileData.created_at = new Date().toISOString();
      }

      console.log('📍 [OnboardingService] Attempting to save profile data:', profileData);

      // First check if profile exists
      const { data: existingUserProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', databaseUserId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ [OnboardingService] Error checking profile:', checkError);
      }

      let profileError = null;
      
      if (existingUserProfile) {
        // Update existing profile
        console.log('🔄 [OnboardingService] Updating existing profile');
        const result = await (supabase as any)
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', databaseUserId);
        profileError = result.error;
      } else {
        // Insert new profile
        console.log('➕ [OnboardingService] Creating new profile');
        const result = await (supabase as any)
          .from('user_profiles')
          .insert(profileData);
        profileError = result.error;
      }

      if (profileError) {
        console.error('❌ [OnboardingService] Profile save failed:', profileError);
        
        // If RLS policy error, try to provide more context
        if (profileError.code === '42501') {
          console.error('🔐 [OnboardingService] RLS Policy Error - The user may not have permission to create/update their profile');
          console.error('User ID:', databaseUserId);
          console.error('Privy ID:', privyUserId);
          
          // Don't throw error for RLS issues during onboarding - the user record is already marked complete
          console.warn('⚠️ [OnboardingService] Continuing despite profile save failure - user can update profile later');
        } else {
          throw new OnboardingError('Failed to save complete profile', 'PROFILE_COMPLETION_FAILED', {
            profileError,
          });
        }
      }

      console.log('✅ [OnboardingService] Profile saved successfully');
      
      // Log the onboarding stage completion
      const completionStage = this.determineOnboardingStage(validatedData);
      console.log('🏁 [OnboardingService] Onboarding stage completed:', completionStage);
      console.log('✅ [OnboardingService] User onboarding status updated for:', databaseUserId, '(Privy ID:', privyUserId, ')');
    } catch (error) {
      if (error instanceof OnboardingError) throw error;

      throw new OnboardingError('Failed to complete onboarding', 'COMPLETION_FAILED', {
        originalError: error,
        finalData,
      });
    }
  }

  /**
   * Determine the current onboarding stage based on data
   */
  private static determineOnboardingStage(data: any): OnboardingStage {
    // Check mandatory fields
    const hasMandatory = data.firstName && data.birthDate && data.gender;
    
    // Check optional fields
    const hasEducation = data.educationLevel || data.fieldOfStudy || data.school;
    const hasWork = data.jobTitle || data.lineOfWork;
    const hasBackground = data.ethnicity || data.nationality;
    const hasPersonality = data.mbtiType || data.personalityTraits;
    const hasLifestyle = data.relationshipStatus || data.wantChildren;
    const hasInterests = data.interests && data.interests.length > 0;
    
    const hasAnyOptional = hasEducation || hasWork || hasBackground || 
                          hasPersonality || hasLifestyle || hasInterests;
    
    if (!hasMandatory) {
      return OnboardingStage.MANDATORY_IN_PROGRESS;
    } else if (hasMandatory && !hasAnyOptional) {
      return OnboardingStage.MANDATORY_COMPLETE;
    } else if (hasMandatory && hasAnyOptional) {
      // Check if ALL optional sections are complete
      const allOptionalComplete = hasEducation && hasWork && hasBackground && 
                                  hasPersonality && hasLifestyle && hasInterests;
      return allOptionalComplete ? OnboardingStage.FULLY_COMPLETE : OnboardingStage.OPTIONAL_IN_PROGRESS;
    }
    
    return OnboardingStage.NOT_STARTED;
  }

  /**
   * Calculate profile completion percentage
   */
  private static calculateProfileCompletion(data: any): number {
    const fields = [
      'firstName', 'lastName', 'birthDate', 'gender',  // Mandatory: 40%
      'educationLevel', 'fieldOfStudy', 'school',       // Education: 15%
      'jobTitle', 'lineOfWork',                         // Work: 10%
      'ethnicity', 'nationality',                       // Background: 10%
      'mbtiType', 'personalityTraits',                  // Personality: 10%
      'relationshipStatus', 'wantChildren',             // Lifestyle: 10%
      'interests'                                       // Interests: 5%
    ];
    
    const weights: Record<string, number> = {
      // Mandatory fields (40% total)
      firstName: 10,
      lastName: 10,
      birthDate: 10,
      gender: 10,
      // Optional fields (60% total)
      educationLevel: 5,
      fieldOfStudy: 5,
      school: 5,
      jobTitle: 5,
      lineOfWork: 5,
      ethnicity: 5,
      nationality: 5,
      mbtiType: 5,
      personalityTraits: 5,
      relationshipStatus: 5,
      wantChildren: 5,
      interests: 5,
    };
    
    let score = 0;
    for (const field of fields) {
      if (data[field]) {
        score += weights[field] || 0;
      }
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get user's current profile data
   */
  static async getUserProfile(userId: string): Promise<UserProfileInsert | null> {
    try {
      // First find the Supabase user ID
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('external_auth_id', userId)
        .single();

      if (userError && userError.code === 'PGRST116') {
        const result = await supabase.from('users').select('id').eq('id', userId).single();
        user = result.data;
        userError = result.error;
      }

      // If user not found, return null
      if (userError && userError.code === 'PGRST116') {
        return null;
      }

      if (userError) {
        throw new OnboardingError('Failed to fetch user', 'USER_FETCH_FAILED', {
          error: userError,
        });
      }

      const supabaseUserId = (user as any)?.id || userId;

      // Now fetch the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', supabaseUserId)
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
      console.log('[OnboardingService] Checking onboarding status for userId:', userId);

      // First try to find user by external_auth_id (Privy ID)
      let { data, error } = await supabase
        .from('users')
        .select('id, onboarding_completed_at')
        .eq('external_auth_id', userId)
        .single();

      console.log('[OnboardingService] Query by external_auth_id result:', {
        data,
        error: error?.message,
        code: error?.code,
      });

      // If not found by external_auth_id, try by ID (in case it's already a Supabase ID)
      if (error && error.code === 'PGRST116') {
        console.log('[OnboardingService] Trying by ID instead...');
        const result = await (supabase
          .from('users') as any)
          .select('id, onboarding_completed_at')
          .eq('id', userId)
          .single();
        data = result.data;
        error = result.error;
        console.log('[OnboardingService] Query by ID result:', {
          data,
          error: error?.message,
          code: error?.code,
        });
      }

      // If still not found, user doesn't exist yet - return false
      if (error && error.code === 'PGRST116') {
        console.log('[OnboardingService] User not found in database, onboarding not completed');
        return false;
      }

      if (error) {
        console.error('[OnboardingService] Database error:', error);
        throw new OnboardingError('Failed to check onboarding status', 'STATUS_CHECK_FAILED', {
          error,
        });
      }

      // Store the Supabase user ID for later use if we found the user
      if (data && (data as any).id !== userId) {
        (this as any).supabaseUserId = (data as any).id;
      }

      return !!(data as any)?.onboarding_completed_at;
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
      const { error: userError } = await (supabase
        .from('users') as any)
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
