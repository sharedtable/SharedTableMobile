import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingHopingToMeetScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingHopingToMeetScreen: React.FC<OnboardingHopingToMeetScreenProps> = ({
  onNavigate,
  currentStep = 10,
  totalSteps = 12,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [hopingToMeet, setHopingToMeet] = useState<string>(
    currentStepData.hopingToMeet || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!hopingToMeet.trim()) {
        setLocalErrors({ hopingToMeet: 'Please tell us who you are hoping to meet' });
        return;
      }

      if (hopingToMeet.trim().length < 10) {
        setLocalErrors({ hopingToMeet: 'Please provide a bit more detail (at least 10 characters)' });
        return;
      }

      const data = { hopingToMeet: hopingToMeet.trim() };

      const validation = validateOnboardingStep('finalTouch', data);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('finalTouch', data);

      if (success) {
        console.log('✅ [OnboardingHopingToMeetScreen] Saved successfully');
        onNavigate?.('onboarding-hobbies', data);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingHopingToMeetScreen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-interests');
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
            scrollable={false}
          >
            <View style={styles.container}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>Final Touch! (1/3)</Text>
                <Text style={styles.subtitle}>Help us tailor things just right for you.</Text>
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.question}>Who are you hoping to meet?</Text>
                <Text style={styles.hint}>
                  Maybe a gym buddy, a hiking partner, or a future co-founder? Be specific! List up to 3.
                </Text>

                {hasError && errorMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Fellow entrepreneurs who are passionate about sustainability, hiking enthusiasts for weekend adventures, or creative minds to collaborate on art projects..."
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={6}
                  value={hopingToMeet}
                  onChangeText={setHopingToMeet}
                  textAlignVertical="top"
                  maxLength={300}
                />

                <Text style={styles.charCount}>{hopingToMeet.length}/300</Text>
              </View>

              <View style={styles.spacer} />

              <View style={styles.bottomContainer}>
                <OnboardingButton
                  onPress={handleNext}
                  label={saving ? 'Saving...' : 'Next'}
                  disabled={!hopingToMeet.trim() || saving}
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
  questionSection: {
    flex: 1,
  },
  question: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
  },
  hint: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
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
  textInput: {
    backgroundColor: Colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    minHeight: scaleHeight(120),
    padding: scaleWidth(16),
    textAlignVertical: 'top',
  },
  charCount: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(8),
    textAlign: 'right',
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(20),
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});