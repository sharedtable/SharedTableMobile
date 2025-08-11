import React, { useState } from 'react';
import { View, Alert, StyleSheet, Text } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingLifestyleScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

const childrenOptions = ['Yes', 'No', 'Maybe'];
const smokingOptions = ['Rarely', 'Sometimes', 'Always'];

export const OnboardingLifestyleScreen: React.FC<OnboardingLifestyleScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 10,
  userData = {},
}) => {
  const [wantChildren, setWantChildren] = useState<string | null>(null);
  const [smokingHabit, setSmokingHabit] = useState<string | null>(null);

  const handleNext = () => {
    if (!wantChildren) {
      Alert.alert('Required', 'Please select if you want children');
      return;
    }

    if (!smokingHabit) {
      Alert.alert('Required', 'Please select your smoking/vaping habits');
      return;
    }

    onNavigate?.('onboarding-interests', {
      ...userData,
      wantChildren,
      smokingHabit,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-relationship');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>Do you want children?</OnboardingTitle>

        <View style={styles.optionsContainer}>
          {childrenOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={wantChildren === option}
              onPress={() => setWantChildren(option)}
              compact
            />
          ))}
        </View>

        <Text style={styles.secondTitle}>Do you smoke or vape?</Text>

        <View style={styles.optionsContainer}>
          {smokingOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={smokingHabit === option}
              onPress={() => setSmokingHabit(option)}
              compact
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Next"
            disabled={!wantChildren || !smokingHabit}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
  },
  container: {
    flex: 1,
  },
  optionsContainer: {
    gap: scaleHeight(12),
  },
  secondTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    lineHeight: scaleHeight(40),
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(32),
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
});
