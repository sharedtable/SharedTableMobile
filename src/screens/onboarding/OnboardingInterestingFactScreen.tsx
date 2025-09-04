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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingInterestingFactScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingInterestingFactScreen: React.FC<OnboardingInterestingFactScreenProps> = ({
  onNavigate,
  currentStep = 12,
  totalSteps = 12,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  const navigation = useNavigation<NavigationProp<any>>();
  const { setNeedsOnboarding } = useAuthStore();

  const [interestingFact, setInterestingFact] = useState<string>(
    currentStepData.interestingFact || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!interestingFact.trim()) {
        setLocalErrors({ interestingFact: 'Please share an interesting fact about yourself' });
        return;
      }

      if (interestingFact.trim().length < 10) {
        setLocalErrors({ interestingFact: 'Please provide a bit more detail (at least 10 characters)' });
        return;
      }

      const data = { interestingFact: interestingFact.trim() };

      const validation = validateOnboardingStep('finalTouch', data);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('finalTouch', data);

      if (success) {
        console.log('✅ [OnboardingInterestingFactScreen] Saved successfully');
        
        // Complete onboarding using simple endpoint
        try {
          // First try the simple endpoint
          await api.request('POST', '/onboarding-simple/complete', {});
          
          const { setOnboardingStatus } = useAuthStore.getState();
          await setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
          await setNeedsOnboarding(false);
          
          console.log('✅ Onboarding completed successfully!');
          
          // Navigate to main
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (error) {
          console.error('Error completing onboarding, trying fallback:', error);
          
          // Fallback to original endpoint
          try {
            await api.request('POST', '/onboarding/update-status', { 
              status: 'fully_complete' 
            });
            
            const { setOnboardingStatus } = useAuthStore.getState();
            await setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
            await setNeedsOnboarding(false);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
          
          // Still navigate even if status update fails
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingInterestingFactScreen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-hobbies');
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
                <Text style={styles.title}>Final Touch! (3/3)</Text>
                <Text style={styles.subtitle}>One last thing...</Text>
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.question}>Tell us one interesting fact about yourself!</Text>
                <Text style={styles.hint}>
                  The more unique, the better! It's a great conversation starter.
                </Text>

                {hasError && errorMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. I once backpacked solo through 15 countries in 3 months, I can solve a Rubik's cube in under a minute, I've been collecting vinyl records since I was 12 and have over 500 in my collection..."
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={6}
                  value={interestingFact}
                  onChangeText={setInterestingFact}
                  textAlignVertical="top"
                  maxLength={300}
                />

                <Text style={styles.charCount}>{interestingFact.length}/300</Text>
              </View>

              <View style={styles.spacer} />

              <View style={styles.bottomContainer}>
                <OnboardingButton
                  onPress={handleNext}
                  label={saving ? 'Completing...' : 'Complete Onboarding'}
                  disabled={!interestingFact.trim() || saving}
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