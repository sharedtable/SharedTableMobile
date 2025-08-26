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
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingLifestyleScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const childrenOptions = ['Yes', 'No', 'Maybe'];
const smokingOptions = ['Rarely', 'Sometimes', 'Always'];

export const OnboardingLifestyleScreen: React.FC<OnboardingLifestyleScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [wantChildren, setWantChildren] = useState<string | null>(
    currentStepData.wantChildren || null
  );
  const [smokingHabit, setSmokingHabit] = useState<string | null>(
    currentStepData.smokingHabit || null
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

      const lifestyleData = {
        wantChildren,
        smokingHabit,
      };

      // Validate locally first
      const validation = validateOnboardingStep('lifestyle', lifestyleData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('lifestyle', lifestyleData);

      if (success) {
        console.log('✅ [OnboardingLifestyleScreen] Lifestyle saved successfully');
        onNavigate?.('onboarding-interests', lifestyleData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your lifestyle preferences. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingLifestyleScreen] Error saving lifestyle:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-relationship');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.wantChildren ||
    stepErrors.wantChildren ||
    localErrors.smokingHabit ||
    stepErrors.smokingHabit ||
    localErrors.general ||
    stepErrors.general;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>Do you want children?</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {childrenOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={wantChildren === option}
              onPress={() => {
                setWantChildren(option);
                if (localErrors.wantChildren || stepErrors.wantChildren) {
                  setLocalErrors((prev) => ({ ...prev, wantChildren: '' }));
                  clearErrors();
                }
              }}
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
              onPress={() => {
                setSmokingHabit(option);
                if (localErrors.smokingHabit || stepErrors.smokingHabit) {
                  setLocalErrors((prev) => ({ ...prev, smokingHabit: '' }));
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
            disabled={!wantChildren || !smokingHabit || saving}
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
    paddingTop: scaleHeight(20),
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
  secondTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700',
    lineHeight: scaleHeight(40),
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(32),
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
});
