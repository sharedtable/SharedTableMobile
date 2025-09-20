import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  DeviceEventEmitter
} from 'react-native';

import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { useOnboarding, validateOnboardingStep } from '@/lib/onboarding';
import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleHeight, scaleWidth, scaleFont } from '@/utils/responsive';
import { Colors } from '@/constants/colors';

interface OnboardingInterestingFactScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

// Fact categories with prompts
const factCategories = [
  {
    id: 'adventure',
    emoji: '🌍',
    label: 'Adventure & Travel',
    prompts: [
      'I once traveled to...',
      'My most adventurous experience was...',
      'The most unusual place I\'ve been to is...',
      'I backpacked through...',
      'My dream destination is...'
    ],
    examples: [
      'backpacked solo through 15 countries',
      'climbed Mount Kilimanjaro',
      'lived in a Buddhist monastery for a month',
      'road-tripped across America in a van',
      'scuba dived with sharks in Australia'
    ]
  },
  {
    id: 'skills',
    emoji: '🎯',
    label: 'Unique Skills',
    prompts: [
      'I can...',
      'I learned how to...',
      'I\'m surprisingly good at...',
      'I taught myself to...',
      'I hold a record in...'
    ],
    examples: [
      'solve a Rubik\'s cube in under a minute',
      'speak 4 languages fluently',
      'juggle while riding a unicycle',
      'play 3 musical instruments',
      'do a backflip'
    ]
  },
  {
    id: 'achievements',
    emoji: '🏆',
    label: 'Achievements',
    prompts: [
      'I won...',
      'I competed in...',
      'I was featured in...',
      'I completed...',
      'I published...'
    ],
    examples: [
      'won a national chess championship',
      'published a research paper at 18',
      'competed in the Olympics',
      'started a successful business in college',
      'gave a TEDx talk'
    ]
  },
  {
    id: 'collections',
    emoji: '📚',
    label: 'Collections & Hobbies',
    prompts: [
      'I collect...',
      'I\'ve been collecting... since...',
      'I have over... in my collection',
      'My hobby is...',
      'I spend my weekends...'
    ],
    examples: [
      'have over 500 vinyl records',
      'collect rare first edition books',
      'own 30+ houseplants',
      'restore vintage motorcycles',
      'brew my own craft beer'
    ]
  },
  {
    id: 'quirky',
    emoji: '✨',
    label: 'Quirky & Fun',
    prompts: [
      'I have a weird talent for...',
      'People are surprised when they learn I...',
      'My guilty pleasure is...',
      'I\'m obsessed with...',
      'I once...'
    ],
    examples: [
      'can recite Pi to 100 digits',
      'have watched The Office 20+ times',
      'eat pizza with a fork and knife',
      'have never broken a bone',
      'met my celebrity crush in an elevator'
    ]
  },
  {
    id: 'background',
    emoji: '🌟',
    label: 'Background & Origins',
    prompts: [
      'I grew up...',
      'My family...',
      'I\'m originally from...',
      'My childhood dream was...',
      'Before this, I...'
    ],
    examples: [
      'grew up on a farm with 10 siblings',
      'moved countries 5 times before age 18',
      'come from a family of circus performers',
      'was homeschooled on a sailboat',
      'used to be a professional athlete'
    ]
  }
];

// Quick fact templates
const quickFacts = [
  { emoji: '🎸', fact: 'I play in a band on weekends' },
  { emoji: '👨‍🍳', fact: 'I make the best homemade pasta' },
  { emoji: '🏃', fact: 'I run marathons for charity' },
  { emoji: '📖', fact: 'I read 50+ books a year' },
  { emoji: '🎮', fact: 'I stream video games on Twitch' },
  { emoji: '🧘', fact: 'I teach yoga in my spare time' },
  { emoji: '📸', fact: 'I\'m a weekend photographer' },
  { emoji: '🎭', fact: 'I perform stand-up comedy' },
  { emoji: '🌱', fact: 'I grow my own vegetables' },
  { emoji: '🐕', fact: 'I volunteer at animal shelters' },
  { emoji: '♟️', fact: 'I play competitive chess' },
  { emoji: '🎨', fact: 'I paint landscapes on weekends' }
];

