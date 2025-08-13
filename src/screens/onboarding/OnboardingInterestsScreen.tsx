import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, Pressable } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface OnboardingInterestsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
}

const interestOptions = [
  'Creative & Arts',
  'Entertainment & Media',
  'Learning & Hobbies',
  'Lifestyle & Wellness',
  'Culture & Travel',
  'Career & Personal Growth',
  'Social & Community',
  'Tech & Digital',
  'Sports & Games',
];

export const OnboardingInterestsScreen: React.FC<OnboardingInterestsScreenProps> = ({
  onNavigate,
  currentStep = 5,
  totalSteps = 8,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentStepData.interests || []
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      const newInterests = prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest];

      // Clear errors when user makes selection
      if (localErrors.interests || stepErrors.interests) {
        setLocalErrors((prevErrors) => ({ ...prevErrors, interests: '' }));
        clearErrors();
      }

      return newInterests;
    });
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const interestsData = { interests: selectedInterests };

      // Validate locally first
      const validation = validateOnboardingStep('interests', interestsData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('interests', interestsData);

      if (success) {
        console.log('✅ [OnboardingInterestsScreen] Interests saved successfully');
        onNavigate?.('onboarding-personality', interestsData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your interests. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingInterestsScreen] Error saving interests:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-lifestyle');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>Choose your interests.</OnboardingTitle>

        {(Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {localErrors.interests ||
                stepErrors.interests ||
                localErrors.general ||
                stepErrors.general}
            </Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {interestOptions.map((interest) => (
            <Pressable
              key={interest}
              style={[
                styles.interestCard,
                selectedInterests.includes(interest) && styles.interestCardSelected,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text
                style={[
                  styles.interestText,
                  selectedInterests.includes(interest) && styles.interestTextSelected,
                ]}
              >
                {interest}
              </Text>
              {selectedInterests.includes(interest) && (
                <Icon name="checkmark" size={20} color={theme.colors.primary.main} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={selectedInterests.length === 0 || saving}
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
  interestCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderColor: 'transparent',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  interestCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)',
    borderColor: theme.colors.primary.main, // 30% of brand color
  },
  interestText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  interestTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  optionsContainer: {
    gap: scaleHeight(12),
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
});
