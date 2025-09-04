import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity
} from 'react-native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingLifestyleScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

interface LifestyleTraits {
  earlyBirdNightOwl: number;
  activePerson: number;
  punctuality: number;
  workLifeBalance: number;
}

const substanceOptions = [
  'Alcohol',
  'Tobacco',
  'Weed',
  'Other recreational Drugs',
  'None',
];

const lifestyleQuestions = [
  {
    key: 'earlyBirdNightOwl' as keyof LifestyleTraits,
    question: 'Are you more of an early bird or night owl?',
    leftLabel: 'Early Bird',
    rightLabel: 'Night Owl',
  },
  {
    key: 'activePerson' as keyof LifestyleTraits,
    question: 'Are you an active person?',
    leftLabel: 'Not at all',
    rightLabel: 'Always',
  },
  {
    key: 'punctuality' as keyof LifestyleTraits,
    question: 'I always try to arrive on time.',
    leftLabel: "I'm usually late",
    rightLabel: "I'm always on time",
  },
  {
    key: 'workLifeBalance' as keyof LifestyleTraits,
    question: 'Work-life balance is a priority for me',
    leftLabel: 'Not at all',
    rightLabel: 'Always',
  },
];

export const OnboardingLifestyleScreen: React.FC<OnboardingLifestyleScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedSubstances, setSelectedSubstances] = useState<string[]>(
    currentStepData.substances || []
  );
  
  const [traits, setTraits] = useState<LifestyleTraits>(() => {
    // Check if lifestyle traits were saved as an object or need to be initialized
    return {
      earlyBirdNightOwl: currentStepData.earlyBirdNightOwl || 5,
      activePerson: currentStepData.activePerson || 5,
      punctuality: currentStepData.punctuality || 5,
      workLifeBalance: currentStepData.workLifeBalance || 5,
    };
  });
  
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleTraitChange = (key: keyof LifestyleTraits, value: number) => {
    setTraits(prev => ({ ...prev, [key]: Math.round(value) }));
  };

  const toggleSubstance = (substance: string) => {
    setSelectedSubstances(prev => {
      // If "None" is selected, clear all other selections
      if (substance === 'None') {
        return ['None'];
      }
      
      // If selecting something else, remove "None" if it was selected
      const filtered = prev.filter(s => s !== 'None');
      
      if (prev.includes(substance)) {
        return filtered.filter(s => s !== substance);
      }
      
      return [...filtered, substance];
    });
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Validation
      if (selectedSubstances.length === 0) {
        setLocalErrors({ substances: 'Please select at least one option' });
        return;
      }

      // Prepare lifestyle data
      const lifestyleData = {
        ...traits,
        substances: selectedSubstances,
        // Map old field names for compatibility if needed
        alcoholUse: selectedSubstances.includes('Alcohol') ? 'Yes' : 'No',
        cannabisUse: selectedSubstances.includes('Weed') ? 'Yes' : 'No',
        otherDrugsUse: selectedSubstances.includes('Other recreational Drugs') ? 'Yes' : 'No',
      };

      const validation = validateOnboardingStep('lifestyle', lifestyleData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('lifestyle', lifestyleData);

      if (success) {
        console.log('✅ [OnboardingLifestyleScreen] Lifestyle saved successfully');
        onNavigate?.('onboarding-food-1', lifestyleData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingLifestyleScreen] Error saving lifestyle:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-personality');
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
        <OnboardingTitle>Lifestyle & Beliefs</OnboardingTitle>
        
        <Text style={styles.subtitle}>
          Your habits, rhythms, and what matters most to you.
        </Text>

        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Lifestyle Sliders */}
        <View style={styles.section}>
          {lifestyleQuestions.map((q) => (
            <View key={q.key} style={styles.sliderContainer}>
              <Text style={styles.question}>{q.question}</Text>
              
              <View style={styles.sliderWrapper}>
                <Slider
                  style={styles.slider}
                  value={traits[q.key]}
                  onValueChange={(value) => handleTraitChange(q.key, value)}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  minimumTrackTintColor={theme.colors.primary.main}
                  maximumTrackTintColor={Colors.borderLight}
                  thumbTintColor={theme.colors.primary.main}
                />
                
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>{q.leftLabel}</Text>
                  <Text style={styles.sliderValue}>{traits[q.key]}</Text>
                  <Text style={styles.sliderLabel}>{q.rightLabel}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Substance Use Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I use the following</Text>
          <Text style={styles.sectionSubtitle}>Multi-select allowed</Text>
          
          <View style={styles.substancesGrid}>
            {substanceOptions.map((substance) => (
              <TouchableOpacity
                key={substance}
                style={[
                  styles.substanceButton,
                  selectedSubstances.includes(substance) && styles.substanceButtonSelected
                ]}
                onPress={() => toggleSubstance(substance)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.substanceButtonText,
                  selectedSubstances.includes(substance) && styles.substanceButtonTextSelected
                ]}>
                  {substance}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={selectedSubstances.length === 0 || saving}
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
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(20),
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
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(12),
  },
  sliderContainer: {
    marginBottom: scaleHeight(20),
  },
  question: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
    lineHeight: scaleFont(20),
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
  substancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  substanceButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundGrayLight,
  },
  substanceButtonSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  substanceButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  substanceButtonTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});