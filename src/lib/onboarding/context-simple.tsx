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

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStepData, setCurrentStepData] = useState<Partial<ExtendedOnboardingData>>({});
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
