import React, { useState, useEffect } from 'react';
import { 
  View, 
  Alert, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingWorkScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const workOptions = [
  { id: 'tech', label: 'Technology', icon: 'laptop-outline' },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical-outline' },
  { id: 'finance', label: 'Finance', icon: 'cash-outline' },
  { id: 'education', label: 'Education', icon: 'school-outline' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone-outline' },
  { id: 'creative', label: 'Creative/Arts', icon: 'color-palette-outline' },
  { id: 'hospitality', label: 'Hospitality', icon: 'restaurant-outline' },
  { id: 'legal', label: 'Legal', icon: 'briefcase-outline' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', icon: 'rocket-outline' },
  { id: 'consulting', label: 'Consulting', icon: 'people-outline' },
  { id: 'nonprofit', label: 'Non-profit', icon: 'heart-outline' },
  { id: 'government', label: 'Government', icon: 'business-outline' },
  { id: 'retail', label: 'Retail', icon: 'cart-outline' },
  { id: 'real_estate', label: 'Real Estate', icon: 'home-outline' },
  { id: 'student', label: 'Student', icon: 'book-outline' },
  { id: 'retired', label: 'Retired', icon: 'happy-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const educationLevels = [
  { id: 'high_school', label: 'High School', icon: 'school-outline' },
  { id: 'some_college', label: 'Some College', icon: 'book-outline' },
  { id: 'associate', label: "Associate's Degree", icon: 'document-outline' },
  { id: 'bachelor', label: "Bachelor's Degree", icon: 'school' },
  { id: 'master', label: "Master's Degree", icon: 'ribbon-outline' },
  { id: 'doctorate', label: 'Doctorate/PhD', icon: 'medal-outline' },
  { id: 'professional', label: 'Professional Degree (MD, JD, etc.)', icon: 'medical-outline' },
  { id: 'trade', label: 'Trade/Vocational', icon: 'construct-outline' },
];

export const OnboardingWorkScreen: React.FC<OnboardingWorkScreenProps> = ({
  onNavigate,
  currentStep = 5,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const stepData = currentStepData as Record<string, unknown>;
  const [selectedWork, setSelectedWork] = useState<string | null>(
    (stepData?.lineOfWork as string) || null
  );
  const [selectedEducation, setSelectedEducation] = useState<string | null>(
    (stepData?.educationLevel as string) || null
  );
  const [jobTitle, setJobTitle] = useState<string>(
    (stepData?.jobTitle as string) || ''
  );
  const [school, setSchool] = useState<string>(
    (stepData?.school as string) || ''
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState<'work' | 'education' | 'details'>('work');

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Validate based on current section
      if (currentSection === 'work' && !selectedWork) {
        setLocalErrors({ lineOfWork: 'Please select your line of work' });
        return;
      }

      if (currentSection === 'education' && !selectedEducation) {
        setLocalErrors({ educationLevel: 'Please select your education level' });
        return;
      }

      if (currentSection === 'details') {
        // Job title is optional for students and retired
        const requiresJobTitle = selectedWork !== 'student' && selectedWork !== 'retired';
        if (requiresJobTitle && !jobTitle.trim()) {
          setLocalErrors({ jobTitle: 'Please enter your job title' });
          return;
        }

        // School is optional but recommended
        if (school.trim() && school.trim().length < 2) {
          setLocalErrors({ school: 'School name is too short' });
          return;
        }

        // Save all data
        const workData = { 
          lineOfWork: selectedWork,
          educationLevel: selectedEducation,
          jobTitle: jobTitle.trim(),
          school: school.trim()
        };

        const validation = validateOnboardingStep('work', workData);
        if (!validation.success) {
          setLocalErrors(validation.errors || {});
          return;
        }

        const success = await saveStep('work', workData);

        if (success) {
          console.log('✅ [OnboardingWorkScreen] Work & Education data saved successfully');
          onNavigate?.('onboarding-ethnicity', workData);
        } else {
          if (Object.keys(stepErrors).length > 0) {
            setLocalErrors(stepErrors);
          } else {
            Alert.alert('Error', 'Failed to save your information. Please try again.');
          }
        }
        return;
      }

      // Move to next section
      if (currentSection === 'work') {
        setCurrentSection('education');
      } else if (currentSection === 'education') {
        setCurrentSection('details');
      }
    } catch (error) {
      console.error('❌ [OnboardingWorkScreen] Error saving work:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentSection === 'education') {
      setCurrentSection('work');
    } else if (currentSection === 'details') {
      setCurrentSection('education');
    } else {
      onNavigate?.('onboarding-dependents');
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'work':
        return 'What line of work are you in?';
      case 'education':
        return 'What\'s your education level?';
      case 'details':
        return 'Tell us a bit more';
    }
  };

  const getButtonLabel = () => {
    if (saving) return 'Saving...';
    if (currentSection === 'details') return 'Next';
    return 'Continue';
  };

  const isButtonDisabled = () => {
    if (saving) return true;
    if (currentSection === 'work') return !selectedWork;
    if (currentSection === 'education') return !selectedEducation;
    if (currentSection === 'details') {
      const requiresJobTitle = selectedWork !== 'student' && selectedWork !== 'retired';
      return requiresJobTitle && !jobTitle.trim();
    }
    return false;
  };

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
      >
        <View style={styles.container}>
          <OnboardingTitle>{getSectionTitle()}</OnboardingTitle>

          {(Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {localErrors[Object.keys(localErrors)[0]] ||
                  stepErrors[Object.keys(stepErrors)[0]]}
              </Text>
            </View>
          )}

          {currentSection === 'work' && (
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.optionsGrid}>
                {workOptions.map((option) => (
                  <SelectionCard
                    key={option.id}
                    label={option.label}
                    icon={
                      <Ionicons 
                        name={option.icon as any} 
                        size={24} 
                        color={selectedWork === option.id ? '#FFFFFF' : theme.colors.text.primary}
                      />
                    }
                    selected={selectedWork === option.id}
                    onPress={() => {
                      setSelectedWork(option.id);
                      if (localErrors.lineOfWork || stepErrors.lineOfWork) {
                        setLocalErrors((prev) => ({ ...prev, lineOfWork: '' }));
                        clearErrors();
                      }
                    }}
                    compact
                  />
                ))}
              </View>
            </ScrollView>
          )}

          {currentSection === 'education' && (
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.optionsContainer}>
                {educationLevels.map((level) => (
                  <SelectionCard
                    key={level.id}
                    label={level.label}
                    icon={
                      <Ionicons 
                        name={level.icon as any} 
                        size={24} 
                        color={selectedEducation === level.id ? '#FFFFFF' : theme.colors.text.primary}
                      />
                    }
                    selected={selectedEducation === level.id}
                    onPress={() => {
                      setSelectedEducation(level.id);
                      if (localErrors.educationLevel || stepErrors.educationLevel) {
                        setLocalErrors((prev) => ({ ...prev, educationLevel: '' }));
                        clearErrors();
                      }
                    }}
                    fullWidth
                  />
                ))}
              </View>
            </ScrollView>
          )}

          {currentSection === 'details' && (
            <View style={styles.detailsContainer}>
              {selectedWork !== 'student' && selectedWork !== 'retired' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Job Title *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      (localErrors.jobTitle || stepErrors.jobTitle) && styles.inputError
                    ]}
                    placeholder="e.g., Software Engineer, Marketing Manager"
                    placeholderTextColor="#9CA3AF"
                    value={jobTitle}
                    onChangeText={(text) => {
                      setJobTitle(text);
                      if (localErrors.jobTitle) {
                        setLocalErrors((prev) => ({ ...prev, jobTitle: '' }));
                      }
                    }}
                    maxLength={50}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Text style={styles.helperText}>
                    {jobTitle.length}/50 characters
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  School/University {selectedWork === 'student' ? '*' : '(Optional)'}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    (localErrors.school || stepErrors.school) && styles.inputError
                  ]}
                  placeholder="e.g., Stanford University, Harvard Business School"
                  placeholderTextColor="#9CA3AF"
                  value={school}
                  onChangeText={(text) => {
                    setSchool(text);
                    if (localErrors.school) {
                      setLocalErrors((prev) => ({ ...prev, school: '' }));
                    }
                  }}
                  maxLength={100}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
                <Text style={styles.helperText}>
                  {school.length}/100 characters
                </Text>
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Your Professional Profile:</Text>
                <View style={styles.summaryItem}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary.main} />
                  <Text style={styles.summaryText}>
                    {workOptions.find(w => w.id === selectedWork)?.label || 'Not selected'}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="school-outline" size={20} color={theme.colors.primary.main} />
                  <Text style={styles.summaryText}>
                    {educationLevels.find(e => e.id === selectedEducation)?.label || 'Not selected'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.spacer} />

          <View style={styles.bottomContainer}>
            <OnboardingButton
              onPress={handleNext}
              label={getButtonLabel()}
              disabled={isButtonDisabled()}
              loading={saving}
            />
          </View>
        </View>
      </OnboardingLayout>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: theme.colors.error[100],
    borderColor: theme.colors.error[300],
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: theme.colors.error.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionsContainer: {
    gap: scaleHeight(12),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleHeight(12),
    justifyContent: 'space-between',
  },
  detailsContainer: {
    gap: scaleHeight(24),
  },
  inputGroup: {
    gap: scaleHeight(8),
  },
  inputLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: scaleFont(16),
  },
  textInput: {
    backgroundColor: theme.colors.background.default,
    borderColor: theme.colors.neutral.gray[200],
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
  },
  inputError: {
    borderColor: theme.colors.error[300],
  },
  helperText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  summaryContainer: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    gap: scaleHeight(12),
  },
  summaryTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(8),
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  summaryText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    flex: 1,
  },
  spacer: {
    height: scaleHeight(40),
  },
  flexOne: {
    flex: 1,
  },
});