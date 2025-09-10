import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  Animated
} from 'react-native';

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

const foodCravingOptions = [
  'Pizza',
  'Burgers',
  'Sushi',
  'Ramen',
  'Tacos',
  'Pasta',
  'Steak',
  'Salad',
  'Sandwich',
  'Fried Chicken',
  'Seafood',
  'BBQ Ribs',
  'Pho',
  'Dim Sum',
  'Curry',
  'Burritos',
  'Wings',
  'Poke Bowl',
  'Hot Pot',
  'Dumplings',
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
  const [selectedCravings, setSelectedCravings] = useState<string[]>(
    Array.isArray(currentStepData.foodCraving)
      ? currentStepData.foodCraving
      : currentStepData.foodCraving
        ? currentStepData.foodCraving.split(', ').filter(Boolean)
        : []
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isRolling, setIsRolling] = useState(false);
  const animatedValues = useRef(
    foodCravingOptions.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const toggleCraving = (craving: string) => {
    setSelectedCravings(prev =>
      prev.includes(craving)
        ? prev.filter(c => c !== craving)
        : [...prev, craving]
    );
  };

  const randomizeCravings = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setSelectedCravings([]); // Clear current selections
    
    // Create staggered animations for each button
    const animations = animatedValues.map((anim, index) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 100,
          delay: index * 30, // Stagger the start
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.8,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
    });
    
    // Run all animations in parallel
    Animated.parallel(animations).start(() => {
      // After animation, select random items
      const shuffled = [...foodCravingOptions].sort(() => 0.5 - Math.random());
      const numToSelect = Math.floor(Math.random() * 3) + 3; // Random between 3-5
      setSelectedCravings(shuffled.slice(0, numToSelect));
      setIsRolling(false);
    });
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
        foodCraving: selectedCravings.join(', '),
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


              {/* Food Craving */}
              <View style={styles.section}>
                <Text style={styles.questionText}>What kind of food are you craving right now?</Text>
                <View style={styles.helperRow}>
                  <Text style={styles.helperText}>(Multi-select allowed)</Text>
                  <TouchableOpacity
                    style={[styles.rouletteButton, isRolling && styles.rouletteButtonActive]}
                    onPress={randomizeCravings}
                    activeOpacity={0.7}
                    disabled={isRolling}
                  >
                    <Animated.Text style={[
                      styles.rouletteIcon,
                      isRolling && {
                        transform: [{
                          rotate: animatedValues[0].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg']
                          })
                        }]
                      }
                    ]}>🎰</Animated.Text>
                    <Text style={[styles.rouletteText, isRolling && styles.rouletteTextActive]}>
                      {isRolling ? 'Rolling...' : 'Surprise me!'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.optionsContainer}>
                  {foodCravingOptions.map((craving, index) => (
                    <Animated.View
                      key={craving}
                      style={{
                        transform: [{ scale: animatedValues[index] }],
                        opacity: isRolling ? animatedValues[index] : 1,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          selectedCravings.includes(craving) && styles.optionButtonSelected,
                          isRolling && styles.optionButtonRolling
                        ]}
                        onPress={() => !isRolling && toggleCraving(craving)}
                        activeOpacity={0.7}
                        disabled={isRolling}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          selectedCravings.includes(craving) && styles.optionButtonTextSelected
                        ]}>
                          {craving}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
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
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  rouletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(4),
  },
  rouletteButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  rouletteIcon: {
    fontSize: scaleFont(16),
  },
  rouletteText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  rouletteTextActive: {
    color: Colors.white,
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
  optionButtonRolling: {
    borderColor: theme.colors.primary.light,
    backgroundColor: Colors.backgroundGrayLighter,
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