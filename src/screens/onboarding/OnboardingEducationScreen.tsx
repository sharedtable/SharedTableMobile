import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput,
  Keyboard,
  Platform,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Animated
} from 'react-native';

import { 
  OnboardingLayout, 
  OnboardingTitle, 
  OnboardingButton, 
  SingleChoiceOption 
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { searchSchools } from '@/data/schools';
import { Colors } from '@/constants/colors';

interface OnboardingEducationScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingEducationScreen: React.FC<OnboardingEducationScreenProps> = ({
  onNavigate,
  currentStep = 1,
  totalSteps = 6,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedEducation, setSelectedEducation] = useState<string | null>(
    currentStepData.educationLevel || null
  );
  const [school, setSchool] = useState<string>(
    currentStepData.school || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRef = useRef<View>(null);

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Handle keyboard show/hide animations
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();

        // Scroll to show input when keyboard appears
        setTimeout(() => {
          if (inputContainerRef.current && scrollViewRef.current) {
            inputContainerRef.current.measureLayout(
              scrollViewRef.current as any,
              (_x, y) => {
                // Minimal scroll - just enough to see the input
                const scrollToY = Math.max(0, y - 150); // Larger offset to keep more content visible
                scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
              },
              () => {}
            );
          }
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [keyboardHeight]);

  const handleSchoolChange = (text: string) => {
    setSchool(text);
    
    if (text.length >= 2) {
      const suggestions = searchSchools(text, 8);
      setSchoolSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSchoolSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSchool = (schoolName: string) => {
    setSchool(schoolName);
    setShowSuggestions(false);
    setSchoolSuggestions([]);
    // Don't dismiss keyboard at all - let user continue if they want
    // They can dismiss it manually or by pressing Next
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!selectedEducation) {
        setLocalErrors({ educationLevel: 'Please select your education level' });
        return;
      }

      const educationData = {
        educationLevel: selectedEducation,
        school: school.trim(),
      };

      const validation = validateOnboardingStep('education', educationData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('education', educationData);

      if (success) {
        console.log('✅ [OnboardingEducationScreen] Education saved successfully');
        onNavigate?.('onboarding-work', educationData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your education. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingEducationScreen] Error saving education:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('back');
  };

  // Simplified education options
  const educationOptions = [
    { id: 'high_school', label: 'High school or equivalent' },
    { id: 'bachelor', label: "Bachelor's degree" },
    { id: 'master', label: "Master's degree" },
    { id: 'doctorate', label: 'Doctorate (PhD)' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = localErrors.educationLevel || stepErrors.educationLevel || localErrors.school || stepErrors.school;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable={false}
      keyboardAvoiding={false}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.container}>
        <OnboardingTitle>Your Education</OnboardingTitle>

        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          {educationOptions.map((option) => (
            <SingleChoiceOption
              key={option.id}
              label={option.label}
              selected={selectedEducation === option.id}
              onPress={() => {
                setSelectedEducation(option.id);
                if (localErrors.educationLevel || stepErrors.educationLevel) {
                  setLocalErrors({});
                  clearErrors();
                }
              }}
            />
          ))}
        </View>

        <View ref={inputContainerRef} style={styles.inputSection}>
          <Text style={styles.inputLabel}>Where did you go to school?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="e.g., Stanford University"
              placeholderTextColor="#9CA3AF"
              value={school}
              onChangeText={handleSchoolChange}
              onFocus={() => {
                if (school.length >= 2) {
                  const suggestions = searchSchools(school, 8);
                  setSchoolSuggestions(suggestions);
                  setShowSuggestions(suggestions.length > 0);
                }
                // Scroll to input after a delay to ensure keyboard is shown
                setTimeout(() => {
                  if (inputContainerRef.current && scrollViewRef.current) {
                    inputContainerRef.current.measureLayout(
                      scrollViewRef.current as any,
                      (_x, y) => {
                        const scrollToY = Math.max(0, y - 150); // Larger offset to keep more content visible
                        scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
                      },
                      () => {}
                    );
                  }
                }, 300);
              }}
              autoCapitalize="words"
              autoCorrect={false}  // Disable auto-correction
              autoComplete="off"   // Disable auto-complete
              spellCheck={false}   // Disable spell check
              returnKeyType="done"
              onSubmitEditing={() => {
                setShowSuggestions(false);
                Keyboard.dismiss();
              }}
            />
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <ScrollView 
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={false}
                  showsVerticalScrollIndicator={true}
                  bounces={false}
                >
                  {schoolSuggestions.map((schoolName, index) => (
                    <TouchableOpacity
                      key={schoolName}
                      style={[
                        styles.suggestionItem,
                        index === schoolSuggestions.length - 1 && styles.suggestionItemLast
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        handleSelectSchool(schoolName);
                      }}
                    >
                      <Text style={styles.suggestionText}>{schoolName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!selectedEducation || saving}
            loading={saving}
          />
        </View>
        
        {/* Extra padding for keyboard */}
        <Animated.View style={{ height: keyboardHeight }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleHeight(10),
  },
  container: {
    flex: 1,
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
  optionsContainer: {
    marginTop: scaleHeight(4),
  },
  inputSection: {
    marginTop: scaleHeight(20),
  },
  inputLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
    marginBottom: scaleHeight(8),
  },
  textInput: {
    backgroundColor: Colors.backgroundGrayLight,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  bottomContainer: {
    marginTop: scaleHeight(20),
    paddingBottom: scaleHeight(10),
    paddingTop: scaleHeight(10),
  },
  inputContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    marginTop: scaleHeight(4),
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: scaleHeight(200),
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black['1'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  suggestionItem: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.backgroundGrayLighter,
    backgroundColor: theme.colors.white,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  // suggestionPressed: { // Removed unused style
  //   backgroundColor: Colors.backgroundGrayLight,
  // },
  suggestionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
});