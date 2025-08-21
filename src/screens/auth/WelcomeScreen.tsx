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
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

import { OtpVerificationScreen } from './OtpVerificationScreen';

interface WelcomeScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const WelcomeScreen = memo<WelcomeScreenProps>((props) => {
  const { onNavigate } = props;
  const [email, setEmail] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const {
    user: privyUser,
    isAuthenticated: privyAuthenticated,
    sendEmailCode,
    verifyEmailCode: privyVerifyCode,
    loginWithGoogle: privyGoogleLogin,
    loginWithApple: privyAppleLogin,
    isLoading: privyLoading,
  } = usePrivyAuth();
  const { setPrivyUser } = useAuthStore();

  // No longer needed - Privy ready state is handled internally

  // Handle Privy authentication
  useEffect(() => {
    if (privyAuthenticated && privyUser && onNavigate) {
      setPrivyUser(privyUser);
      // For now, treat all Privy users as existing users
      // You can implement logic to check if it's a new user based on your backend
      onNavigate('home');
    }
  }, [privyAuthenticated, privyUser, onNavigate, setPrivyUser]);

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

    // Dismiss keyboard before processing
    Keyboard.dismiss();

    try {
      await sendEmailCode(email);
      setShowOtpScreen(true);
      Alert.alert('Check your email', `We sent a verification code to ${email}`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to send verification code');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await privyGoogleLogin();
      // Navigation will be handled by useEffect when user state updates
    } catch (error) {
      // Check if user cancelled
      const errorMessage = (error as Error).message || '';
      const isCancellation =
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.toLowerCase().includes('abort') ||
        errorMessage.toLowerCase().includes('user closed');

      if (!isCancellation) {
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS');
      return;
    }

    try {
      await privyAppleLogin();
      // Navigation will be handled by useEffect when user state updates
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
    }
  };

  const isLoading = privyLoading;

  // Show OTP screen if needed
  if (showOtpScreen) {
    return (
      <OtpVerificationScreen
        email={email}
        onNavigate={onNavigate}
        onBack={() => setShowOtpScreen(false)}
        privyVerifyCode={privyVerifyCode}
        privySendCode={sendEmailCode}
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
                <Text style={styles.subtitle}>Enter your email to continue</Text>
              </View>

              {/* Auth Form Section */}
              <View style={styles.inputSection}>
                <View style={styles.formContainer}>
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
                    returnKeyType="done"
                    onSubmitEditing={handleEmailAuth}
                  />

                  {/* Submit Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.authButton,
                      !email && styles.authButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleEmailAuth}
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.authButtonText}>Continue with Email</Text>
                    )}
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000000" size="small" />
                    ) : (
                      <>
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                      </>
                    )}
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
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <AppleIcon size={20} color="#FFFFFF" />
                          <Text style={styles.appleButtonText}>Continue with Apple</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>

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
    fontWeight: '500',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '500',
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
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(40),
    paddingTop: scaleHeight(80),
  },
});
