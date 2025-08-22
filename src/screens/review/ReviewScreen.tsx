import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface ReviewScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

// interface RatingSection {
//   id: string;
//   title: string;
//   subtitle?: string;
//   rating: number;
// }

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ onNavigate }) => {
  const _insets = useSafeAreaInsets();

  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    food: 0,
    service: 0,
    atmosphere: 0,
    value: 0,
  });

  const [textFeedback, setTextFeedback] = useState('');
  const [recommendToFriend, setRecommendToFriend] = useState<boolean | null>(null);
  const [wouldReturnSoon, setWouldReturnSoon] = useState<boolean | null>(null);

  const handleBack = () => {
    onNavigate?.('profile');
  };

  const handleSubmit = () => {
    const reviewData = {
      ratings,
      textFeedback,
      recommendToFriend,
      wouldReturnSoon,
      timestamp: new Date().toISOString(),
    };
    // Submit review data - would send to API in production
    // For now, just navigate back with the data
    onNavigate?.('profile', reviewData);
  };

  const handleRating = (category: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const renderStars = (category: string, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => handleRating(category, star)}
            style={styles.starButton}
          >
            <Icon name="star" size={28} color={star <= currentRating ? '#FFB800' : '#E5E5E5'} />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderYesNoButtons = (value: boolean | null, onChange: (value: boolean) => void) => {
    return (
      <View style={styles.yesNoContainer}>
        <Pressable
          style={[styles.yesNoButton, value === true && styles.yesNoButtonSelected]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.yesNoText, value === true && styles.yesNoTextSelected]}>Yes</Text>
        </Pressable>
        <Pressable
          style={[styles.yesNoButton, value === false && styles.yesNoButtonSelected]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.yesNoText, value === false && styles.yesNoTextSelected]}>No</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <TopBar title="Review" showBack onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>How was your experience?</Text>
          <Text style={styles.headerSubtitle}>
            Your feedback helps us improve and match you with better dining experiences.
          </Text>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Experience</Text>
          {renderStars('overall', ratings.overall)}
        </View>

        {/* Detailed Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Each Aspect</Text>

          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Food Quality</Text>
              <Text style={styles.ratingValue}>{ratings.food > 0 ? `${ratings.food}/5` : ''}</Text>
            </View>
            {renderStars('food', ratings.food)}
          </View>

          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Service</Text>
              <Text style={styles.ratingValue}>
                {ratings.service > 0 ? `${ratings.service}/5` : ''}
              </Text>
            </View>
            {renderStars('service', ratings.service)}
          </View>

          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Atmosphere</Text>
              <Text style={styles.ratingValue}>
                {ratings.atmosphere > 0 ? `${ratings.atmosphere}/5` : ''}
              </Text>
            </View>
            {renderStars('atmosphere', ratings.atmosphere)}
          </View>

          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Value for Money</Text>
              <Text style={styles.ratingValue}>
                {ratings.value > 0 ? `${ratings.value}/5` : ''}
              </Text>
            </View>
            {renderStars('value', ratings.value)}
          </View>
        </View>

        {/* Quick Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Questions</Text>

          <View style={styles.questionItem}>
            <Text style={styles.questionText}>Would you recommend this to a friend?</Text>
            {renderYesNoButtons(recommendToFriend, setRecommendToFriend)}
          </View>

          <View style={styles.questionItem}>
            <Text style={styles.questionText}>Would you return here soon?</Text>
            {renderYesNoButtons(wouldReturnSoon, setWouldReturnSoon)}
          </View>
        </View>

        {/* Text Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about the dinner experience..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            value={textFeedback}
            onChangeText={setTextFeedback}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{textFeedback.length}/500</Text>
        </View>

        {/* Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          <Pressable style={styles.photoUploadButton}>
            <Icon name="camera" size={24} color={theme.colors.primary.main} />
            <Text style={styles.photoUploadText}>Upload Photos</Text>
          </Pressable>
        </View>

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            (!ratings.overall || !(recommendToFriend === null) || !(wouldReturnSoon === null)) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!ratings.overall}
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  characterCount: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
    textAlign: 'right',
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(24),
    fontWeight: '700' as any,
    marginBottom: scaleHeight(8),
  },
  photoUploadButton: {
    alignItems: 'center',
    backgroundColor: '#FFF9F9',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderStyle: 'dashed',
    borderWidth: 2,
    flexDirection: 'row',
    gap: scaleWidth(8),
    justifyContent: 'center',
    paddingVertical: scaleHeight(16),
  },
  photoUploadText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  questionItem: {
    marginBottom: scaleHeight(20),
  },
  questionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    marginBottom: scaleHeight(12),
  },
  ratingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  ratingItem: {
    marginBottom: scaleHeight(20),
  },
  ratingLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
  },
  ratingValue: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    padding: scaleWidth(20),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(16),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(27),
    paddingVertical: scaleHeight(16),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
  },
  submitContainer: {
    backgroundColor: theme.colors.white,
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  textInput: {
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    minHeight: scaleHeight(100),
    padding: scaleWidth(12),
    textAlignVertical: 'top',
  },
  yesNoButton: {
    alignItems: 'center',
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  yesNoButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  yesNoText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  yesNoTextSelected: {
    color: theme.colors.white,
  },
});
