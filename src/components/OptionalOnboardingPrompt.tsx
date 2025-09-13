import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { OptionalOnboardingStackParamList } from '@/navigation/OptionalOnboardingNavigator';

import { useAuthStore, OnboardingStatus } from '@/store/authStore';
import { OnboardingAPI } from '@/services/api/onboardingApi';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

type NavigationType = NativeStackNavigationProp<RootStackParamList>;

const PROMPT_DISMISS_KEY = 'optional_onboarding_prompt_dismissed';
const PROMPT_DISMISS_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface ResumeInfo {
  success: boolean;
  canResume: boolean;
  completedSteps: string[];
  nextScreen?: string;
  percentComplete?: number;
  message?: string;
}

export const OptionalOnboardingPrompt: React.FC = () => {
  const styles = getStyles();
  const navigation = useNavigation<NavigationType>();
  const { onboardingStatus } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [isCheckingResume, setIsCheckingResume] = useState(false);

  // Helper function to clear dismiss key (for debugging)
  const clearDismissKey = async () => {
    try {
      await SecureStore.deleteItemAsync(PROMPT_DISMISS_KEY);
      console.log('🧹 [OptionalOnboardingPrompt] Cleared dismiss key');
    } catch (error) {
      console.error('Error clearing dismiss key:', error);
    }
  };

  const checkShouldShowPrompt = useCallback(async () => {
    console.log('🔍 [OptionalOnboardingPrompt] Checking prompt - Status:', onboardingStatus);
    console.log('🔍 [OptionalOnboardingPrompt] Status type:', typeof onboardingStatus);
    console.log('🔍 [OptionalOnboardingPrompt] MANDATORY_COMPLETE value:', OnboardingStatus.MANDATORY_COMPLETE);
    console.log('🔍 [OptionalOnboardingPrompt] Status comparison:', onboardingStatus === OnboardingStatus.MANDATORY_COMPLETE);
    
    // Show prompt only for users who completed mandatory but not optional onboarding
    const shouldShow = 
      onboardingStatus === OnboardingStatus.MANDATORY_COMPLETE;
    
    console.log('🔍 [OptionalOnboardingPrompt] Should show prompt:', shouldShow);
    
    if (!shouldShow) {
      console.log('ℹ️ [OptionalOnboardingPrompt] Not showing - status not eligible');
      setShowPrompt(false);
      return;
    }

    try {
      // Check if user has dismissed the prompt recently
      const dismissedData = await SecureStore.getItemAsync(PROMPT_DISMISS_KEY);
      console.log('🔍 [OptionalOnboardingPrompt] Dismissed data:', dismissedData);
      
      if (dismissedData) {
        const parsed = JSON.parse(dismissedData);
        const timeSinceDismiss = Date.now() - parsed.timestamp;
        console.log('🔍 [OptionalOnboardingPrompt] Time since dismiss:', timeSinceDismiss);
        
        if (timeSinceDismiss < PROMPT_DISMISS_DURATION) {
          console.log('ℹ️ [OptionalOnboardingPrompt] Not showing - recently dismissed');
          setShowPrompt(false);
          return;
        }
      }

      // Check if user has incomplete onboarding to resume
      setIsCheckingResume(true);
      try {
        const info = await OnboardingAPI.getResumeInfo();
        console.log('🔍 [OptionalOnboardingPrompt] Resume info:', info);
        setResumeInfo(info);
      } catch (error) {
        console.error('[OptionalOnboardingPrompt] Error fetching resume info:', error);
      } finally {
        setIsCheckingResume(false);
      }

      // Show prompt after a delay to not be too intrusive
      console.log('🔍 [OptionalOnboardingPrompt] Will show prompt in 3 seconds');
      const timeoutId = setTimeout(() => {
        console.log('✅ [OptionalOnboardingPrompt] Timeout fired - setting modal visible');
        console.log('✅ [OptionalOnboardingPrompt] Setting showPrompt to true');
        console.log('✅ [OptionalOnboardingPrompt] Setting isModalVisible to true');
        setShowPrompt(true);
        setIsModalVisible(true);
      }, 3000); // 3 seconds after landing on home
      
      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('[OptionalOnboardingPrompt] Error checking prompt status:', error);
    }
  }, [onboardingStatus]);

  useEffect(() => {
    console.log('🚀 [OptionalOnboardingPrompt] Component mounted/updated');
    console.log('🚀 [OptionalOnboardingPrompt] Current onboardingStatus:', onboardingStatus);
    
    // Clear dismiss key for testing (remove this in production)
    if (onboardingStatus === OnboardingStatus.MANDATORY_COMPLETE) {
      clearDismissKey();
    }
    
    checkShouldShowPrompt();
  }, [onboardingStatus, checkShouldShowPrompt]);

  const handleCompleteProfile = () => {
    setIsModalVisible(false);
    
    // Navigate to the appropriate screen based on resume info
    if (resumeInfo?.canResume && resumeInfo?.nextScreen && resumeInfo.nextScreen !== 'completed') {
      // User has incomplete onboarding - navigate to where they left off
      console.log('🚀 [OptionalOnboardingPrompt] Resuming at:', resumeInfo.nextScreen);
      
      // Map the screen names from backend to frontend navigation screens
      const screenMap: Record<string, string> = {
        'onboarding-education': 'Education',
        'onboarding-work': 'Work',
        'onboarding-ethnicity': 'Ethnicity',
        'onboarding-personality': 'Personality',
        'onboarding-lifestyle': 'Lifestyle',
        'onboarding-food-preferences-1': 'FoodPreferences1',
        'onboarding-food-preferences-2': 'FoodPreferences2',
        'onboarding-food-preferences-3': 'FoodPreferences3',
        'onboarding-food-preferences-4': 'FoodPreferences4',
        'onboarding-interests': 'Interests',
        'onboarding-hobbies': 'Hobbies',
        'onboarding-hoping-to-meet': 'HopingToMeet',
        'onboarding-interesting-fact': 'InterestingFact',
      };
      
      const screenName = (screenMap[resumeInfo.nextScreen] || 'Education') as keyof OptionalOnboardingStackParamList;
      
      navigation.navigate('OptionalOnboarding', {
        screen: screenName
      });
    } else {
      // Start from the beginning
      navigation.navigate('OptionalOnboarding', {
        screen: 'Education'
      });
    }
  };

  const handleRemindLater = async () => {
    setIsModalVisible(false);
    
    // Store dismissal timestamp
    try {
      await SecureStore.setItemAsync(
        PROMPT_DISMISS_KEY,
        JSON.stringify({ timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Error saving dismissal:', error);
    }
  };


  console.log('🎭 [OptionalOnboardingPrompt] Render check - showPrompt:', showPrompt, 'isModalVisible:', isModalVisible);
  
  if (!showPrompt || !isModalVisible) {
    console.log('🎭 [OptionalOnboardingPrompt] Not rendering modal');
    return null;
  }

  console.log('🎭 [OptionalOnboardingPrompt] Rendering modal!');
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✨</Text>
          </View>
          
          <Text style={styles.title}>
            {(() => {
              if (resumeInfo?.canResume) return 'Continue Your Profile';
              if (onboardingStatus === OnboardingStatus.MANDATORY_COMPLETE) return 'Complete Your Profile';
              return 'Set Your Dining Preferences';
            })()}
          </Text>
          
          <Text style={styles.description}>
            {(() => {
              if (resumeInfo?.canResume) return resumeInfo.message;
              if (onboardingStatus === OnboardingStatus.MANDATORY_COMPLETE) {
                return 'Answer a few optional questions to help us find your perfect dining matches! It only takes 3-5 minutes.';
              }
              return 'Tell us about your dining preferences to get personalized restaurant recommendations and better matches.';
            })()}
          </Text>

          {resumeInfo?.canResume && resumeInfo.percentComplete != null && resumeInfo.percentComplete > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${resumeInfo.percentComplete ?? 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {resumeInfo.percentComplete ?? 0}% Complete
              </Text>
            </View>
          )}

          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>🎯 Better matched dining partners</Text>
            <Text style={styles.benefitItem}>🍽️ Personalized restaurant recommendations</Text>
            <Text style={styles.benefitItem}>👥 Connect with like-minded foodies</Text>
          </View>

          <Pressable 
            style={styles.primaryButton}
            onPress={handleCompleteProfile}
            disabled={isCheckingResume}
          >
            {isCheckingResume ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {resumeInfo?.canResume ? 'Continue Profile' : 'Complete Profile'}
              </Text>
            )}
          </Pressable>

          <Pressable 
            style={styles.secondaryButton}
            onPress={handleRemindLater}
          >
            <Text style={styles.secondaryButtonText}>Remind Me Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

/* eslint-disable react-native/no-unused-styles */
const getStyles = () => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(20),
    padding: scaleWidth(24),
    alignItems: 'center',
    width: '100%',
    maxWidth: scaleWidth(340),
  },
  iconContainer: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  icon: {
    fontSize: scaleFont(30),
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
    fontFamily: theme.typography.fontFamily.heading,
  },
  description: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: scaleHeight(16),
    lineHeight: scaleFont(20),
    fontFamily: theme.typography.fontFamily.body,
  },
  benefitsList: {
    width: '100%',
    marginBottom: scaleHeight(20),
  },
  benefitItem: {
    fontSize: scaleFont(13),
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
    fontFamily: theme.typography.fontFamily.body,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(32),
    borderRadius: scaleWidth(12),
    width: '100%',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.heading,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.paper,
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(32),
    borderRadius: scaleWidth(12),
    width: '100%',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.body,
  },
  progressContainer: {
    width: '100%',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
  },
  progressBar: {
    width: '100%',
    height: scaleHeight(6),
    backgroundColor: theme.colors.background.paper,
    borderRadius: scaleWidth(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(3),
  },
  progressText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(4),
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
});