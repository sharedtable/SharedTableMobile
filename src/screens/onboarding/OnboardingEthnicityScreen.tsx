import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingEthnicityScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

const ethnicityOptions = [
  'White / Caucasian',
  'African American',
  'East Asian',
  'South Asian',
  'Hispanic / LatinX',
  'Asian Pacific Islander',
  'Native American',
  'Other',
];

export const OnboardingEthnicityScreen: React.FC<OnboardingEthnicityScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 10,
  userData = {},
}) => {
  const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedEthnicity) {
      Alert.alert('Required', 'Please select your ethnicity');
      return;
    }

    onNavigate?.('onboarding-relationship', {
      ...userData,
      ethnicity: selectedEthnicity,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-work');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>What is your ethnicity?</OnboardingTitle>

        <View style={styles.optionsContainer}>
          {ethnicityOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedEthnicity === option}
              onPress={() => setSelectedEthnicity(option)}
              compact
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleNext} label="Next" disabled={!selectedEthnicity} />
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
