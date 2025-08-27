import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
// import { Ionicons } from '@expo/vector-icons'; // Not used currently
import { useNavigation } from '@react-navigation/native';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePersonalizationFlow } from '@/hooks/usePersonalizationFlow';

interface PersonalizationFoodieProfileScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const FoodieProfileScreen: React.FC<PersonalizationFoodieProfileScreenProps> = ({
  onNavigate,
  currentStep = 5,  // Fifth personalization step
  totalSteps = 6,   // Total personalization steps
}) => {
  const navigation = useNavigation();
  const { saveStepData, completePersonalization } = usePersonalizationFlow();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [bucketList, setBucketList] = useState('');
  const [cookingSkill, setCookingSkill] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [funFact, setFunFact] = useState('');

  const cookingSkillOptions = [
    { id: 'beginner', label: "Can't boil water", emoji: '😅' },
    { id: 'basic', label: 'Basic home cooking', emoji: '👍' },
    { id: 'intermediate', label: 'Pretty good chef', emoji: '👨‍🍳' },
    { id: 'advanced', label: 'Could open a restaurant', emoji: '⭐' },
  ];

  const foodieTags = [
    'Coffee Addict ☕',
    'Wine Lover 🍷',
    'Dessert First 🍰',
    'Spice Seeker 🌶️',
    'Farm to Table 🌾',
    'Street Food 🌮',
    'Michelin Hunter ⭐',
    'Brunch Enthusiast 🥞',
    'Craft Beer 🍺',
    'Sushi Obsessed 🍣',
    'Pizza Perfectionist 🍕',
    'BBQ Master 🔥',
    'Cheese Connoisseur 🧀',
    'Tea Ceremony 🍵',
    'Cocktail Crafter 🍸',
  ];

  const hobbiesOptions = [
    { id: 'cooking_home', label: 'Cooking at home', icon: '👨‍🍳' },
    { id: 'baking', label: 'Baking', icon: '🧁' },
    { id: 'wine_tasting', label: 'Wine tasting', icon: '🍷' },
    { id: 'craft_cocktails', label: 'Craft cocktails', icon: '🍸' },
    { id: 'food_photography', label: 'Food photography', icon: '📸' },
    { id: 'restaurant_hunting', label: 'Restaurant hunting', icon: '🔍' },
    { id: 'food_blogging', label: 'Food blogging', icon: '✍️' },
    { id: 'farmers_markets', label: 'Farmers markets', icon: '🥕' },
    { id: 'food_festivals', label: 'Food festivals', icon: '🎪' },
    { id: 'growing_vegetables', label: 'Growing vegetables', icon: '🌱' },
    { id: 'bbq_grilling', label: 'BBQ/Grilling', icon: '🔥' },
    { id: 'coffee_brewing', label: 'Coffee brewing', icon: '☕' },
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleHobby = (hobbyId: string) => {
    if (selectedHobbies.includes(hobbyId)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobbyId));
    } else {
      setSelectedHobbies([...selectedHobbies, hobbyId]);
    }
  };

  const handleComplete = async () => {
    const data = {
      foodie_profile: {
        bio,
        fun_fact: funFact,
        favorite_food: favoriteFood,
        bucket_list: bucketList,
        cooking_skill: cookingSkill,
        tags: selectedTags,
        hobbies: selectedHobbies,
      }
    };
    
    setSaving(true);
    try {
      // Save this step's data
      const stepSuccess = await saveStepData('foodie-profile', data);
      
      if (stepSuccess) {
        // Complete the entire personalization flow
        const completeSuccess = await completePersonalization();
        
        if (completeSuccess) {
          // Use React Navigation if available, otherwise fall back to onNavigate prop
          // Since this is the last personalization screen, navigate back to profile
          if (navigation && (navigation as any).navigate) {
            Alert.alert('Success', 'Your preferences have been saved!', [
              {
                text: 'OK',
                onPress: () => (navigation as any).navigate('ProfileMain', data)
              }
            ]);
          } else if (onNavigate) {
            onNavigate('onboarding-complete', data);
          }
        } else {
          Alert.alert('Error', 'Failed to complete personalization. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error completing personalization:', error);
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
      onNavigate('personalization-social');
    }
  };

  const isValid = bio.length >= 10 && funFact.length >= 10 && funFact.length <= 200 && favoriteFood.length > 0 && cookingSkill !== '' && selectedTags.length >= 3 && selectedHobbies.length >= 2;

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
      keyboardAvoiding
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <OnboardingTitle>Your Foodie Profile</OnboardingTitle>
        <Text style={styles.subtitle}>
          Almost done! Let's add some personality to your profile.
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tell us about yourself
              <Text style={styles.required}> *</Text>
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="I'm a foodie who loves trying new restaurants and meeting people who share my passion for great food..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={200}
                value={bio}
                onChangeText={setBio}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>
          </View>

          {/* Fun Fact - Conversation Starter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Share a fun fact about yourself
              <Text style={styles.required}> *</Text>
            </Text>
            <Text style={styles.funFactHint}>
              This will be a great conversation starter! Something interesting, quirky, or memorable about you.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="I once ate at a restaurant that was completely in the dark, or I can make pasta from scratch, or I've traveled to 12 countries just for the food..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={200}
                value={funFact}
                onChangeText={setFunFact}
                textAlignVertical="top"
              />
              <Text style={[
                styles.charCount,
                funFact.length < 10 && styles.charCountWarning
              ]}>
                {funFact.length}/200 {funFact.length < 10 ? '(min 10)' : ''}
              </Text>
            </View>
          </View>

          {/* Favorite Food */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Your all-time favorite dish
              <Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Grandma's lasagna, Sushi omakase, Street tacos..."
              placeholderTextColor="#9CA3AF"
              value={favoriteFood}
              onChangeText={setFavoriteFood}
              maxLength={50}
            />
          </View>

          {/* Cooking Skill */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              How's your cooking game?
              <Text style={styles.required}> *</Text>
            </Text>
            <View style={styles.skillGrid}>
              {cookingSkillOptions.map((option) => {
                const isSelected = cookingSkill === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.skillCard,
                      isSelected && styles.skillCardSelected
                    ]}
                    onPress={() => setCookingSkill(option.id)}
                  >
                    <Text style={styles.skillEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.skillText,
                      isSelected && styles.skillTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Hobbies Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Your Food-Related Hobbies
              <Text style={styles.required}> * (2+)</Text>
            </Text>
            <Text style={styles.hobbiesHint}>
              Select at least 2 hobbies that interest you
            </Text>
            <View style={styles.hobbiesGrid}>
              {hobbiesOptions.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby.id);
                return (
                  <Pressable
                    key={hobby.id}
                    style={[
                      styles.hobbyCard,
                      isSelected && styles.hobbyCardSelected
                    ]}
                    onPress={() => toggleHobby(hobby.id)}
                  >
                    <Text style={styles.hobbyIcon}>{hobby.icon}</Text>
                    <Text style={[
                      styles.hobbyText,
                      isSelected && styles.hobbyTextSelected
                    ]}>
                      {hobby.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Bucket List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Restaurant bucket list
              <Text style={styles.optional}> (optional)</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., The French Laundry, Noma, Street food in Bangkok..."
              placeholderTextColor="#9CA3AF"
              value={bucketList}
              onChangeText={setBucketList}
              maxLength={100}
            />
          </View>

          {/* Foodie Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pick your foodie tags
              <Text style={styles.required}> * (3-5)</Text>
            </Text>
            <Text style={styles.tagHint}>
              Choose {5 - selectedTags.length} more tags
            </Text>
            <View style={styles.tagsGrid}>
              {foodieTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const isDisabled = !isSelected && selectedTags.length >= 5;
                return (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                      isDisabled && styles.tagChipDisabled
                    ]}
                    onPress={() => !isDisabled && toggleTag(tag)}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.tagText,
                      isSelected && styles.tagTextSelected,
                      isDisabled && styles.tagTextDisabled
                    ]}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleComplete}
            label={saving ? "Saving..." : "Complete Profile"}
            disabled={!isValid || saving}
          />
          {!isValid && (
            <Text style={styles.helperText}>
              Please fill in all required fields
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(15),
    marginBottom: scaleHeight(10),
  },
  required: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(14),
  },
  optional: {
    color: '#9CA3AF',
    fontSize: scaleFont(12),
  },
  textAreaContainer: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    padding: scaleWidth(12),
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    minHeight: scaleHeight(100),
  },
  charCount: {
    position: 'absolute',
    bottom: scaleHeight(8),
    right: scaleWidth(12),
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
  },
  textInput: {
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
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  skillCard: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    alignItems: 'center',
    width: '47%',
    gap: scaleHeight(4),
  },
  skillCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main,
  },
  skillEmoji: {
    fontSize: scaleFont(24),
  },
  skillText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    textAlign: 'center',
  },
  skillTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  tagHint: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(10),
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  tagChip: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(14),
  },
  tagChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  tagChipDisabled: {
    opacity: 0.5,
  },
  tagText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  tagTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  tagTextDisabled: {
    color: '#D1D5DB',
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
  hobbiesHint: {
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(12),
  },
  hobbiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  hobbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    gap: scaleWidth(8),
    width: '48%',
  },
  hobbyCardSelected: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main,
  },
  hobbyIcon: {
    fontSize: scaleFont(18),
  },
  hobbyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    flex: 1,
  },
  hobbyTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  funFactHint: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
    marginBottom: scaleHeight(12),
    fontStyle: 'italic',
  },
  charCountWarning: {
    color: '#EF4444',
  },
});