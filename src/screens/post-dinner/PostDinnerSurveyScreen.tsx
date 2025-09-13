import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type PostDinnerSurveyParams = {
  bookingId: string;
  dinnerId: string;
};

type RootStackParamList = {
  PostDinnerSurvey: PostDinnerSurveyParams;
  Home: undefined;
};

const PostDinnerSurveyScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostDinnerSurvey'>>();
  const { bookingId, dinnerId } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    restaurant: 0,
    conversation: 0,
    chemistry: 0,
    overall: 0,
  });
  const [feedback, setFeedback] = useState('');
  const [_matches, _setMatches] = useState<string[]>([]);

  const handleRating = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (Object.values(ratings).some(r => r === 0)) {
      Alert.alert('Please Rate', 'Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitPostDinnerSurvey({
        bookingId,
        dinnerId,
        ratings,
        feedback,
        matches: _matches,
      });

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. You earned 50 points! 🎉',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (_error) {
      Alert.alert('Error', 'Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingId, dinnerId, ratings, feedback, _matches, navigation]);

  const renderStarRating = (category: keyof typeof ratings) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(category, star)}
            style={styles.starButton}
          >
            <Icon
              name={star <= ratings[category] ? 'star' : 'star-outline'}
              size={scaleWidth(28)}
              color={star <= ratings[category] ? theme.colors.primary.main : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={scaleWidth(24)} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Dinner Survey</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Icon name="restaurant" size={scaleWidth(48)} color={theme.colors.primary.main} />
          <Text style={styles.introTitle}>How was your dinner?</Text>
          <Text style={styles.introText}>
            Your feedback helps us create better experiences and match you with amazing people!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Restaurant & Food</Text>
            {renderStarRating('restaurant')}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Conversation Quality</Text>
            {renderStarRating('conversation')}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Group Chemistry</Text>
            {renderStarRating('chemistry')}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Overall Experience</Text>
            {renderStarRating('overall')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Feedback (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about the dinner..."
            placeholderTextColor={theme.colors.text.secondary}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.pointsCard}>
          <Icon name="star" size={scaleWidth(24)} color={theme.colors.warning.main} />
          <Text style={styles.pointsText}>
            Complete this survey to earn <Text style={styles.pointsHighlight}>50 points!</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: scaleWidth(40),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(40),
  },
  introCard: {
    alignItems: 'center',
    paddingVertical: scaleHeight(30),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: theme.colors.primary[50],
    borderRadius: scaleWidth(16),
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(30),
  },
  introTitle: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(8),
  },
  introText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(20),
  },
  section: {
    marginBottom: scaleHeight(30),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(20),
  },
  ratingItem: {
    marginBottom: scaleHeight(24),
  },
  ratingLabel: {
    fontSize: scaleFont(15),
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(12),
  },
  starContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
    minHeight: scaleHeight(100),
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: theme.colors.warning[50],
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(24),
  },
  pointsText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
  },
  pointsHighlight: {
    fontWeight: 'bold',
    color: theme.colors.warning.main,
  },
  submitButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
  },
  skipButton: {
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default PostDinnerSurveyScreen;