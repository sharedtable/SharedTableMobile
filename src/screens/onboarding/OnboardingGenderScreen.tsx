import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton, SingleChoiceOption } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { useUserData } from '@/hooks/useUserData';

interface OnboardingGenderScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingGenderScreen: React.FC<OnboardingGenderScreenProps> = ({
  onNavigate,
  currentStep = 3,
  totalSteps = 3,
}) => {
  const navigation = useNavigation();
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  const { privyUser, setNeedsOnboarding, setOnboardingStatus } = useAuthStore();
  const { userData } = useUserData();

  const [selectedGender, setSelectedGender] = useState<
    'Male' | 'Female' | 'Other' | 'Prefer not to say' | null
  >(currentStepData.gender as any || null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Use gender directly - one format everywhere
      const genderData = { gender: selectedGender };

      // Validate locally first
      const validation = validateOnboardingStep('gender', genderData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('gender', genderData);

      if (success) {
        console.log('✅ [OnboardingGenderScreen] Gender saved successfully');
        
        // Complete mandatory onboarding
        const userId = privyUser?.id;
        if (userId) {
          try {
            const completeData = {
              firstName: currentStepData.firstName || '',
              lastName: currentStepData.lastName || '',
              nickname: currentStepData.nickname || '',
              birthDate: currentStepData.birthDate || new Date().toISOString(),
              gender: selectedGender || 'Prefer not to say', // Always capitalized format
            };
            
            // Call backend API to complete mandatory onboarding
            const response = await api.request('POST', '/onboarding/complete', completeData);
            
            if (response.success) {
              console.log('✅ [OnboardingGenderScreen] Mandatory onboarding complete');
              
              // Check if user has access (entered invitation code)
              const hasAccess = userData?.access_granted === true;
              
              if (hasAccess) {
                // User with invitation code - just update state
                console.log('📍 [OnboardingGenderScreen] User has invitation - completing onboarding');
                
                // Update state - this will cause RootNavigator to re-render and show Main
                setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
                setNeedsOnboarding(false);
                
                // The RootNavigator will automatically switch to Main screen
                // No manual navigation needed!
              } else {
                // User without invitation code - navigate to optional onboarding
                console.log('📍 [OnboardingGenderScreen] User without invitation - navigating to optional onboarding');
                setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
                
                // For optional onboarding, we need to navigate
                // Try parent navigation first (to access RootNavigator level)
                const parentNav = navigation.getParent();
                if (parentNav) {
                  // Don't set needsOnboarding to false yet - they're continuing
                  (parentNav as any).navigate('OptionalOnboarding', { 
                    screen: 'Education' 
                  });
                } else {
                  // Fallback
                  (navigation as any).navigate('OptionalOnboarding', { 
                    screen: 'Education' 
                  });
                }
              }
            }
          } catch (error) {
            console.error('Failed to complete mandatory onboarding:', error);
            Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
          }
        }
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your gender. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingGenderScreen] Error saving gender:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-birthday');
  };

  const genderOptions = [
    { id: 'Female', label: 'Female' },
    { id: 'Male', label: 'Male' },
    { id: 'Other', label: 'Other' },
    { id: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = localErrors.gender || stepErrors.gender;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>What&apos;s your gender?</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <SingleChoiceOption
              key={option.id}
              label={option.label}
              selected={selectedGender === option.id}
              onPress={() => {
                setSelectedGender(option.id as any);
                if (localErrors.gender || stepErrors.gender) {
                  setLocalErrors({});
                  clearErrors();
                }
              }}
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Complete'}
            disabled={!selectedGender || saving}
            loading={saving}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: theme.colors.error['100'],
    borderColor: theme.colors.error['300'],
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: theme.colors.error['600'],
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionsContainer: {
    marginTop: scaleHeight(8),
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(40),
  },
});