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

interface OnboardingRelationshipScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const relationshipTypes = ['Single', 'In relationship', 'Married', 'Divorced', 'Other'];

const timeSinceOptions = ['0 - 3 months', '3 - 12 months', '> 12 months'];

export const OnboardingRelationshipScreen: React.FC<OnboardingRelationshipScreenProps> = ({
  onNavigate,
  currentStep = 7,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | null>(
    currentStepData.relationshipType || null
  );
  const [selectedTimeSince, setSelectedTimeSince] = useState<string | null>(
    currentStepData.timeSinceLastRelationship || null
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

      const relationshipData = {
        relationshipType: selectedRelationshipType,
        timeSinceLastRelationship: selectedTimeSince,
      };

      // Validate locally first
      const validation = validateOnboardingStep('relationship', relationshipData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('relationship', relationshipData);

      if (success) {
        onNavigate?.('onboarding-lifestyle', relationshipData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your relationship preferences. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingRelationshipScreen] Error saving relationship:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-ethnicity');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.relationshipType ||
    stepErrors.relationshipType ||
    localErrors.timeSinceLastRelationship ||
    stepErrors.timeSinceLastRelationship ||
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
        <OnboardingTitle>What kind of relationship are you looking for?</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {relationshipTypes.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedRelationshipType === option}
              onPress={() => {
                setSelectedRelationshipType(option);
                if (localErrors.relationshipType || stepErrors.relationshipType) {
                  setLocalErrors((prev) => ({ ...prev, relationshipType: '' }));
                  clearErrors();
                }
              }}
              compact
            />
          ))}
        </View>

        <Text style={styles.secondTitle}>How long has it been since your last relationship?</Text>

        <View style={styles.optionsContainer}>
          {timeSinceOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedTimeSince === option}
              onPress={() => {
                setSelectedTimeSince(option);
                if (localErrors.timeSinceLastRelationship || stepErrors.timeSinceLastRelationship) {
                  setLocalErrors((prev) => ({ ...prev, timeSinceLastRelationship: '' }));
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
            disabled={!selectedRelationshipType || !selectedTimeSince || saving}
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
    backgroundColor: theme.colors.error[100],
    borderColor: theme.colors.error[300],
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: theme.colors.error.main,
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
