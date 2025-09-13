/**
 * Simplified onboarding context for managing onboarding form data
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

import { __DEV__, devLog } from '@/utils/env';
import { OnboardingAPI } from '@/services/api/onboardingApi';

import type { ExtendedOnboardingData, OnboardingStep } from './validation';
import { validateOnboardingStep } from './validation';

interface OnboardingContextType {
  // Current step data
  currentStepData: Partial<ExtendedOnboardingData>;

  // Actions
  saveStep: (step: OnboardingStep, data: any) => Promise<boolean>;
  validateStep: (
    step: OnboardingStep,
    data: any
  ) => { success: boolean; errors?: Record<string, string> };
  updateStepData: (data: Partial<ExtendedOnboardingData>) => void;
  clearStepData: () => void;
  clearErrors: () => void;
  uploadPhoto: (imageUri: string) => Promise<string | null>;

  // State
  saving: boolean;
  stepErrors: Record<string, string>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
  initialData?: any;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children, initialData }) => {
  // Map API response to onboarding data structure if initial data is provided
  const mapInitialData = (data: any): Partial<ExtendedOnboardingData> => {
    if (!data) return {};
    
    const mapped = {
      // Basic info (if available)
      firstName: data.first_name,
      lastName: data.last_name,
      nickname: data.display_name || data.nickname,
      gender: data.gender,
      birthDate: data.birthday || data.date_of_birth,
      
      // Education & Work
      education: data.education,
      educationLevel: data.education_level || data.education,
      school: data.school,
      work: data.work || data.profession,
      jobTitle: data.job_title || data.profession || data.work,
      lineOfWork: data.line_of_work || data.industry,
      company: data.company,
      
      // Background
      nationality: data.nationality,
      ethnicity: data.ethnicity,
      religion: data.religion,
      relationshipStatus: data.relationship_status,
      heightFeet: data.height_feet,
      heightInches: data.height_inches,
      heightCm: data.height_cm,
      
      // Personality
      personalityType: data.personality_type,
      mbtiType: data.mbti_type || data.personality_type,
      roles: data.roles ? 
        (Array.isArray(data.roles) ? data.roles : [data.roles]) : 
        undefined,
      personalityTraits: data.personality_traits,
      
      // Lifestyle
      lifestyle: data.lifestyle,
      substances: data.substances ? 
        (Array.isArray(data.substances) ? data.substances : [data.substances]) : 
        undefined,
      earlyBirdNightOwl: data.early_bird_night_owl,
      activePerson: data.active_person,
      punctuality: data.punctuality,
      workLifeBalance: data.work_life_balance,
      
      // Food Preferences
      dietaryRestrictions: (() => {
        if (!data.dietary_restrictions || 
            (Array.isArray(data.dietary_restrictions) && data.dietary_restrictions.length === 0)) {
          return ['No restrictions'];
        }
        return Array.isArray(data.dietary_restrictions) ? 
          data.dietary_restrictions : 
          [data.dietary_restrictions];
      })(),
      budget: data.food_budget, // Map food_budget to budget (used by the screen)
      foodBudget: data.food_budget, // Keep both for compatibility
      spicyLevel: data.spicy_level,
      drinkingLevel: data.drinking_level,
      adventurousLevel: data.adventurous_level,
      dinnerDuration: data.dinner_duration || '',
      foodCraving: data.food_craving ? 
        (Array.isArray(data.food_craving) ? data.food_craving : [data.food_craving]) : 
        [],
      cuisinesToTry: data.cuisines_to_try ? 
        (Array.isArray(data.cuisines_to_try) ? data.cuisines_to_try : [data.cuisines_to_try]) : 
        undefined,
      cuisinesToAvoid: data.cuisines_to_avoid ? 
        (Array.isArray(data.cuisines_to_avoid) ? data.cuisines_to_avoid : [data.cuisines_to_avoid]) : 
        undefined,
      diningAtmospheres: data.dining_atmospheres ? 
        (Array.isArray(data.dining_atmospheres) ? data.dining_atmospheres : [data.dining_atmospheres]) : 
        undefined,
      
      // Interests & Hobbies
      interests: data.interests,
      hobbies: data.hobbies,
      timeActivities: data.time_activities,
      socialFrequency: data.social_frequency,
      hopingToMeet: data.hoping_to_meet,
      hopingToMeetTypes: data.hoping_to_meet_types,
      hopingToMeetSpecifics: data.hoping_to_meet_specifics,
      interestingFact: data.interesting_fact,
      
      // Location
      zipcode: data.zipcode,
      travelDistance: data.travel_distance,
    };
    
    return mapped;
  };
  
  const [currentStepData, setCurrentStepData] = useState<Partial<ExtendedOnboardingData>>(() => {
    return mapInitialData(initialData);
  });
  const [saving, setSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const saveStep = useCallback(async (step: OnboardingStep, data: any): Promise<boolean> => {
    try {
      setSaving(true);
      setStepErrors({});

      // Validate the step
      const validation = validateOnboardingStep(step, data);
      if (!validation.success) {
        setStepErrors(validation.errors || {});
        setSaving(false);
        return false;
      }

      // Update local state first
      const updatedData = { ...currentStepData, ...data };
      setCurrentStepData(updatedData);

      // Save ALL steps to backend, not just mandatory ones
      try {
        // Prepare data for backend - send all the data for this step
        const apiData: Record<string, unknown> = { ...data };
        
        // Handle date conversion if needed
        if (apiData.birthDate && typeof apiData.birthDate === 'object' && 'toISOString' in apiData.birthDate) {
          apiData.birthDate = (apiData.birthDate as Date).toISOString();
        }
        
        console.log(`📤 Saving ${step} to backend:`, apiData);
        await OnboardingAPI.saveStep({ step, data: apiData });
        
        // After gender step, mark mandatory onboarding as complete but don't call completeOnboarding
        // The full onboarding completion will happen at the Photo screen (last optional step)
        if (step === 'gender') {
          if (!updatedData.firstName || !updatedData.lastName || !updatedData.nickname || !updatedData.birthDate || !updatedData.gender) {
            throw new Error('Missing required onboarding data');
          }
          // Just validate that we have the mandatory data, but don't complete onboarding yet
          console.log('✅ Mandatory onboarding data collected, continuing with optional screens');
        }
      } catch (error) {
        if (__DEV__) {
          console.error(`Error saving ${step} to backend:`, error);
        }
        setStepErrors({ general: 'Failed to save data to server. Please try again.' });
        setSaving(false);
        return false;
      }

      if (__DEV__) {
        devLog(`Onboarding step saved: ${step}`, data);
      }

      setSaving(false);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving onboarding step:', error);
      }
      setSaving(false);
      setStepErrors({ general: 'Failed to save data. Please try again.' });
      return false;
    }
  }, [currentStepData]);

  const validateStep = useCallback((step: OnboardingStep, data: any) => {
    return validateOnboardingStep(step, data);
  }, []);

  const updateStepData = useCallback((data: Partial<ExtendedOnboardingData>) => {
    setCurrentStepData((prev) => ({ ...prev, ...data }));
  }, []);

  const clearStepData = useCallback(() => {
    setCurrentStepData({});
  }, []);

  const clearErrors = useCallback(() => {
    setStepErrors({});
  }, []);

  const uploadPhoto = useCallback(async (imageUri: string): Promise<string | null> => {
    try {
      // For now, just return the local URI
      // In production, this would upload to a storage service
      if (__DEV__) {
        devLog('Photo upload requested:', imageUri);
      }
      return imageUri;
    } catch (error) {
      if (__DEV__) {
        console.error('Error uploading photo:', error);
      }
      return null;
    }
  }, []);

  const value: OnboardingContextType = {
    currentStepData,
    saveStep,
    validateStep,
    updateStepData,
    clearStepData,
    clearErrors,
    uploadPhoto,
    saving,
    stepErrors,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
