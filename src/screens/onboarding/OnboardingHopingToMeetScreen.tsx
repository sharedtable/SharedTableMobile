import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingHopingToMeetScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

// Predefined connection types
const connectionTypes = [
  { id: 'cofounders', label: '🚀 Future Co-founders', description: 'Build something amazing together' },
  { id: 'fitness', label: '💪 Fitness Partners', description: 'Gym buddies & sports teammates' },
  { id: 'creative', label: '🎨 Creative Collaborators', description: 'Artists, musicians, writers' },
  { id: 'professional', label: '💼 Professional Network', description: 'Industry peers & mentors' },
  { id: 'adventure', label: '🏔️ Adventure Seekers', description: 'Hiking, travel, outdoor activities' },
  { id: 'study', label: '📚 Study Groups', description: 'Learning & academic pursuits' },
  { id: 'gaming', label: '🎮 Gaming Friends', description: 'Board games, video games, D&D' },
  { id: 'foodie', label: '🍽️ Fellow Foodies', description: 'Explore restaurants & cuisines' },
  { id: 'social', label: '🎉 Social Circle', description: 'Expand your friend group' },
  { id: 'dating', label: '💝 Romantic Connections', description: 'Find your special someone' },
];

// Specific interests within each type
const specificInterests: Record<string, string[]> = {
  cofounders: ['Tech startups', 'Social impact', 'E-commerce', 'AI/ML', 'Climate tech', 'Healthcare'],
  fitness: ['Running', 'Gym workouts', 'Yoga', 'Basketball', 'Tennis', 'Swimming', 'Cycling', 'Rock climbing'],
  creative: ['Photography', 'Music production', 'Writing', 'Painting', 'Film making', 'Design'],
  professional: ['Same industry', 'Career transition', 'Mentorship', 'Skill exchange', 'Networking'],
  adventure: ['Hiking', 'Camping', 'Travel', 'Road trips', 'Skiing', 'Surfing', 'Backpacking'],
  study: ['Language exchange', 'Coding', 'Book club', 'Research', 'Online courses'],
  gaming: ['Board games', 'Video games', 'D&D', 'Card games', 'Esports', 'Game development'],
  foodie: ['New restaurants', 'Cooking together', 'Wine tasting', 'Food festivals', 'Recipe exchange'],
  social: ['Happy hours', 'Weekend hangouts', 'Events', 'Parties', 'Group activities'],
  dating: ['Casual dating', 'Serious relationship', 'Activity partners', 'Coffee dates'],
};

