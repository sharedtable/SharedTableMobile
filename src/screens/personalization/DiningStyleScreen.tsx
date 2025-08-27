import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { OnboardingLayout, OnboardingTitle, OnboardingButton, OnboardingInput } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePersonalizationFlow } from '@/hooks/usePersonalizationFlow';

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

export const DiningStyleScreen: React.FC<PersonalizationDiningStyleScreenProps> = ({
  onNavigate,
  currentStep = 3,  // Third personalization step
  totalSteps = 6,   // Total personalization steps
}) => {
  const navigation = useNavigation();
  const { saveStepData } = usePersonalizationFlow();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [zipCode, setZipCode] = useState<string>('');
  const [travelDistance, setTravelDistance] = useState<number>(15);
  const [_saving, setSaving] = useState(false);

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

  const handleNext = async () => {
    const data = { 
      dining_style_preferences: selections,
      zipCode,
      travelDistance,
    };
    
    setSaving(true);
    try {
      const success = await saveStepData('dining-style', data);
      
      if (success) {
        // Use React Navigation if available, otherwise fall back to onNavigate prop
        if (navigation && (navigation as any).navigate) {
          (navigation as any).navigate('PersonalizationSocial', data);
        } else if (onNavigate) {
          onNavigate('personalization-social', data);
        }
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving dining style preferences:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    // Use React Navigation's goBack if available
    if (navigation && (navigation as any).goBack) {
      (navigation as any).goBack();
    } else if (onNavigate) {
      onNavigate('personalization-cuisine');
    }
  };

  const allQuestionsAnswered = diningPreferences.every(
    pref => (selections[pref.id] || []).length > 0
  );
  
  const isValidZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip.trim());
  };

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

          {/* Location Section */}
          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>Your Location</Text>
            <Text style={styles.locationSubtitle}>
              Help us find great dining spots near you.
            </Text>
            
            {/* Zip Code Input */}
            <OnboardingInput
              label="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="12345"
              keyboardType="numeric"
              required
              error={zipCode && !isValidZipCode(zipCode) ? 'Please enter a valid zip code' : undefined}
            />
            
            {/* Distance Slider */}
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceLabel}>
                Distance willing to travel for dining: {travelDistance} miles
              </Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={50}
                    value={travelDistance}
                    onValueChange={(value) => setTravelDistance(Math.round(value))}
                    minimumTrackTintColor={theme.colors.primary.main}
                    maximumTrackTintColor="rgba(226, 72, 73, 0.1)"
                    thumbTintColor={theme.colors.primary.main}
                  />
                  <View
                    style={[
                      styles.valueOnBottom,
                      { left: `${((travelDistance - 1) / 49) * 100}%` },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.valueText}>{travelDistance}</Text>
                  </View>
                </View>
                <View style={styles.distanceLabels}>
                  <Text style={styles.distanceMinLabel}>1 mile</Text>
                  <Text style={styles.distanceMaxLabel}>50 miles</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Continue"
            disabled={!allQuestionsAnswered || !zipCode || !isValidZipCode(zipCode)}
          />
          {(!allQuestionsAnswered || !zipCode || !isValidZipCode(zipCode)) && (
            <Text style={styles.helperText}>
              {!allQuestionsAnswered ? 'Please answer all dining preference questions' : 
               !zipCode ? 'Please enter your zip code' :
               !isValidZipCode(zipCode) ? 'Please enter a valid zip code' : ''}
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
  locationSection: {
    marginTop: scaleHeight(32),
    paddingTop: scaleHeight(24),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  locationTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(18),
    marginBottom: scaleHeight(8),
  },
  locationSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(20),
  },
  distanceContainer: {
    marginTop: scaleHeight(8),
  },
  distanceLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600',
    marginBottom: scaleHeight(12),
  },
  sliderContainer: {
    paddingHorizontal: scaleWidth(8),
  },
  sliderWrapper: {
    position: 'relative',
  },
  slider: {
    height: scaleHeight(30),
    width: '100%',
  },
  valueOnBottom: {
    alignItems: 'center',
    bottom: scaleHeight(-25),
    marginLeft: -scaleWidth(10),
    position: 'absolute',
    width: scaleWidth(20),
  },
  valueText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(20),
  },
  distanceMinLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  distanceMaxLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
});