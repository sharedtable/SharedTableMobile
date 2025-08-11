import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingPersonalityScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
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
  currentStep = 9,
  totalSteps = 10,
  userData = {},
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [traits, setTraits] = useState<PersonalityTraits>({
    earlyBirdNightOwl: 5,
    activePerson: 5,
    enjoyGym: 5,
    workLifeBalance: 5,
    leadConversations: 5,
    willingCompromise: 5,
    seekExperiences: 5,
    politicalViews: 5,
  });

  const handleNext = () => {
    if (currentPage === 1) {
      setCurrentPage(2);
    } else {
      onNavigate?.('onboarding-photo', {
        ...userData,
        personalityTraits: traits,
      });
    }
  };

  const handleBack = () => {
    if (currentPage === 2) {
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
          {currentPage === 1 ? 'Tell us about yourself' : 'Your personality'}
        </OnboardingTitle>

        {/* Questions */}
        {questions.map((q, _index) => (
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
        ))}

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleNext} label={currentPage === 1 ? 'Continue' : 'Next'} />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(10),
  },
  container: {
    flex: 1,
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
    fontWeight: '600' as any,
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
    fontWeight: '700' as any,
  },
});
