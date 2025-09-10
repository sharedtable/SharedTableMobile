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

interface OnboardingFoodPreferences3ScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const cuisineOptions = [
  'Italian',
  'Chinese', 
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indian',
  'Mexican',
  'American',
  'French',
  'Mediterranean',
  'Middle Eastern',
  'Ethiopian',
  'Spanish',
  'Greek',
  'Turkish',
  'Peruvian',
  'Brazilian',
  'German',
  'British',
];

export const OnboardingFoodPreferences3Screen: React.FC<OnboardingFoodPreferences3ScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 13,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    currentStepData.cuisinesToTry || []
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredCuisines, setFilteredCuisines] = useState<string[]>(cuisineOptions);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = cuisineOptions.filter(cuisine =>
        cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCuisines(filtered);
    } else {
      setFilteredCuisines(cuisineOptions);
    }
  }, [searchQuery]);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      }
      // No limit on selections
      return [...prev, cuisine];
    });
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      const foodData = {
        cuisinesToTry: selectedCuisines,
      };

      const validation = validateOnboardingStep('foodPreferences', foodData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('foodPreferences', foodData);

      if (success) {
        console.log('✅ [OnboardingFoodPreferences3Screen] Saved successfully');
        onNavigate?.('onboarding-food-4', foodData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingFoodPreferences3Screen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-food-2');
  };

  const hasError = Object.keys(localErrors).length > 0 || Object.keys(stepErrors).length > 0;
  const errorMessage = Object.values(localErrors)[0] || Object.values(stepErrors)[0];

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      scrollable={false}
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Your Taste in Food (3/4)</Text>
          <Text style={styles.subtitle}>Which cuisines do you enjoy?</Text>
          <Text style={styles.helperText}>(Multi-select allowed)</Text>
        </View>

        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cuisines..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        <Text style={styles.suggestionsLabel}>Suggestions</Text>

        {/* Cuisine Options */}
        <ScrollView 
          style={styles.cuisineScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cuisineGrid}>
            {filteredCuisines.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineButton,
                  selectedCuisines.includes(cuisine) && styles.cuisineButtonSelected
                ]}
                onPress={() => toggleCuisine(cuisine)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cuisineButtonText,
                  selectedCuisines.includes(cuisine) && styles.cuisineButtonTextSelected
                ]}>
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Saving...' : 'Next'}
            disabled={saving}
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
  searchContainer: {
    position: 'relative',
    marginBottom: scaleHeight(20),
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(25),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(12),
    paddingRight: scaleWidth(40),
  },
  clearButton: {
    position: 'absolute',
    right: scaleWidth(15),
    top: '50%',
    transform: [{ translateY: -scaleHeight(12) }],
  },
  clearButtonText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(24),
    fontWeight: '300',
  },
  suggestionsLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
  },
  cuisineScrollView: {
    flex: 1,
    marginBottom: scaleHeight(20),
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
    paddingBottom: scaleHeight(20),
  },
  cuisineButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  cuisineButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  cuisineButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  cuisineButtonTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});