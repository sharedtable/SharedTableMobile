import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
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

// Organized in a 4x4 grid for easy selection
const mbtiGrid = [
  ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
];

// MBTI type descriptions
const mbtiDescriptions: Record<string, { title: string; traits: string[] }> = {
  'INTJ': {
    title: 'The Architect',
    traits: ['Strategic thinker', 'Independent', 'Decisive', 'Innovative problem-solver']
  },
  'INTP': {
    title: 'The Thinker',
    traits: ['Analytical', 'Objective', 'Abstract thinker', 'Reserved but precise']
  },
  'ENTJ': {
    title: 'The Commander',
    traits: ['Natural leader', 'Bold', 'Strategic', 'Efficient organizer']
  },
  'ENTP': {
    title: 'The Debater',
    traits: ['Quick thinker', 'Charismatic', 'Energetic', 'Enjoys intellectual challenges']
  },
  'INFJ': {
    title: 'The Advocate',
    traits: ['Insightful', 'Principled', 'Passionate', 'Altruistic']
  },
  'INFP': {
    title: 'The Mediator',
    traits: ['Idealistic', 'Empathetic', 'Creative', 'Open-minded']
  },
  'ENFJ': {
    title: 'The Protagonist',
    traits: ['Charismatic leader', 'Inspiring', 'Confident', 'Altruistic']
  },
  'ENFP': {
    title: 'The Campaigner',
    traits: ['Enthusiastic', 'Creative', 'Sociable', 'Free spirit']
  },
  'ISTJ': {
    title: 'The Inspector',
    traits: ['Practical', 'Fact-oriented', 'Reliable', 'Duty-focused']
  },
  'ISFJ': {
    title: 'The Protector',
    traits: ['Supportive', 'Reliable', 'Patient', 'Observant']
  },
  'ESTJ': {
    title: 'The Executive',
    traits: ['Organized', 'Practical', 'Strong-willed', 'Direct']
  },
  'ESFJ': {
    title: 'The Consul',
    traits: ['Caring', 'Social', 'Supportive', 'Practical helper']
  },
  'ISTP': {
    title: 'The Virtuoso',
    traits: ['Practical', 'Observant', 'Hands-on problem solver', 'Flexible']
  },
  'ISFP': {
    title: 'The Adventurer',
    traits: ['Artistic', 'Curious', 'Flexible', 'Charming']
  },
  'ESTP': {
    title: 'The Entrepreneur',
    traits: ['Energetic', 'Perceptive', 'Direct', 'Action-oriented']
  },
  'ESFP': {
    title: 'The Entertainer',
    traits: ['Spontaneous', 'Energetic', 'Enthusiastic', 'Fun-loving']
  },
};

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
        leadConversations: 3,
        willingCompromise: 3,
        seekExperiences: 3,
        ...traitsFromArray,
      };
    }

    return {
      leadConversations: currentStepData.leadConversations || 3,
      willingCompromise: currentStepData.willingCompromise || 3,
      seekExperiences: currentStepData.seekExperiences || 3,
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
        // Don't show alert, just prevent selection
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

      // Convert traits to the expected array format for validation
      const personalityTraits = [
        `leadConversations: ${traits.leadConversations}`,
        `willingCompromise: ${traits.willingCompromise}`,
        `seekExperiences: ${traits.seekExperiences}`,
      ];

      const personalityData = {
        personalityTraits, // This is what the validation expects
        // Also include individual fields for backward compatibility with database
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
        <OnboardingTitle>Your Personality</OnboardingTitle>

        <View style={{ marginBottom: scaleHeight(20) }} />

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
          <Text style={styles.sectionTitle}>In a group setting, I'm typically the... *</Text>
          <Text style={styles.sectionSubtitle}>Select up to 3</Text>
          
          <View style={styles.rolesGrid}>
            {roleOptions.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  selectedRoles.includes(role) && styles.roleButtonSelected,
                  selectedRoles.length >= 3 && !selectedRoles.includes(role) && styles.roleButtonDisabled
                ]}
                onPress={() => toggleRole(role)}
                activeOpacity={0.7}
                disabled={selectedRoles.length >= 3 && !selectedRoles.includes(role)}
              >
                <Text style={[
                  styles.roleButtonText,
                  selectedRoles.includes(role) && styles.roleButtonTextSelected,
                  selectedRoles.length >= 3 && !selectedRoles.includes(role) && styles.roleButtonTextDisabled
                ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* MBTI Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is your MBTI personality type? (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Tap to select/unselect. Leave empty if unsure</Text>
          
          <View style={styles.mbtiGrid}>
            {mbtiGrid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.mbtiRow}>
                {row.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mbtiButton,
                      selectedMbti === type && styles.mbtiButtonSelected
                    ]}
                    onPress={() => setSelectedMbti(selectedMbti === type ? '' : type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.mbtiButtonText,
                      selectedMbti === type && styles.mbtiButtonTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          
          {selectedMbti && mbtiDescriptions[selectedMbti] && (
            <View style={styles.mbtiExplanation}>
              <Text style={styles.mbtiExplanationTitle}>
                {selectedMbti} - {mbtiDescriptions[selectedMbti].title}
              </Text>
              <View style={styles.mbtiTraits}>
                {mbtiDescriptions[selectedMbti].traits.map((trait, index) => (
                  <Text key={index} style={styles.mbtiTrait}>
                    • {trait}
                  </Text>
                ))}
              </View>
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
    gap: scaleWidth(8),
  },
  roleButton: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(9),
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
    fontSize: scaleFont(13),
  },
  roleButtonTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  roleButtonDisabled: {
    opacity: 0.4,
    borderColor: Colors.backgroundGrayLighter,
  },
  roleButtonTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  mbtiGrid: {
    backgroundColor: Colors.backgroundGrayLighter,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    gap: scaleHeight(8),
  },
  mbtiRow: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  mbtiButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  mbtiButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  mbtiButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '500',
  },
  mbtiButtonTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  mbtiExplanation: {
    marginTop: scaleHeight(12),
    backgroundColor: Colors.primaryLight,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
  },
  mbtiExplanationTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
  },
  mbtiTraits: {
    gap: scaleHeight(4),
  },
  mbtiTrait: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(18),
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});