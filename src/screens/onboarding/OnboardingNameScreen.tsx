import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingInput,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingNameScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingNameScreen: React.FC<OnboardingNameScreenProps> = ({
  onNavigate,
  currentStep = 1,
  totalSteps = 3,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [firstName, setFirstName] = useState(currentStepData.firstName || '');
  const [lastName, setLastName] = useState(currentStepData.lastName || '');
  const [nickname, setNickname] = useState(currentStepData.nickname || '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const nameData = { firstName, lastName, nickname };

      // Validate locally first
      const validation = validateOnboardingStep('name', nameData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('name', nameData);

      if (success) {
        console.log('✅ [OnboardingNameScreen] Name saved successfully');
        onNavigate?.('onboarding-birthday', nameData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your name. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingNameScreen] Error saving name:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('welcome');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      keyboardAvoiding
    >
      <View style={styles.container}>
        <OnboardingTitle>Let's start with your name</OnboardingTitle>

        <OnboardingInput
          label="First Name"
          value={firstName}
          onChangeText={(text) => {
            setFirstName(text);
            if (localErrors.firstName || stepErrors.firstName) {
              setLocalErrors((prev) => ({ ...prev, firstName: '' }));
              clearErrors();
            }
          }}
          placeholder="Enter your first name"
          required
          keyboardType="default"
          autoCapitalize="words"
          autoComplete="given-name"
          autoFocus
          error={localErrors.firstName || stepErrors.firstName}
        />

        <OnboardingInput
          label="Last Name"
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            if (localErrors.lastName || stepErrors.lastName) {
              setLocalErrors((prev) => ({ ...prev, lastName: '' }));
              clearErrors();
            }
          }}
          placeholder="Enter your last name"
          required
          keyboardType="default"
          autoCapitalize="words"
          autoComplete="family-name"
          error={localErrors.lastName || stepErrors.lastName}
        />

        <OnboardingInput
          label="Nickname"
          value={nickname}
          onChangeText={(text) => {
            setNickname(text);
            if (localErrors.nickname || stepErrors.nickname) {
              setLocalErrors((prev) => ({ ...prev, nickname: '' }));
              clearErrors();
            }
          }}
          placeholder="What should we call you?"
          required
          keyboardType="default"
          autoCapitalize="words"
          error={localErrors.nickname || stepErrors.nickname}
        />

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!firstName.trim() || !lastName.trim() || !nickname.trim() || saving}
            loading={saving}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
  },
  container: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
