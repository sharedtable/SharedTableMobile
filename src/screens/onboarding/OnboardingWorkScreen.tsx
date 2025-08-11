import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingWorkScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

const workOptions = [
  'VC',
  'Hardware',
  'Healthcare',
  'Entrepreneurship',
  'Finance',
  'Marketing',
  'Student',
  'Engineering',
  'Other',
];

export const OnboardingWorkScreen: React.FC<OnboardingWorkScreenProps> = ({
  onNavigate,
  currentStep = 5,
  totalSteps = 10,
  userData = {},
}) => {
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedWork) {
      Alert.alert('Required', 'Please select your line of work');
      return;
    }

    onNavigate?.('onboarding-ethnicity', {
      ...userData,
      lineOfWork: selectedWork,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-dependents');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>What line of work are you in?</OnboardingTitle>

        <View style={styles.optionsContainer}>
          {workOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedWork === option}
              onPress={() => setSelectedWork(option)}
              compact
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleNext} label="Next" disabled={!selectedWork} />
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
    gap: scaleHeight(12),
  },
  spacer: {
    height: scaleHeight(40),
  },
});
