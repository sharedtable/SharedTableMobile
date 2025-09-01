/**
 * Hook to manage personalization flow state, persistence, and completion tracking
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { userPreferencesAPI, CompleteUserPreferences } from '@/services/userPreferencesApi';

const PERSONALIZATION_STORAGE_KEY = 'personalization_data';
const COMPLETION_STORAGE_KEY = 'personalization_completion';

export interface PersonalizationData extends CompleteUserPreferences {
  currentStep?: number;
  completedSteps?: string[];
}

export interface CategoryCompletion {
  dietary: boolean;
  cuisine: boolean;
  dining_style: boolean;
  social: boolean;
  foodie_profile: boolean;
}

export const usePersonalizationFlow = () => {
  const { user } = usePrivyAuth();
  const [data, setData] = useState<PersonalizationData>({});
  const [completion, setCompletion] = useState<CategoryCompletion>({
    dietary: false,
    cuisine: false,
    dining_style: false,
    social: false,
    foodie_profile: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  // Load saved data and completion status on mount
  useEffect(() => {
    loadSavedData();
  }, [user?.id]);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      
      // Load local storage data
      const [savedData, savedCompletion] = await Promise.all([
        AsyncStorage.getItem(PERSONALIZATION_STORAGE_KEY),
        AsyncStorage.getItem(COMPLETION_STORAGE_KEY),
      ]);

      if (savedData) {
        setData(JSON.parse(savedData));
      }

      if (savedCompletion) {
        setCompletion(JSON.parse(savedCompletion));
      }

      // If user is authenticated, check database for existing preferences
      if (user?.id) {
        const dbPreferences = await userPreferencesAPI.getUserPreferences(user.id);
        
        if (dbPreferences) {
          setData(dbPreferences);
          
          // Update completion status based on database data
          const newCompletion: CategoryCompletion = {
            dietary: await userPreferencesAPI.hasCompletedStage(user.id, 'dietary'),
            cuisine: await userPreferencesAPI.hasCompletedStage(user.id, 'cuisine'),
            dining_style: await userPreferencesAPI.hasCompletedStage(user.id, 'dining_style'),
            social: await userPreferencesAPI.hasCompletedStage(user.id, 'social'),
            foodie_profile: await userPreferencesAPI.hasCompletedStage(user.id, 'foodie_profile'),
          };
          
          setCompletion(newCompletion);
          await AsyncStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(newCompletion));
        }
      }
    } catch (error) {
      console.error('Error loading personalization data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save data for a specific step and mark it as completed
   */
  const saveStepData = useCallback(async (step: string, stepData: Record<string, unknown>) => {
    setSavingStep(step);
    setError(null);

    try {
      const updatedData: PersonalizationData = {
        ...data,
        completedSteps: [...new Set([...(data.completedSteps || []), step])],
      };

      // Map step to data structure
      switch (step) {
        case 'dietary':
          updatedData.dietary = stepData as any;
          break;
        case 'cuisine':
          updatedData.cuisine = stepData as any;
          break;
        case 'dining-style':
        case 'dining_style':
          updatedData.dining_style = stepData as any;
          break;
        case 'social':
          if ((stepData as any).social_preferences) {
            const socialPrefs = (stepData as any).social_preferences;
            updatedData.social = {
              social_level: socialPrefs.social_level,
              adventure_level: socialPrefs.adventure_level,
              formality_level: socialPrefs.formality_level,
              interests: socialPrefs.interests,
              goals: socialPrefs.goals,
              languages: socialPrefs.languages,
              social_media: socialPrefs.social_media,
            } as any;
          } else {
            updatedData.social = stepData as any;
          }
          break;
        case 'foodie-profile':
        case 'foodie_profile':
          if ((stepData as any).foodie_profile) {
            updatedData.foodie_profile = (stepData as any).foodie_profile;
          } else {
            updatedData.foodie_profile = stepData as any;
          }
          break;
      }

      setData(updatedData);
      
      // Save to local storage
      await AsyncStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(updatedData));

      // Save to database if user is authenticated
      let saveSuccess = false;
      if (user?.id) {
        saveSuccess = await saveToDatabaseForStep(user.id, step, stepData);
      }

      // Update completion status
      if (saveSuccess) {
        const stepKey = step.replace('-', '_') as keyof CategoryCompletion;
        const newCompletion = {
          ...completion,
          [stepKey]: true,
        };
        
        setCompletion(newCompletion);
        await AsyncStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(newCompletion));
        
        console.log(`✅ Category "${step}" marked as completed`);
      }

      return saveSuccess;
    } catch (error) {
      console.error('Error saving step data:', error);
      setError('Failed to save preferences');
      return false;
    } finally {
      setSavingStep(null);
    }
  }, [data, completion, user?.id]);

  /**
   * Save specific step data to database
   */
  const saveToDatabaseForStep = async (userId: string, step: string, stepData: Record<string, unknown>): Promise<boolean> => {
    try {
      console.log(`📤 Saving ${step} to database for user ${userId}`);
      
      switch (step) {
        case 'dietary':
          await userPreferencesAPI.saveDietaryPreferences(userId, stepData as any);
          break;
        case 'cuisine':
          await userPreferencesAPI.saveCuisinePreferences(userId, stepData as any);
          break;
        case 'dining-style':
        case 'dining_style':
          await userPreferencesAPI.saveDiningStylePreferences(userId, stepData as any);
          break;
        case 'social': {
          const socialData = (stepData.social_preferences || stepData) as any;
          await userPreferencesAPI.saveSocialPreferences(userId, {
            social_level: socialData.social_level || 5,
            adventure_level: socialData.adventure_level || 5,
            formality_level: socialData.formality_level || 5,
            interests: socialData.interests || [],
            goals: socialData.goals || [],
            languages: socialData.languages || [],
            social_media: socialData.social_media || {},
          });
          break;
        }
        case 'foodie-profile':
        case 'foodie_profile': {
          const foodieData = (stepData.foodie_profile || stepData) as any;
          await userPreferencesAPI.saveFoodieProfile(userId, foodieData as any);
          break;
        }
      }

      console.log(`✅ Successfully saved ${step} to database`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving ${step} to database:`, error);
      setError(`Failed to save ${step} preferences to database`);
      return false;
    }
  };

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = useCallback(() => {
    const completedCount = Object.values(completion).filter(Boolean).length;
    return (completedCount / 5) * 100;
  }, [completion]);

  /**
   * Check if a specific step is completed
   */
  const isStepCompleted = useCallback((step: string): boolean => {
    const stepKey = step.replace('-', '_') as keyof CategoryCompletion;
    return completion[stepKey] || false;
  }, [completion]);

  /**
   * Get next incomplete step
   */
  const getNextIncompleteStep = useCallback((): string | null => {
    const steps: Array<keyof CategoryCompletion> = [
      'dietary',
      'cuisine',
      'dining_style',
      'social',
      'foodie_profile',
    ];

    for (const step of steps) {
      if (!completion[step]) {
        return step.replace('_', '-');
      }
    }

    return null;
  }, [completion]);

  /**
   * Complete the personalization flow
   */
  const completePersonalization = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Save all data to database one final time
      await userPreferencesAPI.saveAllPreferences(user.id, data);
      
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(PERSONALIZATION_STORAGE_KEY),
        AsyncStorage.removeItem(COMPLETION_STORAGE_KEY),
      ]);
      
      setData({});
      setCompletion({
        dietary: false,
        cuisine: false,
        dining_style: false,
        social: false,
        foodie_profile: false,
      });
      
      console.log('✅ Personalization flow completed');
      return true;
    } catch (error) {
      console.error('Error completing personalization:', error);
      setError('Failed to complete personalization');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all personalization data
   */
  const clearData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(PERSONALIZATION_STORAGE_KEY),
        AsyncStorage.removeItem(COMPLETION_STORAGE_KEY),
      ]);
      
      setData({});
      setCompletion({
        dietary: false,
        cuisine: false,
        dining_style: false,
        social: false,
        foodie_profile: false,
      });
    } catch (error) {
      console.error('Error clearing personalization data:', error);
    }
  };

  /**
   * Reload completion status from database
   */
  const refreshCompletionStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const newCompletion: CategoryCompletion = {
        dietary: await userPreferencesAPI.hasCompletedStage(user.id, 'dietary'),
        cuisine: await userPreferencesAPI.hasCompletedStage(user.id, 'cuisine'),
        dining_style: await userPreferencesAPI.hasCompletedStage(user.id, 'dining_style'),
        social: await userPreferencesAPI.hasCompletedStage(user.id, 'social'),
        foodie_profile: await userPreferencesAPI.hasCompletedStage(user.id, 'foodie_profile'),
      };
      
      setCompletion(newCompletion);
      await AsyncStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(newCompletion));
    } catch (error) {
      console.error('Error refreshing completion status:', error);
    }
  }, [user?.id]);

  return {
    data,
    completion,
    loading,
    error,
    savingStep,
    saveStepData,
    completePersonalization,
    clearData,
    isStepCompleted,
    getCompletionPercentage,
    getNextIncompleteStep,
    refreshCompletionStatus,
  };
};