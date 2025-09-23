import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  TextInput
} from 'react-native';
import Slider from '@react-native-community/slider';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingFoodPreferences1ScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const dietaryRestrictionsOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Kosher',
  'Halal',
  'Nut allergy',
  'Shellfish allergy',
  'No restrictions',
];


export const OnboardingFoodPreferences1Screen: React.FC<OnboardingFoodPreferences1ScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 13,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  
  console.log('🍔 OnboardingFoodPreferences1Screen: currentStepData:', currentStepData);

  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>(
    Array.isArray(currentStepData.dietaryRestrictions)
      ? currentStepData.dietaryRestrictions
      : ['No restrictions'] // Default to "No restrictions"
  );
  const [customDietaryRestrictions, setCustomDietaryRestrictions] = useState<string>(
    currentStepData.customDietaryRestrictions || ''
  );
  const [dietaryConfirmed, setDietaryConfirmed] = useState<boolean>(
    currentStepData.dietaryConfirmed || false
  );
  const [spicyLevel, setSpicyLevel] = useState<number>(currentStepData.spicyLevel || 3);
  const [drinkingLevel, setDrinkingLevel] = useState<number>(currentStepData.drinkingLevel || 3);
  const [adventurousLevel, setAdventurousLevel] = useState<number>(currentStepData.adventurousLevel || 3);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const toggleDietaryRestriction = (restriction: string) => {
    setSelectedDietaryRestrictions(prev => {
      // If "No restrictions" is selected, clear all other selections
      if (restriction === 'No restrictions') {
        return ['No restrictions'];
      }
      
      // If selecting something else, remove "No restrictions" if it was selected
      const filtered = prev.filter(r => r !== 'No restrictions');
      
      if (prev.includes(restriction)) {
        const newSelection = filtered.filter(r => r !== restriction);
        // If all options are deselected, auto-select "No restrictions"
        return newSelection.length === 0 ? ['No restrictions'] : newSelection;
      }
      
      return [...filtered, restriction];
    });
  };


  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const foodData = {
        dietaryRestrictions: selectedDietaryRestrictions,
        customDietaryRestrictions,
        dietaryConfirmed,
        spicyLevel,
        drinkingLevel,
        adventurousLevel,
      };

      const validation = validateOnboardingStep('foodPreferences', foodData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('foodPreferences', foodData);

      if (success) {
        console.log('✅ [OnboardingFoodPreferences1Screen] Saved successfully');
        onNavigate?.('onboarding-food-2', foodData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingFoodPreferences1Screen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-lifestyle');
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
                <Text style={styles.title}>Your Taste in Food (1/4)</Text>
              </View>

              {hasError && errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Dietary Restrictions */}
              <View style={styles.section}>
                <Text style={styles.questionText}>Dietary Restrictions *</Text>
                <Text style={styles.helperText}>(Multi-select allowed)</Text>
                <View style={styles.optionsContainer}>
                  {dietaryRestrictionsOptions.map((restriction) => (
                    <TouchableOpacity
                      key={restriction}
                      style={[
                        styles.optionButton,
                        selectedDietaryRestrictions.includes(restriction) && styles.optionButtonSelected
                      ]}
                      onPress={() => toggleDietaryRestriction(restriction)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        selectedDietaryRestrictions.includes(restriction) && styles.optionButtonTextSelected
                      ]}>
                        {restriction}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Custom dietary restrictions input */}
                <TextInput
                  style={styles.customInput}
                  placeholder="Other dietary restrictions (if any)"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={customDietaryRestrictions}
                  onChangeText={setCustomDietaryRestrictions}
                />
                
                {/* Confirmation checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setDietaryConfirmed(!dietaryConfirmed)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, dietaryConfirmed && styles.checkboxChecked]}>
                    {dietaryConfirmed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm I've disclosed my dietary restrictions so my match + restaurant are a good fit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Spicy Food Slider */}
              <View style={styles.section}>
                <Text style={styles.questionText}>I enjoy spicy foods</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={spicyLevel}
                    onValueChange={setSpicyLevel}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor={Colors.borderLight}
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Not at all</Text>
                    <Text style={styles.sliderValue}>{spicyLevel}</Text>
                    <Text style={styles.sliderLabel}>Always</Text>
                  </View>
                </View>
              </View>

              {/* Drinking Slider */}
              <View style={styles.section}>
                <Text style={styles.questionText}>I enjoy drinking alcohol with meals or socially</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={drinkingLevel}
                    onValueChange={setDrinkingLevel}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor={Colors.borderLight}
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>I don&apos;t drink</Text>
                    <Text style={styles.sliderValue}>{drinkingLevel}</Text>
                    <Text style={styles.sliderLabel}>Frequently</Text>
                  </View>
                </View>
              </View>

              {/* Adventurous Slider */}
              <View style={styles.section}>
                <Text style={styles.questionText}>How adventurous of a diner are you?</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={adventurousLevel}
                    onValueChange={setAdventurousLevel}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor={Colors.borderLight}
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Not at all</Text>
                    <Text style={styles.sliderValue}>{adventurousLevel}</Text>
                    <Text style={styles.sliderLabel}>Always</Text>
                  </View>
                </View>
              </View>


              <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Save and continue'}
            disabled={saving}
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
  },
  questionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '500',
    marginBottom: scaleHeight(12),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginTop: scaleHeight(4),
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
    marginHorizontal: scaleWidth(10),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
    marginTop: scaleHeight(12),
  },
  optionButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
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
  customInput: {
    marginTop: scaleHeight(16),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    height: scaleHeight(48),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scaleHeight(16),
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
  spacer: {
    flex: 1,
    minHeight: scaleHeight(20),
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
    gap: scaleHeight(12),
  },
});