import * as SecureStore from 'expo-secure-store';
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

// import { AppleIcon } from '@/components/icons/AppleIcon'; // Commented out until Apple Sign-In is enabled
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

import { OtpVerificationScreen } from './OtpVerificationScreen';

interface WelcomeScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

type AuthTab = 'email' | 'phone';

export const WelcomeScreen = memo<WelcomeScreenProps>((props) => {
  const { onNavigate } = props;
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [verificationType, setVerificationType] = useState<'email' | 'sms'>('email');
  const [localLoading, setLocalLoading] = useState(false);

  const {
    user: privyUser,
    isAuthenticated: privyAuthenticated,
    sendEmailCode,
    verifyEmailCode: privyVerifyCode,
    sendSMSCode,
    verifySMSCode: privyVerifySMSCode,
    loginWithGoogle: privyGoogleLogin,
    // loginWithApple: privyAppleLogin, // Commented out until Apple Sign-In is enabled
  } = usePrivyAuth();
  const { setPrivyUser } = useAuthStore();

  // Handle Privy authentication
  useEffect(() => {
    const handleAuthentication = async () => {
      if (privyAuthenticated && privyUser && onNavigate) {
        setPrivyUser(privyUser);

        // Check if user needs onboarding
        const needsOnboarding = await SecureStore.getItemAsync('needs_onboarding');

        if (needsOnboarding === 'true') {
          // Clear the flag
          await SecureStore.deleteItemAsync('needs_onboarding');
          // Navigate to onboarding
          onNavigate('onboarding');
        } else {
          // Existing user, go to home
          onNavigate('home');
        }
      }
    };

    handleAuthentication();
  }, [privyAuthenticated, privyUser, onNavigate, setPrivyUser]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic phone validation - accepts various formats
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');

    // If doesn't start with +, assume US number and add +1
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10) {
        formatted = `+1${formatted}`;
      } else if (formatted.length === 11 && formatted.startsWith('1')) {
        formatted = `+${formatted}`;
      }
    }

    return formatted;
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
      setLocalLoading(true);
      await sendEmailCode(email);
      setVerificationType('email');
      setShowOtpScreen(true);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to send verification code');
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      Alert.alert('Phone Number Required', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    // Dismiss keyboard before processing
    Keyboard.dismiss();

    try {
      setLocalLoading(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await sendSMSCode(formattedPhone);
      setVerificationType('sms');
      setShowOtpScreen(true);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to send verification code');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleContinue = () => {
    if (activeTab === 'email') {
      handleEmailAuth();
    } else {
      handlePhoneAuth();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLocalLoading(true);
      await privyGoogleLogin();
      // Navigation will be handled by useEffect when user state updates
    } catch (error) {
      // Check if user cancelled
      const errorMessage = (error as Error).message || '';
      const errorDetails = (error as any)?.details || '';

      console.log('Google Sign In Error:', {
        message: errorMessage,
        details: errorDetails,
        fullError: error,
      });

      const isCancellation =
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.toLowerCase().includes('abort') ||
        errorMessage.toLowerCase().includes('user closed') ||
        errorMessage.toLowerCase().includes('user denied');

      if (!isCancellation) {
        // Provide more specific error message
        let displayMessage = 'Failed to sign in with Google.';

        if (errorMessage.includes('redirect') || errorMessage.includes('oauth')) {
          displayMessage += ' OAuth configuration may need to be updated.';
        } else if (errorMessage.includes('network')) {
          displayMessage += ' Please check your internet connection.';
        } else if (errorMessage.includes('not supported')) {
          displayMessage += ' Google Sign In may not be supported in this environment.';
        }

        Alert.alert('Google Sign In Error', `${displayMessage}\n\nError: ${errorMessage}`);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Apple Sign-In handler - commented out until enabled in Privy
  // const handleAppleSignIn = async () => {
  //   if (Platform.OS !== 'ios') {
  //     Alert.alert('Not Available', 'Apple Sign In is only available on iOS');
  //     return;
  //   }

  //   try {
  //     setLocalLoading(true);
  //     await privyAppleLogin();
  //     // Navigation will be handled by useEffect when user state updates
  //   } catch (error) {
  //     const errorMessage = (error as Error).message || '';
      
  //     // Check if it's a configuration issue
  //     if (errorMessage.toLowerCase().includes('not allowed')) {
  //       Alert.alert(
  //         'Configuration Required',
  //         'Apple Sign-In needs to be enabled for this app. Please contact support or use email/phone sign-in instead.',
  //         [{ text: 'OK' }]
  //       );
  //     } else if (errorMessage.toLowerCase().includes('cancel')) {
  //       // User cancelled - don't show error
  //     } else {
  //       console.error('Apple Sign In Error:', error);
  //       Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
  //     }
  //   } finally {
  //     setLocalLoading(false);
  //   }
  // };

  const isLoading = localLoading;
  const canContinue = activeTab === 'email' ? !!email : !!phoneNumber;

  // Show OTP screen if needed
  if (showOtpScreen) {
    return (
      <OtpVerificationScreen
        email={verificationType === 'email' ? email : undefined}
        phoneNumber={verificationType === 'sms' ? formatPhoneNumber(phoneNumber) : undefined}
        verificationType={verificationType}
        onNavigate={onNavigate}
        onBack={() => {
          setShowOtpScreen(false);
          // Reset loading state when coming back
          setLocalLoading(false);
          // Keep the input fields so user doesn't have to re-type
        }}
        privyVerifyCode={verificationType === 'email' ? privyVerifyCode : privyVerifySMSCode}
        privySendCode={verificationType === 'email' ? sendEmailCode : sendSMSCode}
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
                <Text style={styles.title}>Welcome to Fare</Text>
                <Text style={styles.subtitle}>Sign in or create an account</Text>
              </View>

              {/* Auth Form Section */}
              <View style={styles.inputSection}>
                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                  <Pressable
                    style={[styles.tab, activeTab === 'email' && styles.activeTab]}
                    onPress={() => setActiveTab('email')}
                  >
                    <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
                      Email
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
                    onPress={() => setActiveTab('phone')}
                  >
                    <Text style={[styles.tabText, activeTab === 'phone' && styles.activeTabText]}>
                      Phone
                    </Text>
                  </Pressable>
                </View>

                {/* Input Form */}
                <View style={styles.formContainer}>
                  {activeTab === 'email' ? (
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
                      onSubmitEditing={handleContinue}
                    />
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Phone number"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                    />
                  )}

                  {/* Submit Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.authButton,
                      !canContinue && styles.authButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleContinue}
                    disabled={isLoading || !canContinue}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.authButtonText}>
                        Continue with {activeTab === 'email' ? 'Email' : 'Phone'}
                      </Text>
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

                  {/* Apple Button - Hidden for now until enabled in Privy */}
                  {/* {Platform.OS === 'ios' && (
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
                  )} */}
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
  activeTab: {
    backgroundColor: theme.colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeTabText: {
    color: theme.colors.primary.main,
  },
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
  inputSection: {
    paddingTop: scaleHeight(20),
  },
  keyboardView: {
    flex: 1,
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
  tab: {
    alignItems: 'center',
    borderRadius: scaleWidth(8),
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  tabContainer: {
    backgroundColor: '#F3F4F6', // Light gray background for tabs
    borderRadius: scaleWidth(12),
    flexDirection: 'row',
    marginBottom: scaleHeight(24),
    padding: scaleWidth(4),
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
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
