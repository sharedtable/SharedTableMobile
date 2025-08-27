import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  OnboardingLayout,
  OnboardingTitle,
  SelectionCard,
  OnboardingButton,
} from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingEthnicityScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const ethnicityOptions = [
  'White / Caucasian',
  'African American',
  'East Asian',
  'South Asian',
  'Hispanic / LatinX',
  'Asian Pacific Islander',
  'Native American',
  'Other',
];

const commonCountries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Japan',
  'South Korea',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'Argentina',
  'Other',
];

const religionOptions = [
  'Christianity',
  'Islam',
  'Judaism',
  'Hinduism',
  'Buddhism',
  'Atheist/Agnostic',
  'Other',
  'Prefer not to say',
];

export const OnboardingEthnicityScreen: React.FC<OnboardingEthnicityScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(
    currentStepData.ethnicity || null
  );
  const [selectedNationality, setSelectedNationality] = useState<string | null>(
    currentStepData.nationality || null
  );
  const [selectedReligion, setSelectedReligion] = useState<string | null>(
    currentStepData.religion || null
  );
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear errors when component mounts
    clearErrors();
  }, [clearErrors]);

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const ethnicityData = { 
        ethnicity: selectedEthnicity,
        nationality: selectedNationality,
        religion: selectedReligion,
      };

      // Validate locally first
      const validation = validateOnboardingStep('ethnicity', ethnicityData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      // Save to database
      const success = await saveStep('ethnicity', ethnicityData);

      if (success) {
        console.log('✅ [OnboardingEthnicityScreen] Ethnicity saved successfully');
        onNavigate?.('onboarding-relationship', ethnicityData);
      } else {
        // Handle step errors from context
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your ethnicity. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingEthnicityScreen] Error saving ethnicity:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-work');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage =
    localErrors.ethnicity || stepErrors.ethnicity || localErrors.general || stepErrors.general;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>{'About Your Background'}</OnboardingTitle>
        <Text style={styles.subtitle}>
          Help us understand your cultural background to connect you with like-minded people.
        </Text>

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ethnicity Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ethnicity</Text>
            <View style={styles.optionsContainer}>
              {ethnicityOptions.map((option) => (
                <SelectionCard
                  key={option}
                  label={option}
                  selected={selectedEthnicity === option}
                  onPress={() => {
                    setSelectedEthnicity(option);
                    if (localErrors.ethnicity || stepErrors.ethnicity) {
                      setLocalErrors((prev) => ({ ...prev, ethnicity: '' }));
                      clearErrors();
                    }
                  }}
                  compact
                />
              ))}
            </View>
          </View>

          {/* Nationality Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Nationality</Text>
            <Pressable
              style={[
                styles.dropdownButton,
                selectedNationality && styles.dropdownButtonSelected,
                showNationalityDropdown && styles.dropdownButtonActive,
              ]}
              onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
            >
              <Text style={[
                styles.dropdownButtonText,
                selectedNationality && styles.dropdownButtonTextSelected,
              ]}>
                {selectedNationality || 'Select your nationality'}
              </Text>
              <Ionicons 
                name={showNationalityDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={selectedNationality ? theme.colors.primary.main : '#9CA3AF'} 
              />
            </Pressable>
            
            {showNationalityDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {commonCountries.map((country) => (
                    <Pressable
                      key={country}
                      style={[
                        styles.dropdownOption,
                        selectedNationality === country && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedNationality(country);
                        setShowNationalityDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        selectedNationality === country && styles.dropdownOptionTextSelected,
                      ]}>
                        {country}
                      </Text>
                      {selectedNationality === country && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.primary.main} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Religion Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Religion <Text style={styles.optional}>(Optional)</Text></Text>
            <Pressable
              style={[
                styles.dropdownButton,
                selectedReligion && styles.dropdownButtonSelected,
                showReligionDropdown && styles.dropdownButtonActive,
              ]}
              onPress={() => setShowReligionDropdown(!showReligionDropdown)}
            >
              <Text style={[
                styles.dropdownButtonText,
                selectedReligion && styles.dropdownButtonTextSelected,
              ]}>
                {selectedReligion || 'Select your religion (optional)'}
              </Text>
              <Ionicons 
                name={showReligionDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={selectedReligion ? theme.colors.primary.main : '#9CA3AF'} 
              />
            </Pressable>
            
            {showReligionDropdown && (
              <View style={styles.dropdown}>
                {religionOptions.map((religion) => (
                  <Pressable
                    key={religion}
                    style={[
                      styles.dropdownOption,
                      selectedReligion === religion && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedReligion(religion);
                      setShowReligionDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      selectedReligion === religion && styles.dropdownOptionTextSelected,
                    ]}>
                      {religion}
                    </Text>
                    {selectedReligion === religion && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary.main} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={!selectedEthnicity || !selectedNationality || saving}
            loading={saving}
          />
          {(!selectedEthnicity || !selectedNationality) && (
            <Text style={styles.helperText}>
              Please select your ethnicity and nationality to continue
            </Text>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(20),
  },
  sectionContainer: {
    marginBottom: scaleHeight(28),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(12),
  },
  optional: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    padding: scaleWidth(12),
  },
  errorText: {
    color: '#DC2626',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionsContainer: {
    gap: scaleHeight(12),
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.08)',
    borderColor: theme.colors.primary.main,
  },
  dropdownButtonActive: {
    borderColor: theme.colors.primary.main,
  },
  dropdownButtonText: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    marginTop: scaleHeight(8),
    maxHeight: scaleHeight(200),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: scaleHeight(200),
  },
  dropdownOption: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.08)',
  },
  dropdownOptionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(40),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    textAlign: 'center',
    marginTop: scaleHeight(8),
  },
});
