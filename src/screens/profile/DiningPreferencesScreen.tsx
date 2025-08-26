import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PreferenceSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  screen: string;
  color: string;
  completed?: boolean;
}

const DiningPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const preferenceSections: PreferenceSection[] = [
    {
      id: 'dietary',
      title: 'Dietary Restrictions',
      subtitle: 'Allergies, vegetarian, vegan, etc.',
      icon: 'nutrition',
      screen: 'PersonalizationDietary',
      color: '#10B981',
    },
    {
      id: 'cuisine',
      title: 'Cuisine Preferences',
      subtitle: 'Your favorite types of food',
      icon: 'globe',
      screen: 'PersonalizationCuisine',
      color: '#F59E0B',
    },
    {
      id: 'dining-style',
      title: 'Dining Style',
      subtitle: 'Budget, timing, atmosphere',
      icon: 'wine',
      screen: 'PersonalizationDiningStyle',
      color: '#8B5CF6',
    },
    {
      id: 'social',
      title: 'Social Preferences',
      subtitle: 'Group size, energy level, goals',
      icon: 'people',
      screen: 'PersonalizationSocial',
      color: '#EC4899',
    },
    {
      id: 'foodie-profile',
      title: 'Foodie Profile',
      subtitle: 'About you as a food lover',
      icon: 'person',
      screen: 'PersonalizationFoodieProfile',
      color: '#3B82F6',
    },
  ];

  useEffect(() => {
    // TODO: Load completed sections from user profile
    loadCompletedSections();
  }, []);

  const loadCompletedSections = async () => {
    // TODO: Fetch from API which sections user has completed
    // For now, using mock data
    setCompletedSections(['dietary']); // Example: user has completed dietary section
  };

  const handleSectionPress = (section: PreferenceSection) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Navigate to the specific personalization screen
    (navigation as any).navigate(section.screen);
  };

  const getCompletionPercentage = () => {
    return Math.round((completedSections.length / preferenceSections.length) * 100);
  };

  const renderProgressBar = () => {
    const percentage = getCompletionPercentage();
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile Completion</Text>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${percentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressSubtext}>
          {completedSections.length === 0
            ? 'Complete your preferences for better recommendations'
            : completedSections.length === preferenceSections.length
            ? 'All preferences completed! 🎉'
            : `${preferenceSections.length - completedSections.length} sections remaining`}
        </Text>
      </View>
    );
  };

  const renderSectionCard = (section: PreferenceSection) => {
    const isCompleted = completedSections.includes(section.id);
    
    return (
      <TouchableOpacity
        key={section.id}
        style={styles.sectionCard}
        onPress={() => handleSectionPress(section)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
          <Ionicons
            name={section.icon as any}
            size={28}
            color={section.color}
          />
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          )}
        </View>
        
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          {isCompleted && (
            <Text style={styles.completedText}>Completed</Text>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dining Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProgressBar()}

        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionsHeader}>Preference Categories</Text>
          <Text style={styles.sectionsDescription}>
            Help us personalize your dining experience by sharing your preferences
          </Text>
          
          {preferenceSections.map(renderSectionCard)}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
          <Text style={styles.infoText}>
            Your preferences help us match you with the perfect dining experiences and connect you with like-minded food lovers.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            Alert.alert(
              'Reset Preferences',
              'Are you sure you want to reset all your dining preferences?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement reset functionality
                    Alert.alert('Success', 'Your preferences have been reset.');
                    setCompletedSections([]);
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="refresh" size={20} color="#EF4444" />
          <Text style={styles.resetText}>Reset All Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(40),
  },
  progressContainer: {
    backgroundColor: 'white',
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(20),
    padding: scaleWidth(20),
    borderRadius: scaleWidth(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  progressTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  progressBar: {
    height: scaleHeight(8),
    backgroundColor: '#E5E7EB',
    borderRadius: scaleWidth(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(4),
  },
  progressSubtext: {
    fontSize: scaleFont(13),
    color: '#6B7280',
    marginTop: scaleHeight(8),
  },
  sectionsContainer: {
    marginTop: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
  },
  sectionsHeader: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: scaleHeight(4),
  },
  sectionsDescription: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    marginBottom: scaleHeight(16),
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(16),
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: scaleHeight(2),
  },
  sectionSubtitle: {
    fontSize: scaleFont(13),
    color: '#6B7280',
  },
  completedText: {
    fontSize: scaleFont(12),
    color: '#10B981',
    marginTop: scaleHeight(4),
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(24),
    padding: scaleWidth(16),
    borderRadius: scaleWidth(12),
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#1E40AF',
    marginLeft: scaleWidth(12),
    lineHeight: scaleFont(18),
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(32),
    paddingVertical: scaleHeight(12),
  },
  resetText: {
    fontSize: scaleFont(14),
    color: '#EF4444',
    marginLeft: scaleWidth(8),
  },
});

export default DiningPreferencesScreen;