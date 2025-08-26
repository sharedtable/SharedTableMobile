import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
// import { Ionicons } from '@expo/vector-icons'; // Not used currently
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PersonalizationFoodieProfileScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

export const PersonalizationFoodieProfileScreen: React.FC<PersonalizationFoodieProfileScreenProps> = ({
  onNavigate,
  currentStep = 8,
  totalSteps = 8,
}) => {
  const [bio, setBio] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [bucketList, setBucketList] = useState('');
  const [cookingSkill, setCookingSkill] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleComplete = () => {
    const data = {
      foodie_profile: {
        bio,
        favorite_food: favoriteFood,
        bucket_list: bucketList,
        cooking_skill: cookingSkill,
        tags: selectedTags,
      }
    };
    onNavigate?.('onboarding-complete', data);
  };

  const handleBack = () => {
    onNavigate?.('personalization-social');
  };

  const isValid = bio.length >= 10 && favoriteFood.length > 0 && cookingSkill !== '' && selectedTags.length >= 3;

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
            label="Complete Profile"
            disabled={!isValid}
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
});