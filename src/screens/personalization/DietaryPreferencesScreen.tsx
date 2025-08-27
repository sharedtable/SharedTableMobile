/**
 * Dietary Preferences Screen
 * Collects user dietary restrictions, alcohol preferences, and spice tolerance
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { OnboardingButton } from '@/components/onboarding';
import { CompletionProgressBar } from '@/components/personalization';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePersonalizationFlow } from '@/hooks/usePersonalizationFlow';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf', color: '#4CAF50' },
  { id: 'vegan', label: 'Vegan', icon: 'flower', color: '#8BC34A' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'fish', color: '#00BCD4' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: 'nutrition', color: '#FF9800' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: 'water', color: '#03A9F4' },
  { id: 'keto', label: 'Keto', icon: 'flame', color: '#F44336' },
  { id: 'paleo', label: 'Paleo', icon: 'fitness', color: '#795548' },
  { id: 'halal', label: 'Halal', icon: 'moon', color: '#9C27B0' },
  { id: 'kosher', label: 'Kosher', icon: 'star', color: '#3F51B5' },
  { id: 'nut_allergy', label: 'Nut Allergy', icon: 'warning', color: '#FF5722' },
  { id: 'shellfish_allergy', label: 'Shellfish Allergy', icon: 'alert-circle', color: '#E91E63' },
  { id: 'none', label: 'No Restrictions', icon: 'happy', color: '#607D8B' },
];

const ALCOHOL_OPTIONS = [
  { id: 'no_drink', label: "Don't drink", icon: 'close-circle', color: '#9CA3AF' },
  { id: 'wine_only', label: 'Wine only', icon: 'wine', color: '#8B5CF6' },
  { id: 'beer_only', label: 'Beer only', icon: 'beer', color: '#F59E0B' },
  { id: 'cocktails', label: 'Cocktails', icon: 'sparkles', color: '#10B981' },
  { id: 'everything', label: 'Everything', icon: 'happy', color: '#EC4899' },
  { id: 'sober_curious', label: 'Sober curious', icon: 'leaf', color: '#06B6D4' },
];

export const DietaryPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    saveStepData, 
    completion, 
    isStepCompleted,
    refreshCompletionStatus,
    data
  } = usePersonalizationFlow();
  
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAlcohol, setSelectedAlcohol] = useState<string>('');
  const [spiceTolerance, setSpiceTolerance] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing preferences on mount
  useEffect(() => {
    const loadExistingPreferences = async () => {
      try {
        setLoading(true);
        await refreshCompletionStatus();
        
        // If we have existing data, populate the form
        if (data?.dietary) {
          console.log('📥 Loading existing dietary preferences:', data.dietary);
          setSelectedDietary(data.dietary.dietary_restrictions || []);
          setSelectedAlcohol(data.dietary.alcohol_preferences || '');
          setSpiceTolerance(data.dietary.spice_tolerance || 5);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingPreferences();
  }, []);

  const toggleDietaryOption = (optionId: string) => {
    if (optionId === 'none') {
      setSelectedDietary(['none']);
    } else {
      const newOptions = selectedDietary.filter(id => id !== 'none');
      
      if (selectedDietary.includes(optionId)) {
        setSelectedDietary(newOptions.filter(id => id !== optionId));
      } else {
        setSelectedDietary([...newOptions, optionId]);
      }
    }
  };

  const handleNext = async () => {
    const data = { 
      dietary_restrictions: selectedDietary,
      alcohol_preferences: selectedAlcohol,
      spice_tolerance: spiceTolerance,
    };
    
    setSaving(true);
    try {
      const success = await saveStepData('dietary', data);
      
      if (success) {
        (navigation as any).navigate('PersonalizationCuisine');
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const getSpiceLabel = (value: number) => {
    if (value <= 2) return 'Mild';
    if (value <= 4) return 'Medium';
    if (value <= 6) return 'Hot';
    if (value <= 8) return 'Extra Hot';
    return 'Fire! 🔥';
  };

  const getSpiceEmoji = (value: number) => {
    if (value <= 2) return '🥛';
    if (value <= 4) return '🌶️';
    if (value <= 6) return '🌶️🌶️';
    if (value <= 8) return '🌶️🌶️🌶️';
    return '🔥🔥🔥';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={scaleWidth(24)} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.stepIndicator}>Step 1 of 5</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <CompletionProgressBar
          completion={completion}
          currentCategory="dietary"
          compact
          style={styles.progressBar}
        />

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Dietary Preferences</Text>
          <Text style={styles.subtitle}>Tell us about your dietary needs</Text>
        </View>

        {/* Completed Badge */}
        {isStepCompleted('dietary') && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={scaleWidth(20)} color={theme.colors.success[600]} />
            <Text style={styles.completedText}>Previously completed</Text>
          </View>
        )}

        {/* Dietary Restrictions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.optionsGrid}>
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = selectedDietary.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggleDietaryOption(option.id)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && styles.optionCardPressed,
                  ]}
                >
                  <View style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={scaleWidth(24)} 
                      color={isSelected ? theme.colors.white : option.color}
                    />
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedCheckmark}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={scaleWidth(20)} 
                        color={theme.colors.primary[500]}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Alcohol Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcohol Preferences</Text>
          <View style={styles.alcoholOptions}>
            {ALCOHOL_OPTIONS.map((option) => {
              const isSelected = selectedAlcohol === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedAlcohol(option.id)}
                  style={({ pressed }) => [
                    styles.alcoholOption,
                    isSelected && styles.alcoholOptionSelected,
                    pressed && styles.alcoholOptionPressed,
                  ]}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={scaleWidth(20)} 
                    color={isSelected ? theme.colors.primary[500] : theme.colors.gray[600]}
                  />
                  <Text style={[
                    styles.alcoholLabel,
                    isSelected && styles.alcoholLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Spice Tolerance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spice Tolerance</Text>
          <View style={styles.spiceContainer}>
            <Text style={styles.spiceEmoji}>{getSpiceEmoji(spiceTolerance)}</Text>
            <Text style={styles.spiceLabel}>{getSpiceLabel(spiceTolerance)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              value={spiceTolerance}
              onValueChange={setSpiceTolerance}
              step={1}
              minimumTrackTintColor={theme.colors.primary[500]}
              maximumTrackTintColor={theme.colors.gray[300]}
              thumbTintColor={theme.colors.primary[600]}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEndLabel}>Mild</Text>
              <Text style={styles.sliderValue}>{Math.round(spiceTolerance)}/10</Text>
              <Text style={styles.sliderEndLabel}>Fire!</Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            label={saving ? 'Saving...' : 'Continue'}
            onPress={handleNext}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(16),
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
    paddingBottom: scaleHeight(16),
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
  },
  placeholder: {
    width: scaleWidth(40),
  },
  progressBar: {
    marginBottom: scaleHeight(24),
    marginHorizontal: scaleWidth(20),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success[50],
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(20),
    alignSelf: 'center',
  },
  completedText: {
    marginLeft: scaleWidth(8),
    color: theme.colors.success[700],
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  section: {
    marginBottom: scaleHeight(32),
    paddingHorizontal: scaleWidth(20),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(6),
  },
  sectionSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(16),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  optionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  iconContainerSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  optionLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: theme.colors.primary[700],
  },
  selectedCheckmark: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
  },
  alcoholOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alcoholOption: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: scaleWidth(12),
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(12),
  },
  alcoholOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  alcoholOptionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  alcoholLabel: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: scaleHeight(6),
  },
  alcoholLabelSelected: {
    color: theme.colors.primary[700],
  },
  spiceContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(20),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  spiceEmoji: {
    fontSize: scaleFont(32),
    marginBottom: scaleHeight(8),
  },
  spiceLabel: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(16),
  },
  slider: {
    width: '100%',
    height: scaleHeight(40),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scaleHeight(8),
  },
  sliderEndLabel: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  sliderValue: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  buttonContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(30),
    paddingTop: scaleHeight(20),
  },
});