import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ScrollView
} from 'react-native';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingHobbiesScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

// Time period categories with activities
const timeCategories = [
  {
    id: 'weekday_morning',
    label: '☀️ Weekday Mornings',
    timeSlot: 'Before work/school',
    activities: [
      { id: 'gym', label: 'Hit the gym', emoji: '🏋️' },
      { id: 'run', label: 'Go for a run', emoji: '🏃' },
      { id: 'meditate', label: 'Meditate', emoji: '🧘' },
      { id: 'read_news', label: 'Read news', emoji: '📰' },
      { id: 'coffee_ritual', label: 'Coffee ritual', emoji: '☕' },
      { id: 'journal', label: 'Journal', emoji: '📝' },
      { id: 'sleep_in', label: 'Sleep in', emoji: '😴' },
      { id: 'meal_prep', label: 'Meal prep', emoji: '🥗' }
    ]
  },
  {
    id: 'weekday_evening',
    label: '🌆 Weekday Evenings',
    timeSlot: 'After work/school',
    activities: [
      { id: 'cook_dinner', label: 'Cook dinner', emoji: '👨‍🍳' },
      { id: 'netflix', label: 'Netflix & chill', emoji: '📺' },
      { id: 'gaming', label: 'Gaming session', emoji: '🎮' },
      { id: 'side_project', label: 'Side projects', emoji: '💻' },
      { id: 'gym_evening', label: 'Gym/workout', emoji: '💪' },
      { id: 'happy_hour', label: 'Happy hour', emoji: '🍺' },
      { id: 'online_course', label: 'Online learning', emoji: '🎓' },
      { id: 'reading', label: 'Reading', emoji: '📚' },
      { id: 'social_calls', label: 'Call friends/family', emoji: '📱' }
    ]
  },
  {
    id: 'weekend',
    label: '🌟 Weekends',
    timeSlot: 'Friday night - Sunday',
    activities: [
      { id: 'explore_restaurants', label: 'Try new restaurants', emoji: '🍽️' },
      { id: 'hiking', label: 'Hiking/nature', emoji: '🥾' },
      { id: 'brunch', label: 'Brunch with friends', emoji: '🥞' },
      { id: 'sports', label: 'Play sports', emoji: '⚽' },
      { id: 'party', label: 'Party/nightlife', emoji: '🎉' },
      { id: 'family_time', label: 'Family time', emoji: '👨‍👩‍👧‍👦' },
      { id: 'diy_projects', label: 'DIY projects', emoji: '🔨' },
      { id: 'volunteer', label: 'Volunteering', emoji: '🤝' },
      { id: 'road_trips', label: 'Road trips', emoji: '🚗' },
      { id: 'farmers_market', label: "Farmer's markets", emoji: '🥬' },
      { id: 'beach', label: 'Beach day', emoji: '🏖️' },
      { id: 'nothing', label: 'Absolutely nothing', emoji: '🛋️' }
    ]
  },
  {
    id: 'currently_into',
    label: '🔥 Currently Into',
    timeSlot: 'Recent obsessions',
    activities: [
      { id: 'new_hobby', label: 'Learning something new', emoji: '🆕' },
      { id: 'fitness_goal', label: 'Training for an event', emoji: '🎯' },
      { id: 'tv_series', label: 'Binging a series', emoji: '📺' },
      { id: 'home_improvement', label: 'Home improvement', emoji: '🏠' },
      { id: 'dating', label: 'Dating scene', emoji: '💝' },
      { id: 'investing', label: 'Investing/crypto', emoji: '📈' },
      { id: 'content_creation', label: 'Content creation', emoji: '📸' },
      { id: 'language', label: 'Learning a language', emoji: '🗣️' },
      { id: 'pet_care', label: 'New pet parent', emoji: '🐕' }
    ]
  },
  {
    id: 'ideal_vacation',
    label: '✈️ Ideal Time Off',
    timeSlot: 'Dream vacation style',
    activities: [
      { id: 'adventure', label: 'Adventure travel', emoji: '🏔️' },
      { id: 'beach_resort', label: 'Beach resort', emoji: '🏝️' },
      { id: 'city_explore', label: 'City exploration', emoji: '🏙️' },
      { id: 'staycation', label: 'Staycation', emoji: '🏡' },
      { id: 'cultural', label: 'Cultural immersion', emoji: '🎭' },
      { id: 'cruise', label: 'Cruise', emoji: '🚢' },
      { id: 'camping', label: 'Camping/RV', emoji: '⛺' },
      { id: 'spa', label: 'Spa retreat', emoji: '🧖' },
      { id: 'festival', label: 'Music festivals', emoji: '🎪' }
    ]
  }
];

