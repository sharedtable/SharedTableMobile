import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingPersonalityScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

interface PersonalityTraits {
  leadConversations: number;
  willingCompromise: number;
  seekExperiences: number;
}

const mbtiTypes = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const roleOptions = [
  'Connector',
  'Storyteller',
  'Question-asker',
  'Quiet observer',
  'Comic relief',
  'Host',
];

const personalityQuestions = [
  {
    key: 'leadConversations' as keyof PersonalityTraits,
    question: 'I often take the lead in starting conversations',
    leftLabel: 'Not at all',
    rightLabel: 'Always',
  },
  {
    key: 'willingCompromise' as keyof PersonalityTraits,
    question: "I'm willing to compromise to keep the peace",
    leftLabel: 'Not at all',
    rightLabel: 'Always',
  },
  {
    key: 'seekExperiences' as keyof PersonalityTraits,
    question: 'I actively seek out new experiences, even if they push me outside my comfort zone',
    leftLabel: 'Not at all',
    rightLabel: 'Always',
  },
];

export const OnboardingPersonalityScreen: React.FC<OnboardingPersonalityScreenProps> = ({
  onNavigate,
  currentStep = 7,
  totalSteps = 11,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedMbti, setSelectedMbti] = useState<string>(
    currentStepData.mbtiType || ''
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    currentStepData.roles || []
  );
  const [showMbtiDropdown, setShowMbtiDropdown] = useState(false);
  const [traits, setTraits] = useState<PersonalityTraits>(() => {
    // Check if personalityTraits is an array (from database) and convert back to object
    if (Array.isArray(currentStepData.personalityTraits)) {
      const traitsFromArray: Partial<PersonalityTraits> = {};
      currentStepData.personalityTraits.forEach((trait: string) => {
        const [key, value] = trait.split(': ');
        if (key && value) {
          traitsFromArray[key as keyof PersonalityTraits] = parseInt(value, 10);
        }
      });
      return {
        leadConversations: 5,
        willingCompromise: 5,
        seekExperiences: 5,
        ...traitsFromArray,
      };
    }

    return {
      leadConversations: currentStepData.leadConversations || 5,
      willingCompromise: currentStepData.willingCompromise || 5,
      seekExperiences: currentStepData.seekExperiences || 5,
    };
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const handleTraitChange = (key: keyof PersonalityTraits, value: number) => {
    setTraits(prev => ({ ...prev, [key]: Math.round(value) }));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      }
      if (prev.length >= 3) {
        Alert.alert('Maximum Selection', 'You can select up to 3 roles');
        return prev;
      }
      return [...prev, role];
    });
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      // Validation
      if (selectedRoles.length === 0) {
        setLocalErrors({ roles: 'Please select at least one role' });
        return;
      }

      // Send traits as individual fields for proper database storage
      const personalityData = {
        leadConversations: traits.leadConversations,
        willingCompromise: traits.willingCompromise,
        seekExperiences: traits.seekExperiences,
        mbtiType: selectedMbti || null,
        roles: selectedRoles,
      };

      const validation = validateOnboardingStep('personality', personalityData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('personality', personalityData);

      if (success) {
        console.log('✅ [OnboardingPersonalityScreen] Personality saved successfully');
        onNavigate?.('onboarding-lifestyle', personalityData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingPersonalityScreen] Error saving personality:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-background');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
    >
      <View style={styles.container}>
        <OnboardingTitle>Your Personality & Passions</OnboardingTitle>
        
        <Text style={styles.subtitle}>
          Tell us how you connect with others, what drives you, and how you spend your time.
        </Text>

        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Personality Sliders */}
        <View style={styles.section}>
          {personalityQuestions.map((q) => (
            <View key={q.key} style={styles.sliderContainer}>
              <Text style={styles.question}>{q.question}</Text>
              
              <View style={styles.sliderWrapper}>
                <Slider
                  style={styles.slider}
                  value={traits[q.key]}
                  onValueChange={(value) => handleTraitChange(q.key, value)}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  minimumTrackTintColor={theme.colors.primary.main}
                  maximumTrackTintColor={Colors.borderLight}
                  thumbTintColor={theme.colors.primary.main}
                />
                
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>{q.leftLabel}</Text>
                  <Text style={styles.sliderValue}>{traits[q.key]}</Text>
                  <Text style={styles.sliderLabel}>{q.rightLabel}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Role Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which role(s) best describes you?</Text>
          <Text style={styles.sectionSubtitle}>Multi-select allowed</Text>
          
          <View style={styles.rolesGrid}>
            {roleOptions.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  selectedRoles.includes(role) && styles.roleButtonSelected
                ]}
                onPress={() => toggleRole(role)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.roleButtonText,
                  selectedRoles.includes(role) && styles.roleButtonTextSelected
                ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* MBTI Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is your MBTI personality type?</Text>
          <Text style={styles.sectionSubtitle}>Leave empty if unsure</Text>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowMbtiDropdown(!showMbtiDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.selectButtonText,
              !selectedMbti && styles.placeholderText
            ]}>
              {selectedMbti || 'Select MBTI type (optional)'}
            </Text>
            <Text style={styles.selectButtonArrow}>
              {showMbtiDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showMbtiDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
                bounces={false}
              >
                {mbtiTypes.map((type, index) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      selectedMbti === type && styles.dropdownItemSelected,
                      index === mbtiTypes.length - 1 && styles.dropdownItemLast
                    ]}
                    onPress={() => {
                      setSelectedMbti(type);
                      setShowMbtiDropdown(false);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedMbti === type && styles.dropdownItemTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={selectedRoles.length === 0 || saving}
            loading={saving}
          />
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
    marginTop: scaleHeight(8),
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
  section: {
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(12),
  },
  sliderContainer: {
    marginBottom: scaleHeight(20),
  },
  question: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
    lineHeight: scaleFont(20),
  },
  sliderWrapper: {
    paddingHorizontal: scaleWidth(8),
  },
  slider: {
    width: '100%',
    height: scaleHeight(40),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(-8),
  },
  sliderLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  sliderValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  roleButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  roleButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  roleButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  roleButtonTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: Colors.backgroundGrayLight,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
  },
  selectButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
  },
  selectButtonArrow: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginLeft: scaleWidth(8),
  },
  dropdown: {
    marginTop: scaleHeight(8),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: scaleHeight(200),
    overflow: 'hidden',
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
  dropdownItem: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.backgroundGrayLighter,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});