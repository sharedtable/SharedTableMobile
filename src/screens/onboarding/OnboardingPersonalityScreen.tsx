import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingPersonalityScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

interface PersonalityTraits {
  earlyBirdNightOwl: number;
  activePerson: number;
  enjoyGym: number;
  workLifeBalance: number;
  leadConversations: number;
  willingCompromise: number;
  seekExperiences: number;
  politicalViews: number;
}

const mbtiTypes = [
  { code: 'INTJ', name: 'The Architect' },
  { code: 'INTP', name: 'The Thinker' },
  { code: 'ENTJ', name: 'The Commander' },
  { code: 'ENTP', name: 'The Debater' },
  { code: 'INFJ', name: 'The Advocate' },
  { code: 'INFP', name: 'The Mediator' },
  { code: 'ENFJ', name: 'The Protagonist' },
  { code: 'ENFP', name: 'The Campaigner' },
  { code: 'ISTJ', name: 'The Logistician' },
  { code: 'ISFJ', name: 'The Protector' },
  { code: 'ESTJ', name: 'The Executive' },
  { code: 'ESFJ', name: 'The Consul' },
  { code: 'ISTP', name: 'The Virtuoso' },
  { code: 'ISFP', name: 'The Adventurer' },
  { code: 'ESTP', name: 'The Entrepreneur' },
  { code: 'ESFP', name: 'The Entertainer' },
];

const questionsPage1 = [
  {
    key: 'earlyBirdNightOwl',
    question: 'Are you more of an early bird or night owl?',
    leftLabel: 'Early Bird',
    rightLabel: 'Night Owl',
  },
  {
    key: 'activePerson',
    question: 'Are you an active person?',
    leftLabel: 'Not at all',
    rightLabel: 'Extremely',
  },
  {
    key: 'enjoyGym',
    question: 'Do you enjoy going to the gym?',
    leftLabel: 'Not at all',
    rightLabel: 'Extremely',
  },
  {
    key: 'workLifeBalance',
    question: 'Is work-life balance important to you?',
    leftLabel: 'Not important',
    rightLabel: 'Very important',
  },
];

const questionsPage2 = [
  {
    key: 'leadConversations',
    question: 'I often take the lead in starting conversations',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    key: 'willingCompromise',
    question: "I'm willing to compromise to keep the peace",
    leftLabel: 'Not at all',
    rightLabel: 'Extremely',
  },
  {
    key: 'seekExperiences',
    question: 'I actively seek out new experiences, even if they push me outside my comfort zone',
    leftLabel: 'Not at all',
    rightLabel: 'Extremely',
  },
  {
    key: 'politicalViews',
    question: 'In terms of my political views, I am',
    leftLabel: 'Liberal',
    rightLabel: 'Conservative',
  },
];