export const OnboardingHopingToMeetScreen: React.FC<OnboardingHopingToMeetScreenProps> = ({
  onNavigate,
  currentStep = 10,
  totalSteps = 12,
}) => {
  const { saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSpecifics, setSelectedSpecifics] = useState<Record<string, string[]>>({});
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        // Remove type and its specifics
        const newTypes = prev.filter(t => t !== typeId);
        setSelectedSpecifics(prevSpecifics => {
          const newSpecifics = { ...prevSpecifics };
          delete newSpecifics[typeId];
          return newSpecifics;
        });
        return newTypes;
      } else {
        if (prev.length >= 3) {
          Alert.alert('Maximum Reached', 'You can select up to 3 connection types');
          return prev;
        }
        return [...prev, typeId];
      }
    });
  };

  const toggleSpecific = (typeId: string, specific: string) => {
    setSelectedSpecifics(prev => {
      const typeSpecifics = prev[typeId] || [];
      if (typeSpecifics.includes(specific)) {
        return {
          ...prev,
          [typeId]: typeSpecifics.filter(s => s !== specific)
        };
      } else {
        return {
          ...prev,
          [typeId]: [...typeSpecifics, specific]
        };
      }
    });
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (selectedTypes.length === 0) {
        setLocalErrors({ types: 'Please select at least one connection type' });
        return;
      }

      // Format the data for saving
      const formattedConnections = selectedTypes.map(typeId => {
        const type = connectionTypes.find(t => t.id === typeId);
        const specifics = selectedSpecifics[typeId] || [];
        return {
          type: type?.label || typeId,
          specifics,
        };
      });

      const hopingToMeetText = formattedConnections.map(conn => {
        const base = conn.type;
        if (conn.specifics.length > 0) {
          return `${base}: ${conn.specifics.join(', ')}`;
        }
        return base;
      }).join('; ');

      const finalText = additionalNotes 
        ? `${hopingToMeetText}. Additional: ${additionalNotes}`
        : hopingToMeetText;

      const data = { hopingToMeet: finalText };

      const validation = validateOnboardingStep('finalTouch', data);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('finalTouch', data);

      if (success) {
        console.log('✅ [OnboardingHopingToMeetScreen] Saved successfully');
        onNavigate?.('onboarding-hobbies', data);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingHopingToMeetScreen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-interests');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable
      keyboardAvoiding
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Final Touch! (1/3)</Text>
            <Text style={styles.subtitle}>Who are you hoping to meet?</Text>
          </View>

          {hasError && errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Connection Types */}
          <View style={styles.typesSection}>
            <Text style={styles.sectionTitle}>Select up to 3 types of connections</Text>
            {connectionTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedTypes.includes(type.id) && styles.typeCardSelected
                ]}
                onPress={() => toggleType(type.id)}
                activeOpacity={0.7}
              >
                <View style={styles.typeCardHeader}>
                  <Text style={[
                    styles.typeLabel,
                    selectedTypes.includes(type.id) && styles.typeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                  <View style={[
                    styles.checkbox,
                    selectedTypes.includes(type.id) && styles.checkboxSelected
                  ]}>
                    {selectedTypes.includes(type.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.typeDescription,
                  selectedTypes.includes(type.id) && styles.typeDescriptionSelected
                ]}>
                  {type.description}
                </Text>
                
                {/* Show specific interests when selected */}
                {selectedTypes.includes(type.id) && specificInterests[type.id] && (
                  <View style={styles.specificsContainer}>
                    <Text style={styles.specificsTitle}>Be more specific (optional):</Text>
                    <View style={styles.specificsGrid}>
                      {specificInterests[type.id].map((specific) => (
                        <TouchableOpacity
                          key={specific}
                          style={[
                            styles.specificChip,
                            (selectedSpecifics[type.id] || []).includes(specific) && styles.specificChipSelected
                          ]}
                          onPress={() => toggleSpecific(type.id, specific)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.specificText,
                            (selectedSpecifics[type.id] || []).includes(specific) && styles.specificTextSelected
                          ]}>
                            {specific}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional Additional Notes */}
          {selectedTypes.length > 0 && (
            <View style={styles.additionalSection}>
              <Text style={styles.sectionTitle}>Anything else? (optional)</Text>
              <TextInput
                style={styles.additionalInput}
                placeholder="Add any specific details..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={3}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                textAlignVertical="top"
                maxLength={100}
              />
            </View>
          )}

          <View style={styles.bottomContainer}>
            <OnboardingButton
              onPress={handleNext}
              label={saving ? 'Saving...' : 'Next'}
              disabled={selectedTypes.length === 0 || saving}
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
  typesSection: {
    marginBottom: scaleHeight(20),
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
  },
  typeCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
  },
  typeCardSelected: {
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
  },
  typeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  typeLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    flex: 1,
  },
  typeLabelSelected: {
    color: theme.colors.primary.main,
  },
  typeDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
  },
  typeDescriptionSelected: {
    color: theme.colors.text.primary,
  },
  checkbox: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  checkmark: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
  specificsContainer: {
    marginTop: scaleHeight(12),
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  specificsTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(8),
  },
  specificsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  specificChip: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    marginBottom: scaleHeight(6),
  },
  specificChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  specificText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  specificTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  additionalSection: {
    marginBottom: scaleHeight(20),
  },
  additionalInput: {
    backgroundColor: Colors.white,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    minHeight: scaleHeight(80),
    padding: scaleWidth(12),
    textAlignVertical: 'top',
  },
  bottomContainer: {
    marginTop: scaleHeight(20),
  },
});