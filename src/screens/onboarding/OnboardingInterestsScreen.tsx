import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Pressable
} from 'react-native';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { searchInterests, getRandomSuggestions } from '@/data/interests';
import { Colors } from '@/constants/colors';

interface OnboardingInterestsScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const OnboardingInterestsScreen: React.FC<OnboardingInterestsScreenProps> = ({
  onNavigate,
  currentStep = 9,
  totalSteps = 10,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentStepData.interests || []
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    clearErrors();
    // Initialize with random suggestions
    setSuggestions(getRandomSuggestions(12, selectedInterests));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearErrors]);

  useEffect(() => {
    // Update suggestions when interests change
    setSuggestions(getRandomSuggestions(12, selectedInterests));
  }, [selectedInterests]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length >= 1) {
      const results = searchInterests(query, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      if (selectedInterests.length >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 interests');
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (selectedInterests.length === 0) {
        setLocalErrors({ interests: 'Please select at least one interest' });
        return;
      }

      const interestsData = { interests: selectedInterests };

      const validation = validateOnboardingStep('interests', interestsData);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('interests', interestsData);

      if (success) {
        console.log('✅ [OnboardingInterestsScreen] Interests saved successfully');
        // Navigate to Final Touch screens
        onNavigate?.('onboarding-hoping-to-meet', interestsData);
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingInterestsScreen] Error saving interests:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-lifestyle');
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
      <Pressable 
        style={styles.container}
        onPress={() => {
          Keyboard.dismiss();
          setSearchResults([]);
        }}
      >
        <OnboardingTitle>Your interests</OnboardingTitle>

        {hasError && errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Type to search interests..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result}
                  style={styles.searchResultItem}
                  onPress={() => addInterest(result)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.searchResultText}>+ {result}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Interests */}
        {selectedInterests.length > 0 && (
          <View style={styles.selectedSection}>
            <View style={styles.selectedInterestsContainer}>
              {selectedInterests.map((interest) => (
                <View key={interest} style={styles.selectedInterest}>
                  <Text style={styles.selectedInterestText}>{interest}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeInterest(interest)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[
                  styles.suggestionItem,
                  selectedInterests.includes(suggestion) && styles.suggestionItemDisabled
                ]}
                onPress={() => !selectedInterests.includes(suggestion) && addInterest(suggestion)}
                activeOpacity={0.7}
                disabled={selectedInterests.includes(suggestion)}
              >
                <Text style={[
                  styles.suggestionText,
                  selectedInterests.includes(suggestion) && styles.suggestionTextDisabled
                ]}>
                  {suggestion} +
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={saving ? 'Completing...' : 'Next'}
            disabled={selectedInterests.length === 0 || saving}
            loading={saving}
          />
        </View>
      </Pressable>
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
  searchContainer: {
    position: 'relative',
    marginBottom: scaleHeight(16),
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(25),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
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
  searchResultsContainer: {
    marginBottom: scaleHeight(16),
  },
  searchResultItem: {
    backgroundColor: Colors.white,
    borderColor: theme.colors.primary.main,
    borderWidth: 1,
    borderRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(8),
    marginRight: scaleWidth(8),
  },
  searchResultText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  selectedSection: {
    marginBottom: scaleHeight(20),
  },
  selectedInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  selectedInterest: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleWidth(14),
    paddingRight: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    marginRight: scaleWidth(8),
    marginBottom: scaleHeight(8),
  },
  selectedInterestText: {
    color: Colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginRight: scaleWidth(8),
  },
  removeButton: {
    backgroundColor: theme.colors.overlay.white30,
    borderRadius: scaleWidth(10),
    width: scaleWidth(20),
    height: scaleWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
    lineHeight: scaleFont(18),
  },
  suggestionsSection: {
    marginTop: scaleHeight(20),
  },
  suggestionsTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  suggestionItem: {
    backgroundColor: Colors.backgroundGrayLighter,
    borderColor: Colors.borderLight,
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(8),
    marginRight: scaleWidth(8),
    marginBottom: scaleHeight(8),
  },
  suggestionItemDisabled: {
    opacity: 0.4,
    backgroundColor: Colors.backgroundGrayLight,
  },
  suggestionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  suggestionTextDisabled: {
    color: theme.colors.text.secondary,
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(16),
  },
});