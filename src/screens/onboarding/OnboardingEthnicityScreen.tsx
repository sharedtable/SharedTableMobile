import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingEthnicityScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
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
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(
    currentStepData.ethnicity || null
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const ethnicityData = { ethnicity: selectedEthnicity };

      // Validate locally first
      const validation = validateOnboardingStep('ethnicity', ethnicityData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('ethnicity', ethnicityData);

      if (success) {
        console.log('✅ [OnboardingEthnicityScreen] Ethnicity saved successfully');
        onNavigate?.('onboarding-relationship', ethnicityData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your ethnicity. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingEthnicityScreen] Error saving ethnicity:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-work');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.ethnicity || stepErrors.ethnicity || localErrors.general || stepErrors.general;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>{"What is your ethnicity?"}</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {ethnicityOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedEthnicity === option}
              onPress={() => {
                setSelectedEthnicity(option);
                if (localErrors.ethnicity || stepErrors.ethnicity) {
                  setLocalErrors((prev) => ({ ...prev, ethnicity: '' }));
                  clearErrors();
                }
              }}
              compact
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!selectedEthnicity || saving}
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
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: '#DC2626',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionsContainer: {
    gap: scaleHeight(12),
  },
  spacer: {
    height: scaleHeight(40),
  },
});
