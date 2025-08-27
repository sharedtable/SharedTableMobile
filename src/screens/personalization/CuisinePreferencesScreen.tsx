import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePersonalizationFlow } from '@/hooks/usePersonalizationFlow';

interface PersonalizationCuisineScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
  currentStep?: number;
  totalSteps?: number;
}

const cuisineCategories = [
  {
    category: 'Asian',
    cuisines: [
      { id: 'japanese', label: '🍱 Japanese', emoji: '🍱' },
      { id: 'chinese', label: '🥟 Chinese', emoji: '🥟' },
      { id: 'korean', label: '🍖 Korean', emoji: '🍖' },
      { id: 'thai', label: '🍜 Thai', emoji: '🍜' },
      { id: 'vietnamese', label: '🍲 Vietnamese', emoji: '🍲' },
      { id: 'indian', label: '🍛 Indian', emoji: '🍛' },
    ],
  },
  {
    category: 'European',
    cuisines: [
      { id: 'italian', label: '🍝 Italian', emoji: '🍝' },
      { id: 'french', label: '🥐 French', emoji: '🥐' },
      { id: 'spanish', label: '🥘 Spanish', emoji: '🥘' },
      { id: 'greek', label: '🥙 Greek', emoji: '🥙' },
      { id: 'german', label: '🥨 German', emoji: '🥨' },
    ],
  },
  {
    category: 'Americas',
    cuisines: [
      { id: 'american', label: '🍔 American', emoji: '🍔' },
      { id: 'mexican', label: '🌮 Mexican', emoji: '🌮' },
      { id: 'brazilian', label: '🥩 Brazilian', emoji: '🥩' },
      { id: 'peruvian', label: '🐟 Peruvian', emoji: '🐟' },
      { id: 'caribbean', label: '🏝️ Caribbean', emoji: '🏝️' },
    ],
  },
  {
    category: 'Middle Eastern & African',
    cuisines: [
      { id: 'middle_eastern', label: '🧆 Middle Eastern', emoji: '🧆' },
      { id: 'turkish', label: '🍢 Turkish', emoji: '🍢' },
      { id: 'moroccan', label: '🫓 Moroccan', emoji: '🫓' },
      { id: 'ethiopian', label: '🍛 Ethiopian', emoji: '🍛' },
    ],
  },
];

