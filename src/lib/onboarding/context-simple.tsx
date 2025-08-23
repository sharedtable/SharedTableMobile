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

      // For the 3 required steps, save to backend
      if (step === 'name' || step === 'birthday' || step === 'gender') {
        try {
          // Prepare data for backend based on step
          const apiData: any = {};
          if (step === 'name') {
            apiData.firstName = data.firstName;
            apiData.lastName = data.lastName;
            apiData.nickname = data.nickname;
          } else if (step === 'birthday') {
            apiData.birthDate = data.birthDate?.toISOString ? data.birthDate.toISOString() : data.birthDate;
          } else if (step === 'gender') {
            apiData.gender = data.gender;
          }

          await OnboardingAPI.saveStep({ step, data: apiData });

          // If this is the last step (gender), complete the onboarding
          if (step === 'gender') {
            const completeData = {
              firstName: updatedData.firstName!,
              lastName: updatedData.lastName!,
              nickname: updatedData.nickname!,
              birthDate: updatedData.birthDate?.toISOString ? updatedData.birthDate.toISOString() : updatedData.birthDate!,
              gender: updatedData.gender!,
            };
            await OnboardingAPI.completeOnboarding(completeData);
          }
        } catch (error) {
          if (__DEV__) {
            console.error(`Error saving ${step} to backend:`, error);
          }
          setStepErrors({ general: 'Failed to save data to server. Please try again.' });
          setSaving(false);
          return false;
        }
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
