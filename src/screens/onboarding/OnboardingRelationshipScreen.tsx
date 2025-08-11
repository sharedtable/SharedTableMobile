import React, { useState } from 'react';
import { View, Alert, StyleSheet, Text } from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingRelationshipScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

const relationshipTypes = ['Long term', 'Short term', 'Polyamorous', 'Open relationship', 'Other'];

const timeSinceOptions = ['0 - 3 months', '3 - 12 months', '> 12 months'];

export const OnboardingRelationshipScreen: React.FC<OnboardingRelationshipScreenProps> = ({
  onNavigate,
  currentStep = 7,
  totalSteps = 10,
  userData = {},
}) => {
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | null>(null);
  const [selectedTimeSince, setSelectedTimeSince] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedRelationshipType) {
      Alert.alert('Required', 'Please select what kind of relationship you are looking for');
      return;
    }

    if (!selectedTimeSince) {
      Alert.alert('Required', 'Please select how long it has been since your last relationship');
      return;
    }

    onNavigate?.('onboarding-lifestyle', {
      ...userData,
      relationshipType: selectedRelationshipType,
      timeSinceLastRelationship: selectedTimeSince,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-ethnicity');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>What kind of relationship are you looking for?</OnboardingTitle>

        <View style={styles.optionsContainer}>
          {relationshipTypes.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedRelationshipType === option}
              onPress={() => setSelectedRelationshipType(option)}
              compact
            />
          ))}
        </View>

        <Text style={styles.secondTitle}>How long has it been since your last relationship?</Text>

        <View style={styles.optionsContainer}>
          {timeSinceOptions.map((option) => (
            <SelectionCard
              key={option}
              label={option}
              selected={selectedTimeSince === option}
              onPress={() => setSelectedTimeSince(option)}
              compact
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Next"
            disabled={!selectedRelationshipType || !selectedTimeSince}
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
  optionsContainer: {
    gap: scaleHeight(12),
  },
  secondTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    lineHeight: scaleHeight(40),
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(32),
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
});
