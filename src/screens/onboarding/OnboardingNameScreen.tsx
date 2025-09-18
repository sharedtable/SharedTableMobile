import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, StyleSheet, TextInput } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingInput,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingNameScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingNameScreen: React.FC<OnboardingNameScreenProps> = ({
  onNavigate,
  currentStep = 1,
  totalSteps = 3,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  // Initialize state only once with lazy initialization
  const [firstName, setFirstName] = useState(() => currentStepData.firstName || '');
  const [lastName, setLastName] = useState(() => currentStepData.lastName || '');
  const [nickname, setNickname] = useState(() => currentStepData.nickname || '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  
  // Refs for input fields
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const nicknameRef = useRef<TextInput>(null);

  // Clear errors only once on mount
  useEffect(() => {
    clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally omit clearErrors to prevent re-renders
  
  // Focus on first input after a short delay to prevent keyboard flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      firstNameRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>{"Let's start with your name"}</OnboardingTitle>

        <OnboardingInput
          ref={firstNameRef}
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
          error={localErrors.firstName || stepErrors.firstName}
          onSubmitEditing={() => lastNameRef.current?.focus()}
          returnKeyType="next"
        />

        <OnboardingInput
          ref={lastNameRef}
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
          onSubmitEditing={() => nicknameRef.current?.focus()}
          returnKeyType="next"
        />

        <OnboardingInput
          ref={nicknameRef}
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
          returnKeyType="done"
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
