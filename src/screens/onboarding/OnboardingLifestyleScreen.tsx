import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, ScrollView } from 'react-native';

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

const alcoholOptions = ['Never', 'Rarely', 'Socially', 'Regularly'];
const cannabisOptions = ['Never', 'Rarely', 'Sometimes', 'Regularly', 'Medical only'];
const otherDrugsOptions = ['Never', 'Rarely', 'Sometimes', 'Prefer not to say'];

export const OnboardingLifestyleScreen: React.FC<OnboardingLifestyleScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [wantChildren, setWantChildren] = useState<string | null>(
    currentStepData.wantChildren || null
  );
  const [alcoholUse, setAlcoholUse] = useState<string | null>(
    currentStepData.alcoholUse || null
  );
  const [cannabisUse, setCannabisUse] = useState<string | null>(
    currentStepData.cannabisUse || null
  );
  const [otherDrugsUse, setOtherDrugsUse] = useState<string | null>(
    currentStepData.otherDrugsUse || null
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
        alcoholUse,
        cannabisUse,
        otherDrugsUse,
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
    localErrors.alcoholUse ||
    stepErrors.alcoholUse ||
    localErrors.cannabisUse ||
    stepErrors.cannabisUse ||
    localErrors.otherDrugsUse ||
    stepErrors.otherDrugsUse ||
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
        <OnboardingTitle>Lifestyle Choices</OnboardingTitle>
        <Text style={styles.subtitle}>
          Help us understand your lifestyle to find compatible dining partners.
        </Text>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Children Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Do you want children?</Text>
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
          </View>

          {/* Alcohol Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Alcohol use</Text>
            <Text style={styles.sectionSubtitle}>How often do you drink alcohol?</Text>
            <View style={styles.optionsContainer}>
              {alcoholOptions.map((option) => (
                <SelectionCard
                  key={option}
                  label={option}
                  selected={alcoholUse === option}
                  onPress={() => {
                    setAlcoholUse(option);
                    if (localErrors.alcoholUse || stepErrors.alcoholUse) {
                      setLocalErrors((prev) => ({ ...prev, alcoholUse: '' }));
                      clearErrors();
                    }
                  }}
                  compact
                />
              ))}
            </View>
          </View>

          {/* Cannabis Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Cannabis use</Text>
            <Text style={styles.sectionSubtitle}>How often do you use cannabis?</Text>
            <View style={styles.optionsContainer}>
              {cannabisOptions.map((option) => (
                <SelectionCard
                  key={option}
                  label={option}
                  selected={cannabisUse === option}
                  onPress={() => {
                    setCannabisUse(option);
                    if (localErrors.cannabisUse || stepErrors.cannabisUse) {
                      setLocalErrors((prev) => ({ ...prev, cannabisUse: '' }));
                      clearErrors();
                    }
                  }}
                  compact
                />
              ))}
            </View>
          </View>

          {/* Other Drugs Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Other recreational drugs</Text>
            <Text style={styles.sectionSubtitle}>
              How often do you use other recreational substances?
            </Text>
            <View style={styles.optionsContainer}>
              {otherDrugsOptions.map((option) => (
                <SelectionCard
                  key={option}
                  label={option}
                  selected={otherDrugsUse === option}
                  onPress={() => {
                    setOtherDrugsUse(option);
                    if (localErrors.otherDrugsUse || stepErrors.otherDrugsUse) {
                      setLocalErrors((prev) => ({ ...prev, otherDrugsUse: '' }));
                      clearErrors();
                    }
                  }}
                  compact
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!wantChildren || !alcoholUse || !cannabisUse || !otherDrugsUse || saving}
            loading={saving}
          />
          {(!wantChildren || !alcoholUse || !cannabisUse || !otherDrugsUse) && (
            <Text style={styles.helperText}>
              Please answer all questions to continue
            </Text>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(20),
  },
  sectionContainer: {
    marginBottom: scaleHeight(28),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(18),
    marginBottom: scaleHeight(8),
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(16),
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
    flex: 1,
    minHeight: scaleHeight(40),
  },
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    textAlign: 'center',
    marginTop: scaleHeight(8),
  },
});
