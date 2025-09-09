import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';

type RouteParams = {
  EventReview: {
    eventId: string;
    eventTitle: string;
    hostName: string;
  };
};

interface ReviewData {
  overall_rating: number;
  food_rating: number;
  atmosphere_rating: number;
  host_rating: number;
  value_rating: number;
  review_text: string;
  highlights: string[];
  is_public: boolean;
}

const EventReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventReview'>>();
  const { eventId, eventTitle, hostName } = route.params;

  const [reviewData, setReviewData] = useState<ReviewData>({
    overall_rating: 0,
    food_rating: 0,
    atmosphere_rating: 0,
    host_rating: 0,
    value_rating: 0,
    review_text: '',
    highlights: [],
    is_public: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const highlights = [
    'Great conversation',
    'Amazing food',
    'Perfect location',
    'Wonderful host',
    'Great value',
    'Fun atmosphere',
    'Diverse group',
    'Learned a lot',
    'Would repeat',
    'Hidden gem',
    'Authentic experience',
    'Exceeded expectations',
  ];

  const ratingCategories = [
    { key: 'overall_rating', label: 'Overall Experience', icon: 'star', required: true },
    { key: 'food_rating', label: 'Food Quality', icon: 'restaurant', required: false },
    { key: 'atmosphere_rating', label: 'Atmosphere', icon: 'happy', required: false },
    { key: 'host_rating', label: 'Host', icon: 'person', required: false },
    { key: 'value_rating', label: 'Value for Money', icon: 'cash', required: false },
  ];

  const setRating = (category: keyof ReviewData, rating: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setReviewData(prev => ({
      ...prev,
      [category]: prev[category] === rating ? 0 : rating,
    }));
  };

  const toggleHighlight = (highlight: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setReviewData(prev => ({
      ...prev,
      highlights: prev.highlights.includes(highlight)
        ? prev.highlights.filter(h => h !== highlight)
        : [...prev.highlights, highlight],
    }));
  };

  const handleSubmit = async () => {
    if (reviewData.overall_rating === 0) {
      Alert.alert('Missing Rating', 'Please provide an overall rating.');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSubmitting(true);
    try {
      const response = await api.createEventReview(eventId, {
        overall_rating: reviewData.overall_rating,
        food_rating: reviewData.food_rating || undefined,
        atmosphere_rating: reviewData.atmosphere_rating || undefined,
        host_rating: reviewData.host_rating || undefined,
        value_rating: reviewData.value_rating || undefined,
        review_text: reviewData.review_text.trim(),
        highlights: reviewData.highlights,
        is_public: reviewData.is_public,
      });

      if (response.success) {
        Alert.alert(
          'Review Submitted!',
          'Thank you for sharing your experience.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to submit review');
      }
    } catch {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category: keyof ReviewData) => {
    const rating = reviewData[category] as number;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(category, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={28}
              color={star <= rating ? '#F59E0B' : theme.colors.gray['300']}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Event</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || reviewData.overall_rating === 0}
          >
            <Text style={[
              styles.submitText,
              (submitting || reviewData.overall_rating === 0) && styles.submitTextDisabled
            ]}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
            <Text style={styles.hostName}>Hosted by {hostName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            
            {ratingCategories.map((category) => (
              <View key={category.key} style={styles.ratingItem}>
                <View style={styles.ratingLabel}>
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color="#6B7280"
                    style={styles.ratingIcon}
                  />
                  <Text style={styles.ratingText}>
                    {category.label}
                    {category.required && <Text style={styles.required}> *</Text>}
                  </Text>
                </View>
                {renderStars(category.key as keyof ReviewData)}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Made It Special?</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            
            <View style={styles.highlightsGrid}>
              {highlights.map((highlight) => (
                <TouchableOpacity
                  key={highlight}
                  style={[
                    styles.highlightChip,
                    reviewData.highlights.includes(highlight) && styles.highlightChipSelected,
                  ]}
                  onPress={() => toggleHighlight(highlight)}
                >
                  <Text style={[
                    styles.highlightText,
                    reviewData.highlights.includes(highlight) && styles.highlightTextSelected,
                  ]}>
                    {highlight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share Your Experience</Text>
            <Text style={styles.sectionSubtitle}>Optional - Help others know what to expect</Text>
            
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about your experience... What did you enjoy? Any tips for future attendees?"
              value={reviewData.review_text}
              onChangeText={(text) => setReviewData(prev => ({ ...prev, review_text: text }))}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {reviewData.review_text.length}/1000
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.privacyOption}>
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>Public Review</Text>
                <Text style={styles.privacyDesc}>
                  Your review will be visible to all users
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  reviewData.is_public && styles.toggleActive,
                ]}
                onPress={() => setReviewData(prev => ({ ...prev, is_public: !prev.is_public }))}
              >
                <View style={[
                  styles.toggleThumb,
                  reviewData.is_public && styles.toggleThumbActive,
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
  },
  submitText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  submitTextDisabled: {
    color: theme.colors.gray['400'],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
  },
  eventInfo: {
    alignItems: 'center',
    paddingVertical: scaleHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  eventTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: theme.colors.gray['900'],
    textAlign: 'center',
  },
  hostName: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(4),
  },
  section: {
    paddingVertical: scaleHeight(24),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
    marginBottom: scaleHeight(4),
  },
  sectionSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginBottom: scaleHeight(16),
  },
  ratingItem: {
    marginBottom: scaleHeight(20),
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  ratingIcon: {
    marginRight: scaleWidth(8),
  },
  ratingText: {
    fontSize: scaleFont(15),
    color: theme.colors.gray['700'],
  },
  required: {
    color: theme.colors.error['500'],
  },
  starsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  starButton: {
    padding: scaleWidth(4),
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  highlightChip: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.gray['100'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: scaleHeight(8),
  },
  highlightChipSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  highlightText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
  },
  highlightTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.gray['300'],
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    fontSize: scaleFont(15),
    color: theme.colors.gray['900'],
    minHeight: scaleHeight(120),
  },
  charCount: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['400'],
    marginTop: scaleHeight(8),
    textAlign: 'right',
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: theme.colors.gray['900'],
  },
  privacyDesc: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  toggle: {
    width: scaleWidth(52),
    height: scaleHeight(28),
    borderRadius: scaleWidth(14),
    backgroundColor: theme.colors.gray['300'],
    padding: scaleWidth(2),
  },
  toggleActive: {
    backgroundColor: theme.colors.primary.main,
  },
  toggleThumb: {
    width: scaleHeight(24),
    height: scaleHeight(24),
    borderRadius: scaleHeight(12),
    backgroundColor: theme.colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: scaleWidth(24) }],
  },
  bottomSpacer: {
    height: scaleHeight(40),
  },
});

export default EventReviewScreen;