import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

import { MaleIcon, FemaleIcon } from '@/components/icons/GenderIcons';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingGenderScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingGenderScreen: React.FC<OnboardingGenderScreenProps> = ({
  onNavigate,
  currentStep = 3,
  totalSteps = 10,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedGender, setSelectedGender] = useState<
    'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null
  >(currentStepData.gender || null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const genderData = { gender: selectedGender };

      // Validate locally first
      const validation = validateOnboardingStep('gender', genderData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('gender', genderData);

      if (success) {
        console.log('✅ [OnboardingGenderScreen] Gender saved successfully');
        onNavigate?.('onboarding-dependents', genderData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your gender. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingGenderScreen] Error saving gender:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-birthday');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.gender || stepErrors.gender || localErrors.general || stepErrors.general;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      keyboardAvoiding
    >
      <View style={styles.container}>
        <OnboardingTitle>What's your gender?</OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {/* Male Option */}
          <Pressable
            style={[styles.genderCard, selectedGender === 'male' && styles.genderCardSelected]}
            onPress={() => {
              setSelectedGender('male');
              if (localErrors.gender || stepErrors.gender) {
                setLocalErrors((prev) => ({ ...prev, gender: '' }));
                clearErrors();
              }
            }}
          >
            <View style={styles.iconContainer}>
              <MaleIcon
                size={50}
                color={theme.colors.primary.main}
                isSelected={selectedGender === 'male'}
              />
            </View>
            <Text
              style={[styles.genderText, selectedGender === 'male' && styles.genderTextSelected]}
            >
              Male
            </Text>
          </Pressable>

          {/* Female Option */}
          <Pressable
            style={[styles.genderCard, selectedGender === 'female' && styles.genderCardSelected]}
            onPress={() => {
              setSelectedGender('female');
              if (localErrors.gender || stepErrors.gender) {
                setLocalErrors((prev) => ({ ...prev, gender: '' }));
                clearErrors();
              }
            }}
          >
            <View style={styles.iconContainer}>
              <FemaleIcon
                size={50}
                color={theme.colors.primary.main}
                isSelected={selectedGender === 'female'}
              />
            </View>
            <Text
              style={[styles.genderText, selectedGender === 'female' && styles.genderTextSelected]}
            >
              Female
            </Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!selectedGender || saving}
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
  genderCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderColor: 'transparent',
    borderRadius: scaleWidth(16),
    borderWidth: 2,
    flex: 1,
    paddingVertical: scaleHeight(32),
  },
  genderCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)', // 30% of brand color
    borderColor: theme.colors.primary.main,
  },
  genderText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  genderTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  iconContainer: {
    alignItems: 'center',
    height: scaleWidth(60),
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    width: scaleWidth(60),
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  spacer: {
    flex: 1,
  },
});
