/**
 * Production-grade onboarding context
 * Manages onboarding state and provides actions for the entire onboarding flow
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';

import { OnboardingService, OnboardingError, type OnboardingProgress } from './service';
import type { CompleteOnboardingData, OnboardingStep, ExtendedOnboardingData } from './validation';
import { validateOnboardingStep } from './validation';

// Context state interface
interface OnboardingState {
  // Progress tracking
  progress: OnboardingProgress | null;
  currentStepData: Partial<ExtendedOnboardingData>;

  // Loading states
  loading: boolean;
  saving: boolean;
  initializing: boolean;

  // Error handling
  error: OnboardingError | null;
  stepErrors: Record<string, string>;

  // Completion status
  isCompleted: boolean;

  // User ID mapping
  supabaseUserId: string | null;
}

// Action types
type OnboardingAction =
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: OnboardingProgress | null }
  | { type: 'SET_STEP_DATA'; payload: Partial<ExtendedOnboardingData> }
  | { type: 'MERGE_STEP_DATA'; payload: Partial<ExtendedOnboardingData> }
  | { type: 'SET_ERROR'; payload: OnboardingError | null }
  | { type: 'SET_STEP_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_STEP_ERRORS' }
  | { type: 'SET_COMPLETED'; payload: boolean }
  | { type: 'SET_SUPABASE_USER_ID'; payload: string | null }
  | { type: 'RESET_STATE' };

// Context actions interface
interface OnboardingContextActions {
  // Step management
  saveStep: (step: OnboardingStep, data: any) => Promise<boolean>;
  validateStep: (
    step: OnboardingStep,
    data: any
  ) => { success: boolean; errors?: Record<string, string> };
  goToStep: (step: OnboardingStep) => void;

  // Data management
  updateStepData: (data: Partial<ExtendedOnboardingData>) => void;
  clearStepData: () => void;

  // Completion
  completeOnboarding: () => Promise<boolean>;

  // Utilities
  refreshProgress: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  clearErrors: () => void;

  // Photo upload
  uploadPhoto: (imageUri: string) => Promise<string | null>;
}

// Combined context type
interface OnboardingContextType extends OnboardingState, OnboardingContextActions {}

// Initial state
const initialState: OnboardingState = {
  progress: null,
  currentStepData: {},
  loading: false,
  saving: false,
  initializing: true,
  error: null,
  stepErrors: {},
  isCompleted: false,
  supabaseUserId: null,
};

// Reducer
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_INITIALIZING':
      return { ...state, initializing: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_SAVING':
      return { ...state, saving: action.payload };

    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };

    case 'SET_STEP_DATA':
      return { ...state, currentStepData: action.payload };

    case 'MERGE_STEP_DATA':
      return {
        ...state,
        currentStepData: { ...state.currentStepData, ...action.payload },
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_STEP_ERRORS':
      return { ...state, stepErrors: action.payload };

    case 'CLEAR_STEP_ERRORS':
      return { ...state, stepErrors: {} };

    case 'SET_COMPLETED':
      return { ...state, isCompleted: action.payload };

    case 'SET_SUPABASE_USER_ID':
      return { ...state, supabaseUserId: action.payload };

    case 'RESET_STATE':
      return { ...initialState, initializing: false };

    default:
      return state;
  }
}

// Create context
const OnboardingContext = createContext<OnboardingContextType | null>(null);

// Provider component
interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const { user } = usePrivyAuth();

  // Initialize onboarding state when user is available
  useEffect(() => {
    let isMounted = true;

    const initializeOnboarding = async () => {
      if (!user) {
        dispatch({ type: 'SET_INITIALIZING', payload: false });
        return;
      }

      try {
        dispatch({ type: 'SET_INITIALIZING', payload: true });

        // User sync is already handled by usePrivyAuth hook
        // We don't need to sync here - just check the user data
        console.log('[OnboardingProvider] User available:', {
          id: user.id,
          email: user.email,
          name: user.name,
        });

        // Check if user has email (required for onboarding)
        if (!user.email) {
          console.log('[OnboardingProvider] User has no email, skipping onboarding check');
          dispatch({ type: 'SET_INITIALIZING', payload: false });
          dispatch({ type: 'SET_COMPLETED', payload: false });
          return;
        }

        // For now, we'll use the Privy user ID directly
        // The actual Supabase user ID will be retrieved when needed
        const supabaseUserId = user.id;
        if (!supabaseUserId) {
          // If no user ID, we can't check onboarding
          console.log('[OnboardingProvider] No user ID, cannot check onboarding');
          dispatch({ type: 'SET_INITIALIZING', payload: false });
          return;
        }

        if (supabaseUserId) {
          console.log('[OnboardingProvider] User synced, Supabase ID:', supabaseUserId);
          dispatch({ type: 'SET_SUPABASE_USER_ID', payload: supabaseUserId });
        }

        // Use the Supabase user ID for onboarding checks if available, otherwise fallback to Privy ID
        const userIdForChecks = supabaseUserId || user.id;

        // Now check if onboarding is completed
        console.log('[OnboardingProvider] Checking onboarding for user ID:', userIdForChecks);
        const isCompleted = await OnboardingService.hasCompletedOnboarding(userIdForChecks);
        console.log('[OnboardingProvider] Onboarding completed:', isCompleted);
        dispatch({ type: 'SET_COMPLETED', payload: isCompleted });

        if (!isCompleted) {
          // Get progress and current profile data using the correct ID
          const progress = await OnboardingService.getOnboardingProgress(userIdForChecks);
          const profile = await OnboardingService.getUserProfile(userIdForChecks);

          if (isMounted) {
            dispatch({ type: 'SET_PROGRESS', payload: progress });

            // Convert profile data to step data format
            if (profile) {
              const stepData: Partial<ExtendedOnboardingData> = {};

              if (profile.birth_date) {
                stepData.birthDate = new Date(profile.birth_date);
              }

              if (profile.gender) {
                // Gender is already in the correct format from database
                stepData.gender = profile.gender as 'Male' | 'Female' | 'Other' | 'Prefer not to say';
              }

              if (profile.field_of_study) {
                stepData.major = profile.field_of_study;
              }

              // Note: university_year doesn't map exactly, would need separate handling
              // if (profile.university_year) {
              //   stepData.universityYear = profile.university_year;
              // }

              if (profile.interests) {
                stepData.interests = profile.interests;
              }

              // Map from proper database columns
              if (profile.has_children !== undefined) {
                stepData.hasDependents = profile.has_children ? 'yes' : 'no';
              }

              if (profile.occupation) {
                stepData.lineOfWork = profile.occupation;
              }

              if (profile.ethnicities && profile.ethnicities.length > 0) {
                stepData.ethnicity = profile.ethnicities[0]; // Take first ethnicity
              }

              if (profile.relationship_status) {
                stepData.relationshipType = profile.relationship_status;
              }

              if (profile.wants_children) {
                stepData.wantChildren = profile.wants_children as 'Yes' | 'No' | 'Maybe';
              }

              if (profile.smoking_habits) {
                stepData.smokingHabit = profile.smoking_habits as 'Rarely' | 'Sometimes' | 'Always';
              }

              // Extract remaining fields from bio metadata
              if (profile.bio && profile.bio.includes('__METADATA__:')) {
                const metadataMatch = profile.bio.match(/__METADATA__:(.+)/);
                if (metadataMatch) {
                  try {
                    const metadata = JSON.parse(metadataMatch[1]);
                    if (metadata.timeSinceLastRelationship) {
                      stepData.timeSinceLastRelationship = metadata.timeSinceLastRelationship;
                    }
                    if (metadata.personalityTraits) {
                      stepData.personalityTraits = metadata.personalityTraits;
                    }
                    if (metadata.avatarUrl) {
                      stepData.avatarUrl = metadata.avatarUrl;
                    }
                  } catch (error) {
                    console.warn('Failed to parse metadata from bio:', error);
                  }
                }
              }

              if (profile.bio !== undefined) {
                stepData.bio = profile.bio;
              }

              if (profile.dietary_preferences) {
                stepData.dietaryRestrictions = profile.dietary_preferences;
              }

              if (profile.current_location !== undefined) {
                stepData.location = profile.current_location;
              }

              // avatar_url column doesn't exist - we get it from metadata above
              // if (profile.avatar_url !== undefined) {
              //   stepData.avatarUrl = profile.avatar_url;
              // }

              dispatch({ type: 'SET_STEP_DATA', payload: stepData });
            }
          }
        }
      } catch (error) {
        console.error('❌ [OnboardingProvider] Initialization failed:', error);
        if (isMounted) {
          dispatch({
            type: 'SET_ERROR',
            payload:
              error instanceof OnboardingError
                ? error
                : new OnboardingError('Failed to initialize onboarding', 'INIT_FAILED'),
          });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_INITIALIZING', payload: false });
        }
      }
    };

    initializeOnboarding();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Action implementations
  const saveStep = useCallback(
    async (step: OnboardingStep, data: any): Promise<boolean> => {
      console.log('🚀 [OnboardingContext] saveStep called:', { step, data });
      
      if (!user) {
        console.log('❌ [OnboardingContext] No user available');
        return false;
      }

      // Use Supabase user ID if available, otherwise use Privy ID
      const userIdForSave = state.supabaseUserId || user.id;
      console.log('🔑 [OnboardingContext] Using user ID:', userIdForSave);

      try {
        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'CLEAR_STEP_ERRORS' });

        // Validate step data
        const validation = validateOnboardingStep(step, data);
        console.log('✅ [OnboardingContext] Validation result:', validation);
        
        if (!validation.success) {
          console.log('❌ [OnboardingContext] Validation failed:', validation.errors);
          dispatch({ type: 'SET_STEP_ERRORS', payload: validation.errors || {} });
          return false;
        }

        // Save to database using the correct user ID
        if (validation.data) {
          console.log('📤 [OnboardingContext] Calling OnboardingService.saveOnboardingStep with:', {
            userId: userIdForSave,
            data: validation.data
          });
          
          await OnboardingService.saveOnboardingStep(userIdForSave, validation.data);
          
          console.log('✅ [OnboardingContext] OnboardingService.saveOnboardingStep completed');
          
          // Update local state
          dispatch({ type: 'MERGE_STEP_DATA', payload: validation.data });
        }

        // Refresh progress
        const progress = await OnboardingService.getOnboardingProgress(userIdForSave);
        dispatch({ type: 'SET_PROGRESS', payload: progress });

        console.log('✅ [OnboardingProvider] Step saved successfully:', step);
        return true;
      } catch (error) {
        console.error('❌ [OnboardingProvider] Failed to save step:', error);
        dispatch({
          type: 'SET_ERROR',
          payload:
            error instanceof OnboardingError
              ? error
              : new OnboardingError('Failed to save step', 'SAVE_FAILED'),
        });
        return false;
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    },
    [user, state.supabaseUserId]
  );

  const validateStep = useCallback((step: OnboardingStep, data: any) => {
    return validateOnboardingStep(step, data);
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    dispatch({ type: 'CLEAR_STEP_ERRORS' });
    // Navigation logic would be handled by the consuming component
    console.log('📍 [OnboardingProvider] Navigate to step:', step);
  }, []);

  const updateStepData = useCallback((data: Partial<ExtendedOnboardingData>) => {
    dispatch({ type: 'MERGE_STEP_DATA', payload: data });
  }, []);

  const clearStepData = useCallback(() => {
    dispatch({ type: 'SET_STEP_DATA', payload: {} });
  }, []);

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const userIdForComplete = state.supabaseUserId || user.id;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_STEP_ERRORS' });

      // Complete onboarding with current data
      await OnboardingService.completeOnboarding(
        userIdForComplete,
        state.currentStepData as CompleteOnboardingData
      );

      // Update state
      dispatch({ type: 'SET_COMPLETED', payload: true });

      console.log('🎉 [OnboardingProvider] Onboarding completed!');
      return true;
    } catch (error) {
      console.error('❌ [OnboardingProvider] Failed to complete onboarding:', error);
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof OnboardingError
            ? error
            : new OnboardingError('Failed to complete onboarding', 'COMPLETION_FAILED'),
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, state.currentStepData, state.supabaseUserId]);

  const refreshProgress = useCallback(async () => {
    if (!user) return;

    const userIdForRefresh = state.supabaseUserId || user.id;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const progress = await OnboardingService.getOnboardingProgress(userIdForRefresh);
      dispatch({ type: 'SET_PROGRESS', payload: progress });
    } catch (error) {
      console.error('❌ [OnboardingProvider] Failed to refresh progress:', error);
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof OnboardingError
            ? error
            : new OnboardingError('Failed to refresh progress', 'REFRESH_FAILED'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, state.supabaseUserId]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    const userIdForReset = state.supabaseUserId || user.id;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await OnboardingService.resetOnboardingProgress(userIdForReset);
      dispatch({ type: 'RESET_STATE' });

      // Re-initialize after reset
      const progress = await OnboardingService.getOnboardingProgress(userIdForReset);
      dispatch({ type: 'SET_PROGRESS', payload: progress });
      dispatch({ type: 'SET_COMPLETED', payload: false });

      console.log('🔄 [OnboardingProvider] Onboarding reset');
    } catch (error) {
      console.error('❌ [OnboardingProvider] Failed to reset onboarding:', error);
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof OnboardingError
            ? error
            : new OnboardingError('Failed to reset onboarding', 'RESET_FAILED'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, state.supabaseUserId]);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'CLEAR_STEP_ERRORS' });
  }, []);

  const uploadPhoto = useCallback(
    async (imageUri: string): Promise<string | null> => {
      if (!user) return null;

      const userIdForUpload = state.supabaseUserId || user.id;

      try {
        const uploadedUrl = await OnboardingService.uploadProfilePhoto(userIdForUpload, imageUri);

        // Update step data with new photo URL
        dispatch({ type: 'MERGE_STEP_DATA', payload: { avatarUrl: uploadedUrl } });

        return uploadedUrl;
      } catch (error) {
        console.error('❌ [OnboardingProvider] Failed to upload photo:', error);
        dispatch({
          type: 'SET_ERROR',
          payload:
            error instanceof OnboardingError
              ? error
              : new OnboardingError('Failed to upload photo', 'UPLOAD_FAILED'),
        });
        return null;
      }
    },
    [user, state.supabaseUserId]
  );

  const contextValue: OnboardingContextType = {
    // State
    ...state,

    // Actions
    saveStep,
    validateStep,
    goToStep,
    updateStepData,
    clearStepData,
    completeOnboarding,
    refreshProgress,
    resetOnboarding,
    clearErrors,
    uploadPhoto,
  };

  return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>;
};

// Hook to use onboarding context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  return context;
};

// Export types
export type { OnboardingStep, CompleteOnboardingData, OnboardingProgress };
export { OnboardingError };
