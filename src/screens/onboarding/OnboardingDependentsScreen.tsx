import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingDependentsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

export const OnboardingDependentsScreen: React.FC<OnboardingDependentsScreenProps> = ({
  onNavigate,
  currentStep = 4,
  totalSteps = 10,
  userData = {},
}) => {
  const [hasDependents, setHasDependents] = useState<'yes' | 'no' | null>(null);

  const handleNext = () => {
    if (!hasDependents) {
      Alert.alert('Required', 'Please select an option');
      return;
    }

    onNavigate?.('onboarding-work', {
      ...userData,
      hasDependents,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-gender');
  };

  return (
    <OnboardingLayout onBack={handleBack} currentStep={currentStep} totalSteps={totalSteps}>
      <View style={styles.container}>
        <OnboardingTitle>Do you have any{'\n'}dependents?</OnboardingTitle>

        <View style={styles.optionsContainer}>
          <SelectionCard
            label="Yes!"
            selected={hasDependents === 'yes'}
            onPress={() => setHasDependents('yes')}
          />

          <SelectionCard
            label="No!"
            selected={hasDependents === 'no'}
            onPress={() => setHasDependents('no')}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleNext} label="Next" disabled={!hasDependents} />
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
  optionsContainer: {
    gap: scaleHeight(16),
  },
  spacer: {
    flex: 1,
  },
});
