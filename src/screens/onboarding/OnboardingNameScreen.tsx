import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingInput,
  OnboardingButton,
} from '@/components/onboarding';
import { scaleHeight } from '@/utils/responsive';

interface OnboardingNameScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingNameScreen: React.FC<OnboardingNameScreenProps> = ({
  onNavigate,
  currentStep = 1,
  totalSteps = 10,
}) => {
  const [name, setName] = useState('');

  const handleNext = () => {
    if (!name) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    if (name.length < 2) {
      Alert.alert('Invalid Name', 'Please enter at least 2 characters');
      return;
    }

    onNavigate?.('onboarding-birthday', { name });
  };

  const handleBack = () => {
    onNavigate?.('confirmation');
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
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          required
          keyboardType="default"
          autoCapitalize="words"
          autoComplete="name"
          autoFocus
        />

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleNext} label="Next" disabled={!name} />
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