export const CuisinePreferencesScreen: React.FC<PersonalizationCuisineScreenProps> = ({
  onNavigate,
  currentStep = 2,  // Second personalization step
  totalSteps = 6,   // Total personalization steps
}) => {
  const navigation = useNavigation();
  const { saveStepData } = usePersonalizationFlow();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [loveLevel, setLoveLevel] = useState<Record<string, 'like' | 'love'>>({});
  const [avoidCuisines, setAvoidCuisines] = useState<string[]>([]);
  const [_saving, setSaving] = useState(false);

  const handleCuisinePress = (cuisineId: string) => {
    if (selectedCuisines.includes(cuisineId)) {
      // Cycle through: not selected -> like -> love -> not selected
      if (loveLevel[cuisineId] === 'like') {
        setLoveLevel({ ...loveLevel, [cuisineId]: 'love' });
      } else if (loveLevel[cuisineId] === 'love') {
        setSelectedCuisines(selectedCuisines.filter(id => id !== cuisineId));
        const newLoveLevel = { ...loveLevel };
        delete newLoveLevel[cuisineId];
        setLoveLevel(newLoveLevel);
      }
    } else {
      setSelectedCuisines([...selectedCuisines, cuisineId]);
      setLoveLevel({ ...loveLevel, [cuisineId]: 'like' });
    }
  };

  const handleNext = async () => {
    const data = { 
      cuisine_preferences: selectedCuisines,
      cuisine_love_levels: loveLevel,
      cuisine_avoid: avoidCuisines
    };
    
    setSaving(true);
    try {
      const success = await saveStepData('cuisine', data);
      
      if (success) {
        // Use React Navigation if available, otherwise fall back to onNavigate prop
        if (navigation && (navigation as any).navigate) {
          (navigation as any).navigate('PersonalizationDiningStyle', data);
        } else if (onNavigate) {
          onNavigate('personalization-dining-style', data);
        }
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving cuisine preferences:', error);
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
      onNavigate('personalization-dietary');
    }
  };

  const getCuisineStyle = (cuisineId: string) => {
    if (!selectedCuisines.includes(cuisineId)) {
      return styles.cuisineCard;
    }
    
    if (loveLevel[cuisineId] === 'love') {
      return [styles.cuisineCard, styles.cuisineCardLove];
    }
    
    return [styles.cuisineCard, styles.cuisineCardLike];
  };

  const getCuisineTextStyle = (cuisineId: string) => {
    if (!selectedCuisines.includes(cuisineId)) {
      return styles.cuisineText;
    }
    
    return [styles.cuisineText, styles.cuisineTextSelected];
  };

  const handleAvoidCuisinePress = (cuisineId: string) => {
    if (avoidCuisines.includes(cuisineId)) {
      setAvoidCuisines(avoidCuisines.filter(id => id !== cuisineId));
    } else {
      setAvoidCuisines([...avoidCuisines, cuisineId]);
    }
  };

  const getAvoidCuisineStyle = (cuisineId: string) => {
    if (avoidCuisines.includes(cuisineId)) {
      return [styles.cuisineCard, styles.cuisineCardAvoid];
    }
    return styles.cuisineCard;
  };

  const getAvoidCuisineTextStyle = (cuisineId: string) => {
    if (avoidCuisines.includes(cuisineId)) {
      return [styles.cuisineText, styles.cuisineTextAvoid];
    }
    return styles.cuisineText;
  };

  return (
    <OnboardingLayout
      onBack={handleBack}
      currentStep={currentStep}
      totalSteps={totalSteps}
    >
      <View style={styles.container}>
        <OnboardingTitle>Cuisine Preferences</OnboardingTitle>
        <Text style={styles.subtitle}>
          Let us know your favorite cuisines and any you prefer to avoid for better event recommendations.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Cuisines You Love</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            Tap once to like, twice to love!
          </Text>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendLike]} />
            <Text style={styles.legendText}>Like</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendLove]} />
            <Text style={styles.legendText}>Love</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {cuisineCategories.map((category) => (
            <View key={category.category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              <View style={styles.cuisineGrid}>
                {category.cuisines.map((cuisine) => {
                  const level = loveLevel[cuisine.id];
                  return (
                    <Pressable
                      key={cuisine.id}
                      style={getCuisineStyle(cuisine.id)}
                      onPress={() => handleCuisinePress(cuisine.id)}
                    >
                      <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                      <Text style={getCuisineTextStyle(cuisine.id)}>
                        {cuisine.label.split(' ')[1]}
                      </Text>
                      {level && (
                        <View style={[
                          styles.indicator,
                          level === 'love' ? styles.indicatorLove : styles.indicatorLike
                        ]}>
                          <Text style={styles.indicatorText}>
                            {level === 'love' ? '❤️' : '👍'}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Cuisines to Avoid Section */}
          <View style={styles.avoidSection}>
            <Text style={styles.avoidTitle}>Cuisines to Avoid</Text>
            <Text style={styles.avoidSubtitle}>
              Select any cuisines you prefer to avoid (optional)
            </Text>
            
            {cuisineCategories.map((category) => (
              <View key={`avoid-${category.category}`} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                <View style={styles.cuisineGrid}>
                  {category.cuisines.map((cuisine) => {
                    const isAvoided = avoidCuisines.includes(cuisine.id);
                    return (
                      <Pressable
                        key={`avoid-${cuisine.id}`}
                        style={getAvoidCuisineStyle(cuisine.id)}
                        onPress={() => handleAvoidCuisinePress(cuisine.id)}
                      >
                        <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                        <Text style={getAvoidCuisineTextStyle(cuisine.id)}>
                          {cuisine.label.split(' ')[1]}
                        </Text>
                        {isAvoided && (
                          <View style={styles.avoidIndicator}>
                            <Text style={styles.avoidIndicatorText}>✕</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <OnboardingButton
            onPress={handleNext}
            label={`Continue (${selectedCuisines.length} favorites${avoidCuisines.length > 0 ? `, ${avoidCuisines.length} avoided` : ''})`}
            disabled={selectedCuisines.length < 3}
          />
          {selectedCuisines.length < 3 && (
            <Text style={styles.helperText}>
              Select at least 3 cuisines you enjoy
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
    marginBottom: scaleHeight(16),
    marginTop: scaleHeight(8),
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(20),
    marginBottom: scaleHeight(20),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  legendDot: {
    width: scaleWidth(12),
    height: scaleWidth(12),
    borderRadius: scaleWidth(6),
  },
  legendLike: {
    backgroundColor: 'rgba(226, 72, 73, 0.3)',
  },
  legendLove: {
    backgroundColor: theme.colors.primary.main,
  },
  legendText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(20),
  },
  categoryContainer: {
    marginBottom: scaleHeight(24),
  },
  categoryTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(12),
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  cuisineCard: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    alignItems: 'center',
    width: scaleWidth(100),
    position: 'relative',
  },
  cuisineCardLike: {
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: 'rgba(226, 72, 73, 0.5)',
  },
  cuisineCardLove: {
    backgroundColor: 'rgba(226, 72, 73, 0.2)',
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
  },
  cuisineEmoji: {
    fontSize: scaleFont(28),
    marginBottom: scaleHeight(4),
  },
  cuisineText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  cuisineTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: scaleHeight(4),
    right: scaleWidth(4),
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLike: {
    backgroundColor: 'rgba(226, 72, 73, 0.2)',
  },
  indicatorLove: {
    backgroundColor: theme.colors.primary.main,
  },
  indicatorText: {
    fontSize: scaleFont(10),
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
  sectionHeader: {
    marginBottom: scaleHeight(12),
  },
  sectionHeaderTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(18),
    marginBottom: scaleHeight(4),
  },
  sectionHeaderSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  avoidSection: {
    marginTop: scaleHeight(32),
    paddingTop: scaleHeight(24),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avoidTitle: {
    color: '#EF4444',
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: scaleFont(18),
    marginBottom: scaleHeight(6),
  },
  avoidSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(20),
  },
  cuisineCardAvoid: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  cuisineTextAvoid: {
    color: '#EF4444',
    fontWeight: '600',
  },
  avoidIndicator: {
    position: 'absolute',
    top: scaleHeight(4),
    right: scaleWidth(4),
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avoidIndicatorText: {
    color: 'white',
    fontSize: scaleFont(10),
    fontWeight: 'bold',
  },
});