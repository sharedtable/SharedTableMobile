import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  TouchableOpacity
} from 'react-native';
import Slider from '@react-native-community/slider';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingFoodPreferences2ScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const dinnerDurationOptions = [
  '< 30 min',
  '30-45 min',
  '> 45 min',
  'It depends',
];

const diningAtmosphereOptions = [
  'Casual & relaxed',
  'Lively & Trendy',
  'Fine dining',
];

export const OnboardingFoodPreferences2Screen: React.FC<OnboardingFoodPreferences2ScreenProps> = ({
  onNavigate,
  currentStep = 7,
  totalSteps = 13,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  
  const [dinnerDuration, setDinnerDuration] = useState<string>(
    currentStepData.dinnerDuration || ''
  );
  const [budget, setBudget] = useState<number>(
    currentStepData.budget || 50
  );
  const [budgetFlexible, setBudgetFlexible] = useState<boolean>(
    currentStepData.budgetFlexible || false
  );
  const [budgetBelowHappy, setBudgetBelowHappy] = useState<boolean>(
    currentStepData.budgetBelowHappy || false
  );
  const [selectedAtmospheres, setSelectedAtmospheres] = useState<string[]>(
    currentStepData.diningAtmospheres || []
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const toggleAtmosphere = (atmosphere: string) => {
    setSelectedAtmospheres(prev => 
      prev.includes(atmosphere) 
        ? prev.filter(a => a !== atmosphere)
        : [...prev, atmosphere]
    );
  };

  const getBudgetLabel = (value: number): string => {
    if (value < 20) return 'Under $20';
    if (value < 40) return '$20-$40';
    if (value < 60) return '$40-$60';
    if (value < 80) return '$60-$80';
    return '$80+';
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!dinnerDuration) {
        setLocalErrors({ dinnerDuration: 'Please select dinner duration' });
        return;
      }

      const foodData = {
        dinnerDuration,
        budget,
        budgetFlexible,
        budgetBelowHappy,
        diningAtmospheres: selectedAtmospheres,
      };

      const validation = validateOnboardingStep('foodPreferences', foodData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('foodPreferences', foodData);

      if (success) {
        console.log('✅ [OnboardingFoodPreferences2Screen] Saved successfully');
        onNavigate?.('onboarding-food-3', foodData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingFoodPreferences2Screen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-food-1');
  };


  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>Your Taste in Food (2/4)</Text>
              </View>

              {hasError && errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Dinner Duration */}
              <View style={styles.section}>
                <Text style={styles.questionText}>How long does it usually take you to finish dinner?</Text>
                <View style={styles.radioContainer}>
                  {dinnerDurationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.radioOption}
                      onPress={() => setDinnerDuration(option)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {dinnerDuration === option && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>


              {/* Budget */}
              <View style={styles.section}>
                <Text style={styles.questionText}>What's your budget for a typical social dinner?</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={budget}
                    onValueChange={setBudget}
                    minimumValue={10}
                    maximumValue={100}
                    step={10}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor={Colors.borderLight}
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Under $20</Text>
                    <Text style={styles.sliderValue}>{getBudgetLabel(budget)}</Text>
                    <Text style={styles.sliderLabel}>$80+</Text>
                  </View>
                </View>
                
                {/* Budget Checkboxes */}
                <View style={styles.checkboxSection}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBudgetFlexible(!budgetFlexible)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, budgetFlexible && styles.checkboxChecked]}>
                      {budgetFlexible && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      As long as the food and company are good, I don't mind
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBudgetBelowHappy(!budgetBelowHappy)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, budgetBelowHappy && styles.checkboxChecked]}>
                      {budgetBelowHappy && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I am happy to go to dinners materially below my budget
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dining Atmospheres */}
              <View style={styles.section}>
                <Text style={styles.questionText}>What kind of dining atmospheres do you enjoy?</Text>
                <Text style={styles.helperText}>(Multi-select allowed)</Text>
                <View style={styles.optionsContainer}>
                  {diningAtmosphereOptions.map((atmosphere) => (
                    <TouchableOpacity
                      key={atmosphere}
                      style={[
                        styles.optionButton,
                        selectedAtmospheres.includes(atmosphere) && styles.optionButtonSelected
                      ]}
                      onPress={() => toggleAtmosphere(atmosphere)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        selectedAtmospheres.includes(atmosphere) && styles.optionButtonTextSelected
                      ]}>
                        {atmosphere}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Save and continue'}
            disabled={!dinnerDuration || saving}
            loading={saving}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    marginBottom: scaleHeight(24),
  },
  title: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
  },
  errorContainer: {
    backgroundColor: Colors.errorLighter,
    borderColor: Colors.errorLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(12),
    padding: scaleWidth(12),
  },
  errorText: {
    color: Colors.error,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  section: {
    marginBottom: scaleHeight(24),
    position: 'relative',
  },
  questionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '500',
    marginBottom: scaleHeight(12),
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(16),
    rowGap: scaleHeight(12),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  radioCircle: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: theme.colors.primary.main,
  },
  radioText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(12),
  },
  sliderWrapper: {
    paddingHorizontal: scaleWidth(8),
  },
  slider: {
    width: '100%',
    height: scaleHeight(40),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(-8),
  },
  sliderLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  sliderValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  checkboxSection: {
    marginTop: scaleHeight(16),
    gap: scaleHeight(12),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(8),
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(4),
    marginRight: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  checkmark: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(18),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  optionButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  optionButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionButtonTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(10),
  },
  bottomContainer: {
    paddingBottom: scaleHeight(10),
    paddingTop: scaleHeight(4),
    gap: scaleHeight(4),
  },
});