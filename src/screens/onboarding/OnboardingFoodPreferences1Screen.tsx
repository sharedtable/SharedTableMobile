import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
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

const diningAtmosphereOptions = [
  'Casual & relaxed',
  'Lively & Trendy',
  'Fine dining',
];

export const OnboardingFoodPreferences1Screen: React.FC<OnboardingFoodPreferences1ScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 13,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>(
    Array.isArray(currentStepData.dietaryRestrictions)
      ? currentStepData.dietaryRestrictions.join(', ')
      : currentStepData.dietaryRestrictions || ''
  );
  const [budget, setBudget] = useState<number>(currentStepData.budget || 50);
  const [spicyLevel, setSpicyLevel] = useState<number>(currentStepData.spicyLevel || 3);
  const [drinkingLevel, setDrinkingLevel] = useState<number>(currentStepData.drinkingLevel || 3);
  const [adventurousLevel, setAdventurousLevel] = useState<number>(currentStepData.adventurousLevel || 3);
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
    if (value <= 20) return 'Under $20';
    if (value <= 40) return '$20-$40';
    if (value <= 60) return '$40-$60';
    if (value <= 80) return '$60-$80';
    return '$80+';
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const foodData = {
        dietaryRestrictions: dietaryRestrictions.trim(),
        budget,
        spicyLevel,
        drinkingLevel,
        adventurousLevel,
        diningAtmospheres: selectedAtmospheres,
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
    <KeyboardAvoidingView 
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flexOne}>
          <OnboardingLayout
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
            scrollable
          >
            <View style={styles.container}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>Your Taste in Food (1/2)</Text>
                <Text style={styles.subtitle}>Your preferences, cravings, and food comfort zones.</Text>
              </View>

              {hasError && errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Dietary Restrictions */}
              <View style={styles.section}>
                <Text style={styles.questionText}>Dietary Restrictions</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Leave blank if none."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={dietaryRestrictions}
                  onChangeText={setDietaryRestrictions}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Budget Slider */}
              <View style={styles.section}>
                <Text style={styles.questionText}>What's your budget for a typical social dinner?</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={budget}
                    onValueChange={setBudget}
                    minimumValue={10}
                    maximumValue={100}
                    step={5}
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
                <Text style={styles.helperText}>As long as the food and company are good, I don't mind</Text>
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
                    <Text style={styles.sliderLabel}>I don't drink</Text>
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
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </OnboardingLayout>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
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
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
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
  textInput: {
    backgroundColor: Colors.white,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    minHeight: scaleHeight(80),
    padding: scaleWidth(12),
    textAlignVertical: 'top',
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
    flex: 1,
  },
  sliderValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    paddingHorizontal: scaleWidth(10),
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
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  optionButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionButtonTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
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