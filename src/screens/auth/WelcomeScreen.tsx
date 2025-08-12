import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';

import { AppleIcon } from '@/components/icons/AppleIcon';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { useAuth } from '@/lib/auth';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { testOtpSending } from '@/utils/testAuth';

import { OtpVerificationScreen } from './OtpVerificationScreen';

interface WelcomeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export const WelcomeScreen = memo<WelcomeScreenProps>(({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple, loading, user, isNewUser } = useAuth();

  // Handle navigation after successful authentication
  useEffect(() => {
    if (user && onNavigate) {
      console.log('🚀 [WelcomeScreen] User authenticated, checking if new user...');
      console.log('🚀 [WelcomeScreen] User:', user.email, 'isNewUser:', isNewUser);

      if (isNewUser) {
        console.log('🚀 [WelcomeScreen] New user detected, navigating to onboarding');
        onNavigate('onboarding-name');
      } else {
        console.log('🚀 [WelcomeScreen] Existing user detected, navigating to home');
        onNavigate('home');
      }
    }
  }, [user, isNewUser, onNavigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailAuth = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // For sign up, validate name fields
    if (isSignUp && (!firstName || !lastName)) {
      Alert.alert('Name Required', 'Please enter your first and last name');
      return;
    }

    // Dismiss keyboard before processing
    Keyboard.dismiss();

    let success = false;

    if (isSignUp) {
      success = await signUp({
        email,
        firstName,
        lastName,
      });
    } else {
      success = await signIn({
        email,
      });
    }

    if (success) {
      // Show OTP verification screen
      setShowOtpScreen(true);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🚀 [WelcomeScreen] Google sign in button clicked');

    try {
      const success = await signInWithGoogle();
      console.log('🚀 [WelcomeScreen] Google sign in result:', success);

      if (success) {
        console.log(
          '🚀 [WelcomeScreen] Google sign in successful, waiting for auth state update...'
        );
        // Navigation will be handled by useEffect when user state updates
      } else {
        console.log('🚀 [WelcomeScreen] Google sign in failed or cancelled');
      }
    } catch (error) {
      console.error('❌ [WelcomeScreen] Google sign in error:', error);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS');
      return;
    }

    const success = await signInWithApple();
    if (success && onNavigate) {
      onNavigate('home');
    }
  };

  // Show OTP screen if needed
  if (showOtpScreen) {
    return (
      <OtpVerificationScreen
        email={email}
        isSignUp={isSignUp}
        onNavigate={onNavigate}
        onBack={() => setShowOtpScreen(false)}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.content}>
              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Welcome to SharedTable</Text>
                <Text style={styles.subtitle}>
                  {isSignUp ? 'Create your account' : 'Sign in to continue'}
                </Text>
              </View>

              {/* Auth Form Section */}
              <View style={styles.inputSection}>
                <View style={styles.formContainer}>
                  {/* Name fields for sign up */}
                  {isSignUp && (
                    <View style={styles.nameRow}>
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="First name"
                        placeholderTextColor={theme.colors.text.secondary}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Last name"
                        placeholderTextColor={theme.colors.text.secondary}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  )}

                  {/* Email Input */}
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                  />

                  {/* Submit Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.authButton,
                      (!email || (isSignUp && (!firstName || !lastName))) &&
                        styles.authButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleEmailAuth}
                    disabled={loading || !email || (isSignUp && (!firstName || !lastName))}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.authButtonText}>
                        {isSignUp ? 'Send Verification Code' : 'Send Login Code'}
                      </Text>
                    )}
                  </Pressable>

                  {/* Toggle Sign Up/Sign In */}
                  <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleButton}>
                    <Text style={styles.toggleButtonText}>
                      {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </Text>
                  </Pressable>
                </View>

                {/* Or separator */}
                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtons}>
                  {/* Google Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.socialButton,
                      styles.googleButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleGoogleSignIn}
                  >
                    <GoogleIcon size={20} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </Pressable>

                  {/* Apple Button */}
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.socialButton,
                        styles.appleButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={handleAppleSignIn}
                    >
                      <AppleIcon size={20} color="#FFFFFF" />
                      <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </Pressable>
                  )}
                </View>

                {/* Debug OTP Test Button - FOR TESTING ONLY */}
                <Pressable
                  style={styles.skipButton}
                  onPress={async () => {
                    if (!email || !validateEmail(email)) {
                      Alert.alert('Email Required', 'Please enter a valid email address first');
                      return;
                    }
                    const result = await testOtpSending(email);
                    Alert.alert('OTP Test', `Check console logs. Success: ${result.success}`);
                  }}
                >
                  <Text style={styles.skipButtonText}>[DEBUG] Test OTP Sending</Text>
                </Pressable>

                {/* Temporary Skip to Home Button - FOR TESTING ONLY */}
                <Pressable style={styles.skipButton} onPress={() => onNavigate?.('home')}>
                  <Text style={styles.skipButtonText}>[DEV] Skip to Home</Text>
                </Pressable>

                {/* Bottom spacing to ensure buttons are visible */}
                <View style={styles.bottomSpacer} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

const styles = StyleSheet.create({
  appleButton: {
    backgroundColor: theme.colors.text.primary,
  },
  appleButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  authButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
  },
  bottomSpacer: {
    height: scaleHeight(40),
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
  },
  emailInput: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    height: scaleHeight(52),
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  // New styles for auth form
  formContainer: {
    marginBottom: scaleHeight(24),
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderWidth: 1,
  },
  googleButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    height: scaleHeight(52),
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  inputContainer: {
    marginBottom: scaleHeight(24),
  },
  inputSection: {
    paddingTop: scaleHeight(20),
  },
  keyboardView: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  orContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: scaleHeight(24),
  },
  orLine: {
    backgroundColor: theme.colors.gray['1'],
    flex: 1,
    height: 1,
  },
  orText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginHorizontal: scaleWidth(16),
  },
  scrollContent: {
    flexGrow: 1,
  },
  skipButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    borderStyle: 'dashed' as any,
    borderWidth: 1,
    marginTop: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
  },
  skipButtonText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  socialButton: {
    alignItems: 'center',
    borderRadius: scaleWidth(12),
    flexDirection: 'row',
    gap: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
  },
  socialButtons: {
    gap: scaleHeight(12),
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(40),
    paddingTop: scaleHeight(80),
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
  },
  toggleButtonText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
  },
});
