import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Text } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface OnboardingWorkScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
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
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedWork, setSelectedWork] = useState<string | null>(
    (currentStepData as any)?.lineOfWork || null
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const workData = { lineOfWork: selectedWork };

      const validation = validateOnboardingStep('work', workData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('work', workData);

      if (success) {
        console.log('✅ [OnboardingWorkScreen] Work data saved successfully');
        onNavigate?.('onboarding-ethnicity', workData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your work information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingWorkScreen] Error saving work:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
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

        {(Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {localErrors.lineOfWork ||
                stepErrors.lineOfWork ||
                localErrors.general ||
                stepErrors.general}
            </Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {workOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedWork === option}
              onPress={() => {
                setSelectedWork(option);
                if (localErrors.lineOfWork || stepErrors.lineOfWork) {
                  setLocalErrors((prev) => ({ ...prev, lineOfWork: '' }));
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
            disabled={!selectedWork || saving}
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
