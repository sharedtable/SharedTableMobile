/**
 * Simplified onboarding context for managing onboarding form data
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

import { __DEV__, devLog } from '@/utils/env';

import type { CompleteOnboardingData, OnboardingStep } from './validation';
import { validateOnboardingStep } from './validation';

interface OnboardingContextType {
  // Current step data
  currentStepData: Partial<CompleteOnboardingData>;

  // Actions
  saveStep: (step: OnboardingStep, data: any) => Promise<boolean>;
  validateStep: (
    step: OnboardingStep,
    data: any
  ) => { success: boolean; errors?: Record<string, string> };
  updateStepData: (data: Partial<CompleteOnboardingData>) => void;
  clearStepData: () => void;
  clearErrors: () => void;
  uploadPhoto: (imageUri: string) => Promise<string | null>;

  // State
  saving: boolean;
  stepErrors: Record<string, string>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStepData, setCurrentStepData] = useState<Partial<CompleteOnboardingData>>({});
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

      // Update local state
      setCurrentStepData((prev) => ({ ...prev, ...data }));

      // For now, we'll save to the backend when onboarding is complete
      // Individual steps are stored locally

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
  }, []);

  const validateStep = useCallback((step: OnboardingStep, data: any) => {
    return validateOnboardingStep(step, data);
  }, []);

  const updateStepData = useCallback((data: Partial<CompleteOnboardingData>) => {
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