export const OnboardingInterestingFactScreen: React.FC<OnboardingInterestingFactScreenProps> = ({
  onNavigate,
  currentStep = 12,
  totalSteps = 12,
}) => {
  const { currentStepData, saveStep, saving, stepErrors, clearErrors } = useOnboarding();
  const { setNeedsOnboarding } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [interestingFact, setInterestingFact] = useState<string>(
    currentStepData.interestingFact || ''
  );
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [randomPromptAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedPrompt('');
    setShowCustomInput(false);
    setInterestingFact('');
  };

  const selectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setShowCustomInput(true);
    if (!interestingFact.startsWith(prompt)) {
      setInterestingFact(`${prompt} `);
    }
  };

  const selectQuickFact = (fact: string) => {
    setInterestingFact(fact);
    setSelectedCategory(null);
    setSelectedPrompt('');
    setShowCustomInput(false);
  };

  const getRandomPrompt = () => {
    // Animate the button press
    Animated.sequence([
      Animated.timing(randomPromptAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(randomPromptAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Get random category and prompt
    const randomCategory = factCategories[Math.floor(Math.random() * factCategories.length)];
    const randomPromptIndex = Math.floor(Math.random() * randomCategory.prompts.length);
    const prompt = randomCategory.prompts[randomPromptIndex];
    
    setSelectedCategory(randomCategory.id);
    selectPrompt(prompt);
  };

  const handleNext = async () => {
    try {
      setLocalErrors({});
      clearErrors();

      if (!interestingFact.trim()) {
        setLocalErrors({ interestingFact: 'Please share an interesting fact about yourself' });
        return;
      }

      if (interestingFact.trim().length < 10) {
        setLocalErrors({ interestingFact: 'Please provide a bit more detail (at least 10 characters)' });
        return;
      }

      const data = { interestingFact: interestingFact.trim() };

      const validation = validateOnboardingStep('finalTouch', data);
      if (!validation.success) {
        setLocalErrors(validation.errors || {});
        return;
      }

      const success = await saveStep('finalTouch', data);

      if (success) {
        console.log('✅ [OnboardingInterestingFactScreen] Saved successfully');
        
        // Complete onboarding using simple endpoint
        try {
          // First try the simple endpoint
          await api.request('POST', '/onboarding-simple/complete', {});
          
          const { setOnboardingStatus } = useAuthStore.getState();
          setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
          setNeedsOnboarding(false);
          
          console.log('✅ Onboarding completed successfully!');
          
          // Trigger user data refresh to get latest access_granted status
          DeviceEventEmitter.emit('USER_DATA_REFRESH');
          
          // Navigate to complete - the OptionalOnboardingNavigator will handle
          // the correct navigation based on access_granted status
          console.log('✅ [OnboardingInterestingFactScreen] Navigating to completion');
          
          // Give time for the user data to refresh (the hook listens to USER_DATA_REFRESH event)
          // This ensures the OptionalOnboardingNavigator has the latest access_granted status
          setTimeout(() => {
            onNavigate?.('complete');
          }, 500); // Increased delay to ensure data refresh completes
        } catch (error) {
          console.error('Error completing onboarding, trying fallback:', error);
          
          // Fallback to original endpoint
          try {
            await api.request('POST', '/onboarding/update-status', { 
              status: 'fully_complete' 
            });
            
            const { setOnboardingStatus } = useAuthStore.getState();
            setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
            setNeedsOnboarding(false);
            
            // Trigger user data refresh
            DeviceEventEmitter.emit('USER_DATA_REFRESH');
            
            // Navigate to complete - the OptionalOnboardingNavigator will handle
            // the correct navigation based on access_granted status
            // Give time for the user data to refresh
            setTimeout(() => {
              onNavigate?.('complete');
            }, 500); // Increased delay to ensure data refresh completes
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            // Still try to navigate even if status update fails
            onNavigate?.('complete');
          }
        }
      } else {
        if (Object.keys(stepErrors).length > 0) {
          setLocalErrors(stepErrors);
        } else {
          Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingInterestingFactScreen] Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    onNavigate?.('onboarding-hobbies');
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
            <Text style={styles.title}>Final Touch! (3/3)</Text>
            <Text style={styles.subtitle}>Share something unique about yourself</Text>
          </View>

          {hasError && errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Random Prompt Generator */}
          <Animated.View style={{ transform: [{ scale: randomPromptAnimation }] }}>
            <TouchableOpacity
              style={styles.randomPromptButton}
              onPress={getRandomPrompt}
              activeOpacity={0.7}
            >
              <Text style={styles.randomPromptEmoji}>🎲</Text>
              <Text style={styles.randomPromptText}>Get Random Prompt</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Facts Section */}
          <View style={styles.quickFactsSection}>
            <Text style={styles.sectionTitle}>Quick Facts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickFactsScroll}
            >
              {quickFacts.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickFactChip,
                    interestingFact === item.fact && styles.quickFactChipSelected
                  ]}
                  onPress={() => selectQuickFact(item.fact)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickFactEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.quickFactText,
                    interestingFact === item.fact && styles.quickFactTextSelected
                  ]}>
                    {item.fact}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Or choose a category</Text>
            <View style={styles.categoriesGrid}>
              {factCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected
                  ]}
                  onPress={() => selectCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prompts for selected category */}
          {selectedCategory && (
            <View style={styles.promptsSection}>
              <Text style={styles.promptsTitle}>Choose a prompt to start with:</Text>
              {factCategories
                .find(c => c.id === selectedCategory)
                ?.prompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.promptButton,
                      selectedPrompt === prompt && styles.promptButtonSelected
                    ]}
                    onPress={() => selectPrompt(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.promptText,
                      selectedPrompt === prompt && styles.promptTextSelected
                    ]}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              
              {/* Examples */}
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Examples:</Text>
                <View style={styles.examplesGrid}>
                  {factCategories
                    .find(c => c.id === selectedCategory)
                    ?.examples.map((example, index) => (
                      <View key={index} style={styles.exampleChip}>
                        <Text style={styles.exampleText}>• {example}</Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}

          {/* Custom Input (shows when prompt selected or custom text entered) */}
          {(showCustomInput || interestingFact.length > 0) && (
            <View style={styles.customInputSection}>
              <Text style={styles.customInputLabel}>
                {selectedPrompt ? 'Complete your fact:' : 'Your interesting fact:'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={selectedPrompt ? "Complete the sentence..." : "Type your own interesting fact..."}
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                value={interestingFact}
                onChangeText={setInterestingFact}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{interestingFact.length}/300</Text>
            </View>
          )}

          {/* Or write your own */}
          {!selectedCategory && !interestingFact && (
            <TouchableOpacity
              style={styles.writeOwnButton}
              onPress={() => setShowCustomInput(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.writeOwnText}>✍️ Or write your own</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomContainer}>
            <OnboardingButton
              onPress={handleNext}
              label={saving ? 'Completing...' : 'Complete Onboarding'}
              disabled={!interestingFact.trim() || saving}
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
  randomPromptButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(25),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    marginBottom: scaleHeight(20),
  },
  randomPromptEmoji: {
    fontSize: scaleFont(20),
    marginRight: scaleWidth(8),
  },
  randomPromptText: {
    color: Colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  quickFactsSection: {
    marginBottom: scaleHeight(20),
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
  },
  quickFactsScroll: {
    marginHorizontal: -scaleWidth(16),
    paddingHorizontal: scaleWidth(16),
  },
  quickFactChip: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(14),
    marginRight: scaleWidth(10),
  },
  quickFactChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  quickFactEmoji: {
    fontSize: scaleFont(16),
    marginRight: scaleWidth(6),
  },
  quickFactText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    maxWidth: scaleWidth(180),
  },
  quickFactTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  categoriesSection: {
    marginBottom: scaleHeight(20),
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    width: (scaleWidth(375) - scaleWidth(32) - scaleWidth(20)) / 3, // 3 columns with gaps
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  categoryCardSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  categoryEmoji: {
    fontSize: scaleFont(24),
    marginBottom: scaleHeight(4),
  },
  categoryLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
    textAlign: 'center',
    lineHeight: scaleFont(14),
  },
  categoryLabelSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  promptsSection: {
    marginBottom: scaleHeight(20),
  },
  promptsTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginBottom: scaleHeight(10),
  },
  promptButton: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(14),
    marginBottom: scaleHeight(8),
  },
  promptButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  promptText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  promptTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  examplesContainer: {
    marginTop: scaleHeight(12),
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  examplesTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(8),
    fontStyle: 'italic',
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(6),
  },
  exampleChip: {
    backgroundColor: Colors.backgroundGrayLighter,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(4),
  },
  exampleText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
  },
  customInputSection: {
    marginBottom: scaleHeight(20),
  },
  customInputLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginBottom: scaleHeight(10),
  },
  textInput: {
    backgroundColor: Colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    minHeight: scaleHeight(100),
    padding: scaleWidth(14),
    textAlignVertical: 'top',
  },
  charCount: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(6),
    textAlign: 'right',
  },
  writeOwnButton: {
    backgroundColor: Colors.backgroundGrayLighter,
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    alignItems: 'center',
    marginVertical: scaleHeight(20),
  },
  writeOwnText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  bottomContainer: {
    marginTop: scaleHeight(20),
  },
});