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

interface OnboardingFoodPreferences2ScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const dinnerDurationOptions = [
  '< 30 min',
  '30-45 min',
  '> 45 m',
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
  const [zipCode, setZipCode] = useState<string>(
    currentStepData.zipCode || ''
  );
  const [travelDistance, setTravelDistance] = useState<number>(
    currentStepData.travelDistance || 5
  );
  const [foodCraving, setFoodCraving] = useState<string>(
    currentStepData.foodCraving || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const getDistanceLabel = (value: number): string => {
    if (value <= 1) return 'Under 1 mile';
    if (value <= 10) return `${Math.round(value)} miles`;
    return '10+ miles';
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
        zipCode: zipCode.trim(),
        travelDistance,
        foodCraving: foodCraving.trim(),
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
                <Text style={styles.title}>Your Taste in Food (2/2)</Text>
                <Text style={styles.subtitle}>Your preferences, cravings, and food comfort zones.</Text>
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

              {/* Zip Code */}
              <View style={styles.section}>
                <Text style={styles.questionText}>Zip/ Postal code</Text>
                <View style={styles.zipCodeContainer}>
                  <TextInput
                    style={styles.zipCodeInput}
                    placeholder="00000"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={zipCode}
                    onChangeText={setZipCode}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>😋</Text>
                  </View>
                </View>
              </View>

              {/* Travel Distance */}
              <View style={styles.section}>
                <Text style={styles.questionText}>Ideal distance willing to travel for dinners</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={travelDistance}
                    onValueChange={setTravelDistance}
                    minimumValue={0.5}
                    maximumValue={15}
                    step={0.5}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor={Colors.borderLight}
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Under 1 mile</Text>
                    <Text style={styles.sliderValue}>{getDistanceLabel(travelDistance)}</Text>
                    <Text style={styles.sliderLabel}>10+ miles</Text>
                  </View>
                </View>
                <View style={styles.emojiContainer2}>
                  <Text style={styles.emoji}>🚗</Text>
                </View>
              </View>

              {/* Food Craving */}
              <View style={styles.section}>
                <Text style={styles.questionText}>What kind of food are you craving right now?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type here..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={foodCraving}
                  onChangeText={setFoodCraving}
                  multiline
                  numberOfLines={3}
                />
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
    gap: scaleWidth(16),
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
  zipCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  zipCodeInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    height: scaleHeight(50),
    paddingHorizontal: scaleWidth(12),
  },
  emojiContainer: {
    position: 'absolute',
    right: scaleWidth(12),
    top: '50%',
    transform: [{ translateY: -scaleHeight(15) }],
  },
  emojiContainer2: {
    position: 'absolute',
    right: scaleWidth(12),
    top: scaleHeight(40),
  },
  emoji: {
    fontSize: scaleFont(30),
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
    fontSize: scaleFont(14),
    fontWeight: '600',
    paddingHorizontal: scaleWidth(10),
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