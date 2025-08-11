import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { MaleIcon, FemaleIcon } from '@/components/icons/GenderIcons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingGenderScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

export const OnboardingGenderScreen: React.FC<OnboardingGenderScreenProps> = ({
  onNavigate,
  currentStep = 3,
  totalSteps = 10,
  userData = {},
}) => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleNext = () => {
    if (!selectedGender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }

    onNavigate?.('onboarding-dependents', {
      ...userData,
      gender: selectedGender,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-birthday');
  };

  // Calculate progress percentage
  const progress = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>What's your gender?</Text>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {/* Male Option */}
          <Pressable
            style={[styles.genderCard, selectedGender === 'male' && styles.genderCardSelected]}
            onPress={() => setSelectedGender('male')}
          >
            <View style={styles.iconContainer}>
              <MaleIcon
                size={50}
                color={theme.colors.primary.main}
                isSelected={selectedGender === 'male'}
              />
            </View>
            <Text
              style={[styles.genderText, selectedGender === 'male' && styles.genderTextSelected]}
            >
              Male
            </Text>
          </Pressable>

          {/* Female Option */}
          <Pressable
            style={[styles.genderCard, selectedGender === 'female' && styles.genderCardSelected]}
            onPress={() => setSelectedGender('female')}
          >
            <View style={styles.iconContainer}>
              <FemaleIcon
                size={50}
                color={theme.colors.primary.main}
                isSelected={selectedGender === 'female'}
              />
            </View>
            <Text
              style={[styles.genderText, selectedGender === 'female' && styles.genderTextSelected]}
            >
              Female
            </Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <Pressable
            style={[styles.nextButton, !selectedGender && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedGender}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  genderCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderColor: 'transparent',
    borderRadius: scaleWidth(16),
    borderWidth: 2,
    flex: 1,
    paddingVertical: scaleHeight(32),
  },
  genderCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)', // 30% of brand color
    borderColor: theme.colors.primary.main,
  },
  genderText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  genderTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: -scaleWidth(4),
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(12),
  },
  headerButton: {
    padding: scaleWidth(4),
  },
  headerSpacer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    height: scaleWidth(60),
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    width: scaleWidth(60),
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  progressBackground: {
    backgroundColor: '#F0F0F0',
    borderRadius: scaleHeight(2),
    height: scaleHeight(4),
    overflow: 'hidden',
  },
  progressContainer: {
    marginBottom: scaleHeight(32),
  },
  progressFill: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleHeight(2),
    height: '100%',
  },
  spacer: {
    flex: 1,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    marginBottom: scaleHeight(40),
  },
});
