import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PersonalizationDietaryScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const dietaryOptions = [
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

export const PersonalizationDietaryScreen: React.FC<PersonalizationDietaryScreenProps> = ({
  onNavigate,
  currentStep = 4,
  totalSteps = 8,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (optionId: string) => {
    if (optionId === 'none') {
      // If "No Restrictions" is selected, clear all other options
      setSelectedOptions(['none']);
    } else {
      // Remove "none" if other options are selected
      const newOptions = selectedOptions.filter(id => id !== 'none');
      
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(newOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...newOptions, optionId]);
      }
    }
  };

  const handleNext = () => {
    const data = { dietary_restrictions: selectedOptions };
    onNavigate?.('personalization-cuisine', data);
  };

  const handleBack = () => {
    onNavigate?.('onboarding-gender');
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>Dietary Preferences</OnboardingTitle>
        <Text style={styles.subtitle}>
          Select any dietary restrictions or preferences you have.
          This helps us recommend the perfect dining experiences for you.
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.optionsGrid}>
            {dietaryOptions.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    isSelected && { borderColor: option.color }
                  ]}
                  onPress={() => toggleOption(option.id)}
                >
                  <View style={[
                    styles.iconContainer,
                    isSelected && { backgroundColor: `${option.color}20` }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={isSelected ? option.color : '#9CA3AF'} 
                    />
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Continue"
            disabled={selectedOptions.length === 0}
          />
          {selectedOptions.length === 0 && (
            <Text style={styles.helperText}>
              Select at least one option to continue
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  optionCard: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.05)',
    borderWidth: 2,
  },
  iconContainer: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(10),
    backgroundColor: '#F3F4F6',
  },
  optionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    alignItems: 'center',
    justifyContent: 'center',
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