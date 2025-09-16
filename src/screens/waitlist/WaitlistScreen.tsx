import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useUserData } from '@/hooks/useUserData';
import { api } from '@/services/api';
import { getCodeDescription } from '@/utils/generatePrestigeCode';
import { OnboardingStatus, useAuthStore } from '@/store/authStore';

export const WaitlistScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout } = usePrivyAuth();
  const { userData, refetch } = useUserData();
  const { setOnboardingStatus, setNeedsOnboarding } = useAuthStore();
  
  const [_loading, _setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);

  useEffect(() => {
    checkProfileStatus();
  }, [userData]);

  const checkProfileStatus = () => {
    // Use real onboarding status from user data
    const status = userData?.onboarding_status as OnboardingStatus;
    
    // Calculate progress based on onboarding status
    let progress = 0;
    let isComplete = false;
    
    switch (status) {
      case OnboardingStatus.NOT_STARTED:
      case 'not_started':
      case null:
      case undefined:
        progress = 0;
        isComplete = false;
        break;
      case OnboardingStatus.MANDATORY_COMPLETE:
      case 'mandatory_complete':
        progress = 60; // Mandatory fields complete (name, birthday, gender)
        isComplete = false;
        break;
      case OnboardingStatus.OPTIONAL_COMPLETE:
      case 'optional_complete':
        progress = 80; // Optional profile complete
        isComplete = false;
        break;
      case OnboardingStatus.FULLY_COMPLETE:
      case 'fully_complete':
        progress = 100; // All onboarding complete
        isComplete = true;
        break;
      default: {
        // Fallback: calculate from individual fields if status is unknown
        let completedFields = 0;
        const totalFields = 5;
        
        if (userData?.first_name) completedFields++;
        if (userData?.last_name) completedFields++;
        if (userData?.display_name) completedFields++;
        if (userData?.gender) completedFields++;
        if (userData?.birthday) completedFields++;
        
        progress = (completedFields / totalFields) * 100;
        isComplete = completedFields === totalFields;
      }
    }
    
    setProfileProgress(progress);
    setHasCompletedProfile(isComplete);
    
    // Check if user has access
    // The RootNavigator will handle navigation based on access_granted status
    // so we don't need to manually navigate here
  };

  const [codeError, setCodeError] = useState('');

  const handleInviteCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setCodeError('Please enter an invitation code');
      return;
    }

    setSubmittingCode(true);
    setCodeError('');
    
    try {
      const response = await api.post('/waitlist/validate-code', {
        code: inviteCode.trim().toUpperCase(),
      });

      if (response.success) {
        // Get the code description for a personalized message
        const codeType = getCodeDescription(inviteCode.trim().toUpperCase());
        
        Alert.alert(
          'Welcome to Fare',
          `Your ${codeType} invitation has been accepted. Welcome to our exclusive dining community.`,
          [
            {
              text: 'Begin',
              onPress: async () => {
                // Refresh user data to get the updated access_granted and onboarding_status
                const updatedUserData = await refetch();
                
                // Update the auth store with the correct onboarding status
                if (updatedUserData) {
                  const status = updatedUserData.onboarding_status;
                  
                  // Map database status to OnboardingStatus enum and update auth store
                  if (status === 'not_started' || !status) {
                    await setOnboardingStatus(OnboardingStatus.NOT_STARTED);
                    await setNeedsOnboarding(true);
                    // Navigate to onboarding
                    navigation.navigate('Onboarding' as never);
                  } else if (status === 'mandatory_complete') {
                    await setOnboardingStatus(OnboardingStatus.MANDATORY_COMPLETE);
                    await setNeedsOnboarding(false);
                    // User is still on waitlist - no navigation needed, they'll stay on waitlist
                  } else if (status === 'optional_complete') {
                    await setOnboardingStatus(OnboardingStatus.OPTIONAL_COMPLETE);
                    await setNeedsOnboarding(false);
                    // User is still on waitlist - no navigation needed, they'll stay on waitlist
                  } else if (status === 'fully_complete') {
                    await setOnboardingStatus(OnboardingStatus.FULLY_COMPLETE);
                    await setNeedsOnboarding(false);
                    // User is still on waitlist - no navigation needed, they'll stay on waitlist
                  } else {
                    // Default to onboarding if status is unclear
                    await setOnboardingStatus(OnboardingStatus.NOT_STARTED);
                    await setNeedsOnboarding(true);
                    navigation.navigate('Onboarding' as never);
                  }
                } else {
                  // If no user data, navigate to onboarding by default
                  await setNeedsOnboarding(true);
                  navigation.navigate('Onboarding' as never);
                }
                
                setInviteCode('');
              },
            },
          ]
        );
        setInviteCode('');
      } else {
        // Show inline error message instead of alert
        setCodeError('Invalid or already used code');
      }
    } catch (error: any) {
      console.log('Invitation code validation error:', error);
      // Show more specific error messages
      if (error?.response?.data?.error) {
        setCodeError(error.response.data.error);
      } else if (error?.message?.includes('network')) {
        setCodeError('Network error. Please try again.');
      } else {
        setCodeError('Invalid or already used code');
      }
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleCompleteProfile = () => {
    // Navigate to onboarding to complete profile
    navigation.navigate('Onboarding' as never);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logout Button */}
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="exit-outline" size={24} color={theme.colors.text.secondary} />
          </Pressable>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.logo}>FARE</Text>
            <Text style={styles.title}>INVITATION REQUIRED</Text>
            <Text style={styles.subtitle}>
              Fare is currently invite-only. Please enter{'\n'}your code to continue.
            </Text>

            {/* Code Input */}
            <View style={styles.codeSection}>
              <View style={styles.codeInputContainer}>
                <View style={styles.codeInputRow}>
                  <TextInput
                    style={[
                      styles.codeInput,
                      codeError ? styles.codeInputError : null
                    ]}
                    value={inviteCode}
                    onChangeText={(text) => {
                      setInviteCode(text);
                      if (codeError) setCodeError('');
                    }}
                    placeholder="ENTER CODE"
                    placeholderTextColor={theme.colors.text.secondary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleInviteCodeSubmit}
                  />
                  
                  <Pressable
                    style={[
                      styles.submitButton,
                      (!inviteCode.trim() || submittingCode) && styles.submitButtonDisabled
                    ]}
                    onPress={handleInviteCodeSubmit}
                    disabled={!inviteCode.trim() || submittingCode}
                  >
                    {submittingCode ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify</Text>
                    )}
                  </Pressable>
                </View>
                {codeError ? (
                  <Text style={styles.errorText}>{codeError}</Text>
                ) : null}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Join Waitlist */}
            <View style={styles.waitlistSection}>
              <Text style={styles.waitlistTitle}>Join the Waitlist</Text>
              <Text style={styles.waitlistText}>
                Complete your profile to improve your waitlist position.
              </Text>
              
              {/* Progress Bar */}
              {profileProgress < 100 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${profileProgress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(profileProgress)}% Complete</Text>
                </View>
              )}
              
              {!hasCompletedProfile ? (
                <>
                  <Pressable
                    style={styles.profileButton}
                    onPress={handleCompleteProfile}
                  >
                    <Text style={styles.profileButtonText}>Complete Profile</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.white} style={{ marginLeft: 8 }} />
                  </Pressable>
                  
                  {/* Incentive Messages */}
                  <View style={styles.incentiveContainer}>
                    <View style={styles.incentiveItem}>
                      <Ionicons name="sparkles" size={16} color={theme.colors.primary.main} />
                      <Text style={styles.incentiveText}>Get priority access</Text>
                    </View>
                    <View style={styles.incentiveItem}>
                      <Ionicons name="trending-up" size={16} color={theme.colors.primary.main} />
                      <Text style={styles.incentiveText}>Move up the waitlist</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.completedContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.completedText}>Profile Complete!</Text>
                  <Text style={styles.completedSubtext}>You're on the priority waitlist</Text>
                </View>
              )}
            </View>

            {/* Bottom Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>Invited Members Only</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="star-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>Exclusive Experiences</Text>
              </View>
            </View>
          </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scaleWidth(24),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(10),
  },
  logoutButton: {
    position: 'absolute',
    top: scaleHeight(20),
    right: scaleWidth(24),
    zIndex: 10,
    padding: scaleWidth(8),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(15),
  },
  logo: {
    fontSize: scaleFont(36),
    fontWeight: 'bold',
    color: theme.colors.primary.main,
    letterSpacing: 6,
    fontFamily: theme.typography.fontFamily.heading,
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  tagline: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(8),
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily.body,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleHeight(12),
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(15),
    paddingHorizontal: scaleWidth(10),
    fontFamily: theme.typography.fontFamily.body,
  },
  codeSection: {
    marginBottom: scaleHeight(20),
  },
  codeInputContainer: {
    width: '100%',
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(20),
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: theme.typography.fontFamily.body,
  },
  codeInputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    fontSize: scaleFont(12),
    color: '#FF4444',
    marginTop: scaleHeight(6),
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
  submitButton: {
    marginLeft: scaleWidth(12),
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(30),
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.gray['2'],
  },
  submitButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily.body,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scaleHeight(15),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray['1'],
  },
  dividerText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginHorizontal: scaleWidth(20),
    letterSpacing: 0.5,
    fontFamily: theme.typography.fontFamily.body,
  },
  waitlistSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(15),
  },
  waitlistTitle: {
    fontSize: scaleFont(17),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(10),
    fontFamily: theme.typography.fontFamily.heading,
  },
  waitlistText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(18),
    marginBottom: scaleHeight(15),
    paddingHorizontal: scaleWidth(5),
    fontFamily: theme.typography.fontFamily.body,
  },
  progressContainer: {
    width: '100%',
    marginBottom: scaleHeight(15),
  },
  progressBar: {
    height: scaleHeight(8),
    backgroundColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(4),
    overflow: 'hidden',
    marginBottom: scaleHeight(8),
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(4),
  },
  progressText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(35),
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  profileButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    letterSpacing: 0.5,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
  },
  incentiveContainer: {
    marginTop: scaleHeight(8),
  },
  incentiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(8),
  },
  incentiveText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(6),
    fontFamily: theme.typography.fontFamily.body,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(14),
  },
  completedText: {
    fontSize: scaleFont(16),
    color: '#4CAF50',
    marginTop: scaleHeight(8),
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.heading,
  },
  completedSubtext: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(4),
    fontFamily: theme.typography.fontFamily.body,
  },
  infoSection: {
    marginTop: scaleHeight(10),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(8),
  },
  infoText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(8),
    letterSpacing: 0.5,
    fontFamily: theme.typography.fontFamily.body,
  },
});