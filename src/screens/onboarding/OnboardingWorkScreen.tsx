import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Alert, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  Keyboard
} from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { searchJobs, industryCategories } from '@/data/jobs';
import { Colors } from '@/constants/colors';

interface OnboardingWorkScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingWorkScreen: React.FC<OnboardingWorkScreenProps> = ({
  onNavigate,
  currentStep = 5,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [jobTitle, setJobTitle] = useState<string>(
    currentStepData.jobTitle || ''
  );
  const [industry, setIndustry] = useState<string>(
    currentStepData.lineOfWork || ''
  );
  const [company, setCompany] = useState<string>(
    currentStepData.company || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [showIndustryOptions, setShowIndustryOptions] = useState(false);
  
  const jobInputRef = useRef<TextInput>(null);

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleJobTitleChange = (text: string) => {
    setJobTitle(text);
    
    if (text.length >= 2) {
      const suggestions = searchJobs(text, 8);
      setJobSuggestions(suggestions);
      setShowJobSuggestions(suggestions.length > 0);
    } else {
      setJobSuggestions([]);
      setShowJobSuggestions(false);
    }
  };

  const handleSelectJob = (job: string) => {
    setJobTitle(job);
    setShowJobSuggestions(false);
    setJobSuggestions([]);
    Keyboard.dismiss();
  };

  const handleSelectIndustry = (selectedIndustry: string) => {
    setIndustry(selectedIndustry);
    setShowIndustryOptions(false);
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!jobTitle.trim()) {
        setLocalErrors({ jobTitle: 'Please enter your job title or occupation' });
        return;
      }

      if (!industry) {
        setLocalErrors({ lineOfWork: 'Please select your industry' });
        return;
      }

      const workData = { 
        jobTitle: jobTitle.trim(),
        lineOfWork: industry,
        company: company.trim()
      };

      const validation = validateOnboardingStep('work', workData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('work', workData);

      if (success) {
        console.log('✅ [OnboardingWorkScreen] Work data saved successfully');
        onNavigate?.('onboarding-background', workData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingWorkScreen] Error saving work:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-education');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <KeyboardAvoidingView 
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingLayout
        onBack={handleBack}
        currentStep={currentStep}
        totalSteps={totalSteps}
        scrollable
        keyboardAvoiding
      >
        <Pressable 
          style={styles.container}
          onPress={() => {
            setShowJobSuggestions(false);
            setShowIndustryOptions(false);
            Keyboard.dismiss();
          }}
        >
          <OnboardingTitle>What do you do for work?</OnboardingTitle>

          {hasError && errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Job Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Job Title / Occupation *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                ref={jobInputRef}
                style={styles.textInput}
                placeholder="e.g., Software Engineer, Teacher, Doctor"
                placeholderTextColor="#9CA3AF"
                value={jobTitle}
                onChangeText={handleJobTitleChange}
                onFocus={() => {
                  if (jobTitle.length >= 2) {
                    const suggestions = searchJobs(jobTitle, 8);
                    setJobSuggestions(suggestions);
                    setShowJobSuggestions(suggestions.length > 0);
                  }
                }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => {
                  setShowJobSuggestions(false);
                }}
              />
              {showJobSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView 
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {jobSuggestions.map((job, index) => (
                      <TouchableOpacity
                        key={`${job}-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectJob(job)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionText}>{job}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <Text style={styles.helperText}>
              Type your job title or select from suggestions
            </Text>
          </View>

          {/* Industry Selection */}
          <View style={[styles.inputSection, { zIndex: 2 }]}>
            <Text style={styles.inputLabel}>Industry *</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowIndustryOptions(!showIndustryOptions)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectButtonText,
                  !industry && styles.placeholderText
                ]}>
                  {industry || 'Select your industry'}
                </Text>
                <Text style={styles.selectButtonArrow}>
                  {showIndustryOptions ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              
              {showIndustryOptions && (
                <View style={styles.optionsContainer}>
                  <ScrollView 
                    style={styles.optionsScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {industryCategories.map((ind) => (
                      <TouchableOpacity
                        key={ind}
                        style={[
                          styles.optionItem,
                          industry === ind && styles.optionItemSelected
                        ]}
                        onPress={() => handleSelectIndustry(ind)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.optionText,
                          industry === ind && styles.optionTextSelected
                        ]}>
                          {ind}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Company Input (Optional) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Company (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Google, Stanford University, Self-employed"
              placeholderTextColor="#9CA3AF"
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <Text style={styles.helperText}>
              Where do you currently work?
            </Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.bottomContainer}>
            <OnboardingButton
              onPress={handleNext}
              label={saving ? 'Saving...' : 'Next'}
              disabled={!jobTitle.trim() || !industry || saving}
              loading={saving}
            />
          </View>
        </Pressable>
      </OnboardingLayout>
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
  errorContainer: {
    backgroundColor: Colors.errorLighter,
    borderColor: Colors.errorLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: Colors.error,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
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
  inputContainer: {
    position: 'relative',
    zIndex: 1000,
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
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginTop: scaleHeight(6),
  },
  suggestionsContainer: {
    position: 'absolute',
    top: scaleHeight(52),
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: scaleHeight(240),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  suggestionItem: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundGrayLighter,
  },
  suggestionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  selectButton: {
    backgroundColor: Colors.backgroundGrayLight,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  selectButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.gray['400'],
  },
  selectButtonArrow: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginLeft: scaleWidth(8),
  },
  dropdownWrapper: {
    position: 'relative',
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: scaleHeight(8),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: scaleHeight(200),
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  optionsScrollView: {
    maxHeight: scaleHeight(200),
  },
  optionItem: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundGrayLighter,
  },
  optionItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  optionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});