// Frequency options for "How often" question
const socialFrequency = [
  { id: 'very_social', label: 'Very social - out most nights', emoji: '🎉' },
  { id: 'social', label: 'Social - 2-3 times a week', emoji: '🍻' },
  { id: 'balanced', label: 'Balanced - mix of social & solo', emoji: '⚖️' },
  { id: 'homebody', label: 'Homebody - prefer staying in', emoji: '🏠' },
  { id: 'selective', label: 'Selective - quality over quantity', emoji: '💎' }
];

interface SelectedActivity {
  timeCategory: string;
  activity: string;
}

export const OnboardingHobbiesScreen: React.FC<OnboardingHobbiesScreenProps> = ({
  onNavigate,
  currentStep = 11,
  totalSteps = 12,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
    // Load previous data if exists
    const data = currentStepData as any;
    if (data.timeActivities) {
      setSelectedActivities(data.timeActivities);
    }
    if (data.socialFrequency) {
      setSelectedFrequency(data.socialFrequency);
    }
  }, [clearErrors, currentStepData]);

  const toggleActivity = (categoryId: string, activityId: string) => {
    const activityKey = `${categoryId}-${activityId}`;
    const existingIndex = selectedActivities.findIndex(
      a => `${a.timeCategory}-${a.activity}` === activityKey
    );

    if (existingIndex >= 0) {
      // Remove activity
      setSelectedActivities(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add activity (max 15 total)
      if (selectedActivities.length >= 15) {
        Alert.alert('Maximum Reached', 'You can select up to 15 activities total');
        return;
      }
      setSelectedActivities(prev => [...prev, { timeCategory: categoryId, activity: activityId }]);
    }
  };

  const isActivitySelected = (categoryId: string, activityId: string) => {
    return selectedActivities.some(
      a => a.timeCategory === categoryId && a.activity === activityId
    );
  };

  const getCategorySelectionCount = (categoryId: string) => {
    return selectedActivities.filter(a => a.timeCategory === categoryId).length;
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (selectedActivities.length === 0) {
        setLocalErrors({ activities: 'Please select at least one activity' });
        return;
      }

      if (!selectedFrequency) {
        setLocalErrors({ frequency: 'Please select your social frequency' });
        return;
      }

      // Format activities for saving
      const formattedActivities = selectedActivities.map(sa => {
        const category = timeCategories.find(tc => tc.id === sa.timeCategory);
        const activity = category?.activities.find(a => a.id === sa.activity);
        return {
          period: category?.label || sa.timeCategory,
          activity: activity?.label || sa.activity
        };
      });

      const hobbiesText = formattedActivities
        .map(fa => `${fa.period}: ${fa.activity}`)
        .join('; ');

      const frequencyOption = socialFrequency.find(f => f.id === selectedFrequency);
      const finalText = `${hobbiesText}. Social style: ${frequencyOption?.label || selectedFrequency}`;

      const data = { 
        hobbies: finalText,
        timeActivities: selectedActivities,
        socialFrequency: selectedFrequency
      };

      const validation = validateOnboardingStep('finalTouch', data);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('finalTouch', data);

      if (success) {
        console.log('✅ [OnboardingHobbiesScreen] Saved successfully');
        onNavigate?.('onboarding-interesting-fact', data);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingHobbiesScreen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-hoping-to-meet');
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Final Touch! (2/3)</Text>
            <Text style={styles.subtitle}>How do you spend your free time?</Text>
            <Text style={styles.helperText}>Select activities that match your lifestyle</Text>
          </View>

          {hasError && errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Time Categories */}
          {timeCategories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const selectionCount = getCategorySelectionCount(category.id);
            
            return (
              <View key={category.id} style={styles.categorySection}>
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    isExpanded && styles.categoryHeaderExpanded,
                    selectionCount > 0 && styles.categoryHeaderWithSelection
                  ]}
                  onPress={() => setExpandedCategory(isExpanded ? null : category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryTimeSlot}>{category.timeSlot}</Text>
                  </View>
                  <View style={styles.categoryHeaderRight}>
                    {selectionCount > 0 && (
                      <View style={styles.selectionBadge}>
                        <Text style={styles.selectionBadgeText}>{selectionCount}</Text>
                      </View>
                    )}
                    <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.activitiesGrid}>
                    {category.activities.map((activity) => {
                      const isSelected = isActivitySelected(category.id, activity.id);
                      return (
                        <TouchableOpacity
                          key={activity.id}
                          style={[
                            styles.activityChip,
                            isSelected && styles.activityChipSelected
                          ]}
                          onPress={() => toggleActivity(category.id, activity.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                          <Text style={[
                            styles.activityText,
                            isSelected && styles.activityTextSelected
                          ]}>
                            {activity.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Social Frequency Section */}
          <View style={styles.frequencySection}>
            <Text style={styles.frequencyTitle}>How social are you?</Text>
            <View style={styles.frequencyOptions}>
              {socialFrequency.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.frequencyOption,
                    selectedFrequency === option.id && styles.frequencyOptionSelected
                  ]}
                  onPress={() => setSelectedFrequency(option.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.frequencyEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.frequencyText,
                    selectedFrequency === option.id && styles.frequencyTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selection Summary */}
          {selectedActivities.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryText}>
                {selectedActivities.length} activities selected
              </Text>
            </View>
          )}

          <View style={styles.bottomContainer}>
            <OnboardingButton
              onPress={handleNext}
              label={saving ? 'Saving...' : 'Next'}
              disabled={selectedActivities.length === 0 || !selectedFrequency || saving}
              loading={saving}
            />
          </View>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingBottom: scaleHeight(20),
  },
  headerSection: {
    marginBottom: scaleHeight(20),
  },
  title: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
  },
  subtitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(22),
    marginBottom: scaleHeight(4),
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
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
  categorySection: {
    marginBottom: scaleHeight(12),
  },
  categoryHeader: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  categoryHeaderWithSelection: {
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(2),
  },
  categoryTimeSlot: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    marginRight: scaleWidth(8),
  },
  selectionBadgeText: {
    color: Colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  expandIcon: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(20),
    fontWeight: '300',
    width: scaleWidth(20),
    textAlign: 'center',
  },
  activitiesGrid: {
    backgroundColor: Colors.backgroundGrayLighter,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderTopWidth: 0,
    borderBottomLeftRadius: scaleWidth(12),
    borderBottomRightRadius: scaleWidth(12),
    padding: scaleWidth(12),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  activityChip: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  activityChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  activityEmoji: {
    fontSize: scaleFont(16),
    marginRight: scaleWidth(6),
  },
  activityText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  activityTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  frequencySection: {
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(20),
  },
  frequencyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(12),
  },
  frequencyOptions: {
    gap: scaleHeight(8),
  },
  frequencyOption: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  frequencyOptionSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  frequencyEmoji: {
    fontSize: scaleFont(18),
    marginRight: scaleWidth(10),
  },
  frequencyText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    flex: 1,
  },
  frequencyTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  summarySection: {
    alignItems: 'center',
    marginVertical: scaleHeight(10),
  },
  summaryText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontStyle: 'italic',
  },
  bottomContainer: {
    marginTop: scaleHeight(20),
  },
});