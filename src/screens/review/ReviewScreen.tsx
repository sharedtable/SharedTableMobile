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
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';

interface ReviewScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

interface RatingSection {
  id: string;
  title: string;
  subtitle?: string;
  rating: number;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  
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
    console.log('Submitting review:', reviewData);
    onNavigate?.('profile');
  };
  
  const handleRating = (category: string, rating: number) => {
    setRatings(prev => ({
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
            <Icon
              name="star"
              size={28}
              color={star <= currentRating ? '#FFB800' : '#E5E5E5'}
            />
          </Pressable>
        ))}
      </View>
    );
  };
  
  const renderYesNoButtons = (
    value: boolean | null,
    onChange: (value: boolean) => void
  ) => {
    return (
      <View style={styles.yesNoContainer}>
        <Pressable
          style={[
            styles.yesNoButton,
            value === true && styles.yesNoButtonSelected,
          ]}
          onPress={() => onChange(true)}
        >
          <Text style={[
            styles.yesNoText,
            value === true && styles.yesNoTextSelected,
          ]}>
            Yes
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.yesNoButton,
            value === false && styles.yesNoButtonSelected,
          ]}
          onPress={() => onChange(false)}
        >
          <Text style={[
            styles.yesNoText,
            value === false && styles.yesNoTextSelected,
          ]}>
            No
          </Text>
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
      <TopBar
        title="Review"
        showBack
        onBack={handleBack}
      />
      
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
              <Text style={styles.ratingValue}>{ratings.service > 0 ? `${ratings.service}/5` : ''}</Text>
            </View>
            {renderStars('service', ratings.service)}
          </View>
          
          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Atmosphere</Text>
              <Text style={styles.ratingValue}>{ratings.atmosphere > 0 ? `${ratings.atmosphere}/5` : ''}</Text>
            </View>
            {renderStars('atmosphere', ratings.atmosphere)}
          </View>
          
          <View style={styles.ratingItem}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Value for Money</Text>
              <Text style={styles.ratingValue}>{ratings.value > 0 ? `${ratings.value}/5` : ''}</Text>
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
          <Text style={styles.characterCount}>
            {textFeedback.length}/500
          </Text>
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
            (!ratings.overall || !recommendToFriend === null || !wouldReturnSoon === null) && styles.submitButtonDisabled,
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
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
    marginBottom: scaleHeight(16),
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: scaleHeight(8),
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(20),
  },
  section: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(16),
    borderRadius: scaleWidth(27),
    padding: scaleWidth(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(16),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  ratingItem: {
    marginBottom: scaleHeight(20),
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  ratingLabel: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  ratingValue: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  questionItem: {
    marginBottom: scaleHeight(20),
  },
  questionText: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(12),
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  yesNoText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  yesNoTextSelected: {
    color: theme.colors.white,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    minHeight: scaleHeight(100),
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'right',
    marginTop: scaleHeight(4),
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.main,
    backgroundColor: '#FFF9F9',
  },
  photoUploadText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
  submitContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(27),
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
});