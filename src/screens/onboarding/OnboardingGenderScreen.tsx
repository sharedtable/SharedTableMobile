import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';
import { MaleIcon, FemaleIcon } from '@/components/icons/GenderIcons';

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
            style={[
              styles.genderCard,
              selectedGender === 'male' && styles.genderCardSelected
            ]}
            onPress={() => setSelectedGender('male')}
          >
            <View style={styles.iconContainer}>
              <MaleIcon 
                size={50} 
                color={theme.colors.primary.main} 
                isSelected={selectedGender === 'male'} 
              />
            </View>
            <Text style={[
              styles.genderText,
              selectedGender === 'male' && styles.genderTextSelected
            ]}>
              Male
            </Text>
          </Pressable>

          {/* Female Option */}
          <Pressable
            style={[
              styles.genderCard,
              selectedGender === 'female' && styles.genderCardSelected
            ]}
            onPress={() => setSelectedGender('female')}
          >
            <View style={styles.iconContainer}>
              <FemaleIcon 
                size={50} 
                color={theme.colors.primary.main} 
                isSelected={selectedGender === 'female'} 
              />
            </View>
            <Text style={[
              styles.genderText,
              selectedGender === 'female' && styles.genderTextSelected
            ]}>
              Female
            </Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedGender && styles.nextButtonDisabled
            ]}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(20),
    marginHorizontal: -scaleWidth(4),
  },
  headerButton: {
    padding: scaleWidth(4),
  },
  headerSpacer: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: scaleHeight(32),
  },
  progressBackground: {
    height: scaleHeight(4),
    backgroundColor: '#F0F0F0',
    borderRadius: scaleHeight(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleHeight(2),
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: scaleHeight(40),
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  genderCard: {
    flex: 1,
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderRadius: scaleWidth(16),
    paddingVertical: scaleHeight(32),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)', // 30% of brand color
    borderColor: theme.colors.primary.main,
  },
  iconContainer: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
  },
  genderText: {
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  genderTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
  },
  nextButton: {
    height: scaleHeight(52),
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
});