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
  >(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Use gender directly without mapping - same as EditProfileScreen
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
            // Map gender to backend format for the complete endpoint
            const genderMap: Record<string, string> = {
              'Male': 'male',
              'Female': 'female',
              'Other': 'non_binary',
              'Prefer not to say': 'prefer_not_to_say'
            };
            
            // Complete onboarding with the mandatory data via backend API
            const completeData = {
              firstName: currentStepData.firstName || '',
              lastName: currentStepData.lastName || '',
              nickname: currentStepData.nickname || '',
              birthDate: currentStepData.birthDate || new Date().toISOString(),
              gender: genderMap[selectedGender!] || 'prefer_not_to_say', // Map to backend format for complete endpoint
            };
            
            console.log('📍 [OnboardingGenderScreen] Completing mandatory onboarding');
            
            // Call backend API to complete mandatory onboarding
            const response = await api.request('POST', '/onboarding/complete', completeData);
            
            if (response.success) {
              console.log('✅ [OnboardingGenderScreen] Mandatory onboarding complete');
              
              // Update local state
              await setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
              setNeedsOnboarding(false);
              
              // Check if user has access (entered invitation code)
              const hasAccess = userData?.access_granted === true;
              
              if (hasAccess) {
                // User with invitation code - go directly to home screen
                console.log('📍 [OnboardingGenderScreen] User has invitation - navigating to Main');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' as never }],
                });
              } else {
                // User without invitation code - continue to optional onboarding
                console.log('📍 [OnboardingGenderScreen] User without invitation - navigating to optional onboarding');
                (navigation as any).navigate('OptionalOnboarding', { 
                  screen: 'Education' 
                });
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