import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PersonalizationDiningStyleScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

interface DiningPreference {
  id: string;
  question: string;
  options: {
    id: string;
    label: string;
    description?: string;
    icon?: string;
  }[];
  multiSelect?: boolean;
}

const diningPreferences: DiningPreference[] = [
  {
    id: 'budget',
    question: 'What\'s your typical dining budget per person?',
    options: [
      { id: 'budget_low', label: '$', description: 'Under $15', icon: 'cash-outline' },
      { id: 'budget_medium', label: '$$', description: '$15-30', icon: 'cash' },
      { id: 'budget_high', label: '$$$', description: '$30-60', icon: 'wallet' },
      { id: 'budget_premium', label: '$$$$', description: '$60+', icon: 'diamond' },
    ],
    multiSelect: true,
  },
  {
    id: 'occasion',
    question: 'When do you prefer dining out?',
    options: [
      { id: 'weekday_lunch', label: 'Weekday Lunch', icon: 'sunny' },
      { id: 'weekday_dinner', label: 'Weekday Dinner', icon: 'moon-outline' },
      { id: 'weekend_brunch', label: 'Weekend Brunch', icon: 'cafe' },
      { id: 'weekend_dinner', label: 'Weekend Dinner', icon: 'restaurant' },
      { id: 'late_night', label: 'Late Night', icon: 'moon' },
    ],
    multiSelect: true,
  },
  {
    id: 'atmosphere',
    question: 'What dining atmosphere do you enjoy?',
    options: [
      { id: 'casual', label: 'Casual & Relaxed', icon: 'happy-outline' },
      { id: 'trendy', label: 'Trendy & Hip', icon: 'sparkles' },
      { id: 'romantic', label: 'Romantic & Intimate', icon: 'heart' },
      { id: 'lively', label: 'Lively & Social', icon: 'people' },
      { id: 'fine_dining', label: 'Fine Dining', icon: 'wine' },
      { id: 'family_friendly', label: 'Family Friendly', icon: 'home' },
    ],
    multiSelect: true,
  },
  {
    id: 'group_size',
    question: 'What\'s your ideal dining group size?',
    options: [
      { id: 'solo', label: 'Solo', description: 'Just me', icon: 'person' },
      { id: 'couple', label: 'Couple', description: '2 people', icon: 'heart-outline' },
      { id: 'small_group', label: 'Small Group', description: '3-4 people', icon: 'people-outline' },
      { id: 'large_group', label: 'Large Group', description: '5-8 people', icon: 'people' },
      { id: 'party', label: 'Party', description: '9+ people', icon: 'beer' },
    ],
    multiSelect: true,
  },
];

export const PersonalizationDiningStyleScreen: React.FC<PersonalizationDiningStyleScreenProps> = ({
  onNavigate,
  currentStep = 6,
  totalSteps = 8,
}) => {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const toggleOption = (questionId: string, optionId: string, multiSelect?: boolean) => {
    const currentSelections = selections[questionId] || [];
    
    if (multiSelect) {
      if (currentSelections.includes(optionId)) {
        setSelections({
          ...selections,
          [questionId]: currentSelections.filter(id => id !== optionId),
        });
      } else {
        setSelections({
          ...selections,
          [questionId]: [...currentSelections, optionId],
        });
      }
    } else {
      setSelections({
        ...selections,
        [questionId]: [optionId],
      });
    }
  };

  const isOptionSelected = (questionId: string, optionId: string) => {
    return (selections[questionId] || []).includes(optionId);
  };

  const handleNext = () => {
    const data = { dining_style_preferences: selections };
    onNavigate?.('personalization-social', data);
  };

  const handleBack = () => {
    onNavigate?.('personalization-cuisine');
  };

  const allQuestionsAnswered = diningPreferences.every(
    pref => (selections[pref.id] || []).length > 0
  );

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>Dining Style</OnboardingTitle>
        <Text style={styles.subtitle}>
          Help us understand your dining preferences to find the perfect matches.
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {diningPreferences.map((preference, _index) => (
            <View key={preference.id} style={styles.questionContainer}>
              <Text style={styles.questionText}>{preference.question}</Text>
              
              <View style={styles.optionsContainer}>
                {preference.options.map((option) => {
                  const isSelected = isOptionSelected(preference.id, option.id);
                  
                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        preference.options.length <= 4 && styles.optionCardWide,
                      ]}
                      onPress={() => toggleOption(preference.id, option.id, preference.multiSelect)}
                    >
                      {option.icon && (
                        <Ionicons 
                          name={option.icon as any} 
                          size={20} 
                          color={isSelected ? theme.colors.primary.main : '#9CA3AF'} 
                        />
                      )}
                      <View style={styles.optionContent}>
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected
                        ]}>
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text style={[
                            styles.optionDescription,
                            isSelected && styles.optionDescriptionSelected
                          ]}>
                            {option.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              
              {preference.multiSelect && (
                <Text style={styles.multiSelectHint}>
                  Select all that apply
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Continue"
            disabled={!allQuestionsAnswered}
          />
          {!allQuestionsAnswered && (
            <Text style={styles.helperText}>
              Please answer all questions to continue
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
  questionContainer: {
    marginBottom: scaleHeight(28),
  },
  questionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(15),
    marginBottom: scaleHeight(12),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  optionCard: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    minWidth: scaleWidth(100),
    position: 'relative',
  },
  optionCardWide: {
    width: '47%',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.08)',
    borderColor: theme.colors.primary.main,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  optionLabelSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  optionDescription: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    marginTop: scaleHeight(2),
  },
  optionDescriptionSelected: {
    color: theme.colors.text.secondary,
  },
  checkCircle: {
    position: 'absolute',
    top: scaleHeight(6),
    right: scaleWidth(6),
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderRadius: scaleWidth(9),
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiSelectHint: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    marginTop: scaleHeight(6),
    fontStyle: 'italic',
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