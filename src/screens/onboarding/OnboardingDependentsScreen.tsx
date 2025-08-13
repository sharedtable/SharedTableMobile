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

interface OnboardingDependentsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingDependentsScreen: React.FC<OnboardingDependentsScreenProps> = ({
  onNavigate,
  currentStep = 4,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [hasDependents, setHasDependents] = useState<'yes' | 'no' | null>(
    (currentStepData as any)?.hasDependents || null
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

      const dependentsData = { hasDependents };

      // Validate locally first
      const validation = validateOnboardingStep('dependents', dependentsData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('dependents', dependentsData);

      if (success) {
        console.log('✅ [OnboardingDependentsScreen] Dependents data saved successfully');
        onNavigate?.('onboarding-work', dependentsData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingDependentsScreen] Error saving dependents:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-gender');
  };

  return (
    <OnboardingLayout onBack={handleBack} currentStep={currentStep} totalSteps={totalSteps}>
      <View style={styles.container}>
        <OnboardingTitle>Do you have any{'\n'}dependents?</OnboardingTitle>

        {(Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {localErrors.hasDependents ||
                stepErrors.hasDependents ||
                localErrors.general ||
                stepErrors.general}
            </Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <SelectionCard
            label="Yes!"
            selected={hasDependents === 'yes'}
            onPress={() => {
              setHasDependents('yes');
              if (localErrors.hasDependents || stepErrors.hasDependents) {
                setLocalErrors((prev) => ({ ...prev, hasDependents: '' }));
                clearErrors();
              }
            }}
          />

          <SelectionCard
            label="No!"
            selected={hasDependents === 'no'}
            onPress={() => {
              setHasDependents('no');
              if (localErrors.hasDependents || stepErrors.hasDependents) {
                setLocalErrors((prev) => ({ ...prev, hasDependents: '' }));
                clearErrors();
              }
            }}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!hasDependents || saving}
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
    gap: scaleHeight(16),
  },
  spacer: {
    flex: 1,
  },
});
