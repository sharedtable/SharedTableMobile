import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePersonalizationFlow } from '@/hooks/usePersonalizationFlow';

interface PersonalizationSocialScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const SocialPreferencesScreen: React.FC<PersonalizationSocialScreenProps> = ({
  onNavigate,
  currentStep = 4,  // Fourth personalization step
  totalSteps = 6,   // Total personalization steps
}) => {
  const navigation = useNavigation();
  const { saveStepData } = usePersonalizationFlow();
  const [_saving, setSaving] = useState(false);
  // Slider values (0-100)
  const [socialLevel, setSocialLevel] = useState(50);
  const [adventureLevel, setAdventureLevel] = useState(50);
  const [formalityLevel, setFormalityLevel] = useState(50);
  
  // Multiple choice selections
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  
  // Social media handles
  const [instagramHandle, setInstagramHandle] = useState('');
  const [linkedinHandle, setLinkedinHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');

  const interestOptions = [
    { id: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
    { id: 'wine', label: 'Wine', icon: '🍷' },
    { id: 'cocktails', label: 'Cocktails', icon: '🍸' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'photography', label: 'Food Photography', icon: '📸' },
    { id: 'sustainability', label: 'Sustainability', icon: '🌱' },
    { id: 'culture', label: 'Cultural Exchange', icon: '🌍' },
    { id: 'business', label: 'Business Networking', icon: '💼' },
    { id: 'fitness', label: 'Health & Fitness', icon: '💪' },
    { id: 'arts', label: 'Arts & Music', icon: '🎨' },
  ];

  const goalOptions = [
    { id: 'friends', label: 'Make New Friends', icon: 'people' },
    { id: 'explore', label: 'Explore New Cuisines', icon: 'compass' },
    { id: 'network', label: 'Professional Networking', icon: 'briefcase' },
    { id: 'date', label: 'Dating', icon: 'heart' },
    { id: 'learn', label: 'Learn Cooking', icon: 'school' },
    { id: 'community', label: 'Join Community', icon: 'home' },
  ];

  const languageOptions = [
    { id: 'english', label: 'English' },
    { id: 'spanish', label: 'Español' },
    { id: 'mandarin', label: '中文' },
    { id: 'french', label: 'Français' },
    { id: 'hindi', label: 'हिन्दी' },
    { id: 'arabic', label: 'العربية' },
    { id: 'portuguese', label: 'Português' },
    { id: 'japanese', label: '日本語' },
    { id: 'korean', label: '한국어' },
    { id: 'german', label: 'Deutsch' },
  ];

  const toggleSelection = (array: string[], setArray: (value: string[]) => void, id: string) => {
    if (array.includes(id)) {
      setArray(array.filter(item => item !== id));
    } else {
      setArray([...array, id]);
    }
  };

  // Social media validation helpers
  const validateInstagramHandle = (handle: string) => {
    const cleaned = handle.replace('@', '');
    return cleaned.length === 0 || /^[a-zA-Z0-9._]{1,30}$/.test(cleaned);
  };

  const validateTwitterHandle = (handle: string) => {
    const cleaned = handle.replace('@', '');
    return cleaned.length === 0 || /^[a-zA-Z0-9_]{1,15}$/.test(cleaned);
  };

  const validateLinkedinHandle = (handle: string) => {
    if (handle.length === 0) return true;
    // Check for LinkedIn profile URL format or username
    return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9-]+\/?$/.test(handle) || 
           /^[a-zA-Z0-9-]{3,100}$/.test(handle);
  };

  const handleNext = async () => {
    const data = {
      social_preferences: {
        social_level: socialLevel,
        adventure_level: adventureLevel,
        formality_level: formalityLevel,
        interests,
        goals,
        languages,
        social_media: {
          instagram: instagramHandle.replace('@', ''),
          linkedin: linkedinHandle,
          twitter: twitterHandle.replace('@', ''),
        }
      }
    };
    
    setSaving(true);
    try {
      const success = await saveStepData('social', data);
      
      if (success) {
        // Use React Navigation if available, otherwise fall back to onNavigate prop
        if (navigation && (navigation as any).navigate) {
          (navigation as any).navigate('PersonalizationFoodieProfile', data);
        } else if (onNavigate) {
          onNavigate('personalization-foodie-profile', data);
        }
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving social preferences:', error);
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
      onNavigate('personalization-dining-style');
    }
  };

  const getSocialLevelText = () => {
    if (socialLevel < 33) return 'Intimate gatherings';
    if (socialLevel < 67) return 'Balanced social';
    return 'Love big groups';
  };

  const getAdventureLevelText = () => {
    if (adventureLevel < 33) return 'Comfort foods';
    if (adventureLevel < 67) return 'Open to trying';
    return 'Adventure seeker';
  };

  const getFormalityLevelText = () => {
    if (formalityLevel < 33) return 'Casual vibes';
    if (formalityLevel < 67) return 'Mix it up';
    return 'Fine dining';
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>Social Preferences</OnboardingTitle>
        <Text style={styles.subtitle}>
          Let's understand your social dining style
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Personality Sliders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Dining Personality</Text>
            
            {/* Social Level */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Social Energy</Text>
                <Text style={styles.sliderValue}>{getSocialLevelText()}</Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="person" size={20} color="#9CA3AF" />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={socialLevel}
                  onValueChange={setSocialLevel}
                  minimumTrackTintColor={theme.colors.primary.main}
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor={theme.colors.primary.main}
                />
                <Ionicons name="people" size={20} color="#9CA3AF" />
              </View>
            </View>

            {/* Adventure Level */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Culinary Adventure</Text>
                <Text style={styles.sliderValue}>{getAdventureLevelText()}</Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="home" size={20} color="#9CA3AF" />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={adventureLevel}
                  onValueChange={setAdventureLevel}
                  minimumTrackTintColor={theme.colors.primary.main}
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor={theme.colors.primary.main}
                />
                <Ionicons name="rocket" size={20} color="#9CA3AF" />
              </View>
            </View>

            {/* Formality Level */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Dining Formality</Text>
                <Text style={styles.sliderValue}>{getFormalityLevelText()}</Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="fast-food" size={20} color="#9CA3AF" />
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={formalityLevel}
                  onValueChange={setFormalityLevel}
                  minimumTrackTintColor={theme.colors.primary.main}
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor={theme.colors.primary.main}
                />
                <Ionicons name="wine" size={20} color="#9CA3AF" />
              </View>
            </View>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Interests</Text>
            <View style={styles.optionsGrid}>
              {interestOptions.map((option) => {
                const isSelected = interests.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.chipButton,
                      isSelected && styles.chipButtonSelected
                    ]}
                    onPress={() => toggleSelection(interests, setInterests, option.id)}
                  >
                    <Text style={styles.chipEmoji}>{option.icon}</Text>
                    <Text style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What brings you to SharedTable?</Text>
            <View style={styles.goalGrid}>
              {goalOptions.map((option) => {
                const isSelected = goals.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.goalCard,
                      isSelected && styles.goalCardSelected
                    ]}
                    onPress={() => toggleSelection(goals, setGoals, option.id)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={isSelected ? theme.colors.primary.main : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.goalText,
                      isSelected && styles.goalTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages you speak</Text>
            <View style={styles.languageGrid}>
              {languageOptions.map((option) => {
                const isSelected = languages.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.languageChip,
                      isSelected && styles.languageChipSelected
                    ]}
                    onPress={() => toggleSelection(languages, setLanguages, option.id)}
                  >
                    <Text style={[
                      styles.languageText,
                      isSelected && styles.languageTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Social Media Handles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Your Social Media</Text>
            <Text style={styles.socialSubtitle}>
              Optional: Add your social handles to connect with other foodies (all optional)
            </Text>
            
            <View style={styles.socialInputsContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Instagram</Text>
                <View style={styles.inputWithPrefix}>
                  <Text style={styles.inputPrefix}>@</Text>
                  <TextInput
                    style={[
                      styles.socialInput,
                      !validateInstagramHandle(instagramHandle) && styles.inputError
                    ]}
                    placeholder="your.username"
                    placeholderTextColor="#9CA3AF"
                    value={instagramHandle.replace('@', '')}
                    onChangeText={(text) => setInstagramHandle(text)}
                    maxLength={30}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!validateInstagramHandle(instagramHandle) && (
                  <Text style={styles.errorText}>Invalid Instagram handle</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>LinkedIn</Text>
                <TextInput
                  style={[
                    styles.socialInputFull,
                    !validateLinkedinHandle(linkedinHandle) && styles.inputError
                  ]}
                  placeholder="linkedin.com/in/yourname or just yourname"
                  placeholderTextColor="#9CA3AF"
                  value={linkedinHandle}
                  onChangeText={setLinkedinHandle}
                  maxLength={100}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!validateLinkedinHandle(linkedinHandle) && (
                  <Text style={styles.errorText}>Invalid LinkedIn profile</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Twitter/X</Text>
                <View style={styles.inputWithPrefix}>
                  <Text style={styles.inputPrefix}>@</Text>
                  <TextInput
                    style={[
                      styles.socialInput,
                      !validateTwitterHandle(twitterHandle) && styles.inputError
                    ]}
                    placeholder="yourusername"
                    placeholderTextColor="#9CA3AF"
                    value={twitterHandle.replace('@', '')}
                    onChangeText={(text) => setTwitterHandle(text)}
                    maxLength={15}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {!validateTwitterHandle(twitterHandle) && (
                  <Text style={styles.errorText}>Invalid Twitter handle</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label="Continue"
            disabled={interests.length === 0 || goals.length === 0 || languages.length === 0}
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
    marginBottom: scaleHeight(20),
    marginTop: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(20),
  },
  section: {
    marginBottom: scaleHeight(28),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(16),
  },
  sliderContainer: {
    marginBottom: scaleHeight(24),
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  sliderLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: scaleFont(14),
  },
  sliderValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(12),
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  slider: {
    flex: 1,
    height: scaleHeight(40),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(20),
    borderWidth: 2,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(14),
    gap: scaleWidth(6),
  },
  chipButtonSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main,
  },
  chipEmoji: {
    fontSize: scaleFont(16),
  },
  chipText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  chipTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  goalCard: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(12),
    alignItems: 'center',
    width: '30%',
    gap: scaleHeight(8),
  },
  goalCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main,
  },
  goalText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    textAlign: 'center',
  },
  goalTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  languageChip: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(12),
  },
  languageChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  languageText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  languageTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(40),
  },
  socialSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
    marginBottom: scaleHeight(16),
  },
  socialInputsContainer: {
    gap: scaleHeight(16),
  },
  inputContainer: {
    marginBottom: scaleHeight(4),
  },
  inputLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(6),
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    paddingHorizontal: scaleWidth(12),
    height: scaleHeight(44),
  },
  inputPrefix: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: scaleFont(16),
    marginRight: scaleWidth(4),
  },
  socialInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
  },
  socialInputFull: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    padding: scaleWidth(12),
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    height: scaleHeight(44),
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
  },
});