export const OnboardingPersonalityScreen: React.FC<OnboardingPersonalityScreenProps> = ({
  onNavigate,
  currentStep = 10,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMbti, setSelectedMbti] = useState<string | null>(
    currentStepData.mbtiType || null
  );
  const [punctuality, setPunctuality] = useState<number>(currentStepData.punctuality || 5);
  const [showMbtiDropdown, setShowMbtiDropdown] = useState(false);
  const [traits, setTraits] = useState<PersonalityTraits>(() => {
    // Check if personalityTraits is an array (from database) and convert back to object
    if (Array.isArray(currentStepData.personalityTraits)) {
      const traitsFromArray: Partial<PersonalityTraits> = {};
      currentStepData.personalityTraits.forEach((trait: string) => {
        const [key, value] = trait.split(': ');
        if (key && value) {
          traitsFromArray[key as keyof PersonalityTraits] = parseInt(value, 10);
        }
      });
      return {
        earlyBirdNightOwl: 5,
        activePerson: 5,
        enjoyGym: 5,
        workLifeBalance: 5,
        leadConversations: 5,
        willingCompromise: 5,
        seekExperiences: 5,
        politicalViews: 5,
        ...traitsFromArray,
      };
    }

    return {
      earlyBirdNightOwl: 5,
      activePerson: 5,
      enjoyGym: 5,
      workLifeBalance: 5,
      leadConversations: 5,
      willingCompromise: 5,
      seekExperiences: 5,
      politicalViews: 5,
    };
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    if (currentPage === 1) {
      setCurrentPage(2);
      return;
    }
    
    if (currentPage === 2) {
      setCurrentPage(3);
      return;
    }

    try {
      setLocalErrors({});
      clearErrors();

      // Convert personality traits to array format for validation
      const personalityTraits = Object.keys(traits).map(
        (key) => `${key}: ${traits[key as keyof PersonalityTraits]}`
      );
      const personalityData = { 
        personalityTraits,
        mbtiType: selectedMbti,
        punctuality,
      };

      // Validate locally first
      const validation = validateOnboardingStep('personality', personalityData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('personality', personalityData);

      if (success) {
        console.log('✅ [OnboardingPersonalityScreen] Personality saved successfully');
        onNavigate?.('onboarding-photo', personalityData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your personality profile. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingPersonalityScreen] Error saving personality:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentPage === 3) {
      setCurrentPage(2);
    } else if (currentPage === 2) {
      setCurrentPage(1);
    } else {
      onNavigate?.('onboarding-interests');
    }
  };

  const updateTrait = (key: string, value: number) => {
    setTraits((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const questions = currentPage === 1 ? questionsPage1 : questionsPage2;
  const isLastPage = currentPage === 3;
  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.personalityTraits ||
    stepErrors.personalityTraits ||
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
        {/* Page Title */}
        <OnboardingTitle>
          {currentPage === 1 ? 'Tell us about yourself' : currentPage === 2 ? 'Your personality' : 'More about you'}
        </OnboardingTitle>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Content based on current page */}
        {currentPage === 3 ? (
          <View>
            {/* MBTI Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>MBTI Personality Type <Text style={styles.optional}>(Optional)</Text></Text>
              <Text style={styles.sectionSubtitle}>
                If you know your Myers-Briggs personality type, select it below.
              </Text>
              
              <Pressable
                style={[
                  styles.dropdownButton,
                  selectedMbti && styles.dropdownButtonSelected,
                  showMbtiDropdown && styles.dropdownButtonActive,
                ]}
                onPress={() => setShowMbtiDropdown(!showMbtiDropdown)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  selectedMbti && styles.dropdownButtonTextSelected,
                ]}>
                  {selectedMbti ? `${selectedMbti} - ${mbtiTypes.find(t => t.code === selectedMbti)?.name}` : 'Select your MBTI type (optional)'}
                </Text>
                <Ionicons 
                  name={showMbtiDropdown ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={selectedMbti ? theme.colors.primary.main : '#9CA3AF'} 
                />
              </Pressable>
              
              {showMbtiDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {mbtiTypes.map((type) => (
                      <Pressable
                        key={type.code}
                        style={[
                          styles.dropdownOption,
                          selectedMbti === type.code && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedMbti(type.code);
                          setShowMbtiDropdown(false);
                        }}
                      >
                        <View style={styles.mbtiOptionContent}>
                          <Text style={[
                            styles.mbtiCode,
                            selectedMbti === type.code && styles.mbtiCodeSelected,
                          ]}>
                            {type.code}
                          </Text>
                          <Text style={[
                            styles.mbtiName,
                            selectedMbti === type.code && styles.mbtiNameSelected,
                          ]}>
                            {type.name}
                          </Text>
                        </View>
                        {selectedMbti === type.code && (
                          <Ionicons name="checkmark" size={16} color={theme.colors.primary.main} />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Punctuality Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Punctuality</Text>
              <Text style={styles.sectionSubtitle}>
                How would you describe your punctuality?
              </Text>
              
              <View style={styles.sliderContainer}>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    value={punctuality}
                    onValueChange={(value) => setPunctuality(Math.round(value))}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor="rgba(226, 72, 73, 0.1)"
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View
                    style={[
                      styles.valueOnBottom,
                      { left: `${((punctuality - 1) / 9) * 100}%` },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.valueText}>{punctuality}</Text>
                  </View>
                </View>

                <View style={styles.labelsContainer}>
                  <Text style={styles.labelLeft}>Always late</Text>
                  <Text style={styles.labelRight}>Always early</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* Questions for pages 1 and 2 */
          questions.map((q, _index) => (
            <View key={q.key} style={styles.questionContainer}>
              <Text style={styles.question}>{q.question}</Text>

              <View style={styles.sliderContainer}>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    value={traits[q.key as keyof PersonalityTraits]}
                    onValueChange={(value) => updateTrait(q.key, Math.round(value))}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor="rgba(226, 72, 73, 0.1)"
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View
                    style={[
                      styles.valueOnBottom,
                      {
                        left: `${((traits[q.key as keyof PersonalityTraits] - 1) / 9) * 100}%`,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.valueText}>{traits[q.key as keyof PersonalityTraits]}</Text>
                  </View>
                </View>

                <View style={styles.labelsContainer}>
                  <Text style={styles.labelLeft}>{q.leftLabel}</Text>
                  <Text style={styles.labelRight}>{q.rightLabel}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : isLastPage ? 'Next' : 'Continue'}
            loading={saving}
            disabled={saving}
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
  sectionContainer: {
    marginBottom: scaleHeight(32),
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
  optional: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '400',
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.08)',
    borderColor: theme.colors.primary.main,
  },
  dropdownButtonActive: {
    borderColor: theme.colors.primary.main,
  },
  dropdownButtonText: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    marginTop: scaleHeight(8),
    maxHeight: scaleHeight(250),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: scaleHeight(250),
  },
  dropdownOption: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.08)',
  },
  mbtiOptionContent: {
    flex: 1,
  },
  mbtiCode: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  mbtiCodeSelected: {
    color: theme.colors.primary.main,
  },
  mbtiName: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  mbtiNameSelected: {
    color: theme.colors.text.primary,
  },
  labelLeft: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  labelRight: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(20), // Add space for the value below slider
  },
  question: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(18),
    fontWeight: '600',
    lineHeight: scaleHeight(24),
    marginBottom: scaleHeight(12),
  },
  questionContainer: {
    marginBottom: scaleHeight(24),
  },
  slider: {
    height: scaleHeight(30),
    width: '100%',
  },
  sliderContainer: {
    paddingHorizontal: scaleWidth(8),
  },
  sliderWrapper: {
    position: 'relative',
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(20),
  },
  valueOnBottom: {
    alignItems: 'center',
    bottom: scaleHeight(-25), // Position below the slider
    marginLeft: -scaleWidth(10), // Center the number
    position: 'absolute',
    width: scaleWidth(20),
  },
  valueText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(10),
  },
});
