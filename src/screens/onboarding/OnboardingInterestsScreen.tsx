import React, { useState } from 'react';
import { View, Alert, StyleSheet, Text, Pressable } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';

interface OnboardingInterestsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
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
  currentStep = 9,
  totalSteps = 10,
  userData = {},
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  };

  const handleNext = () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Required', 'Please select at least one interest');
      return;
    }

    onNavigate?.('onboarding-personality', {
      ...userData,
      interests: selectedInterests,
    });
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
            label="Next"
            disabled={selectedInterests.length === 0}
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
