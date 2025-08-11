import * as AppleAuthentication from 'expo-apple-authentication';
import React, { memo, useState } from 'react';
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
} from 'react-native';

import { AppleIcon } from '@/components/icons/AppleIcon';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface WelcomeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export const WelcomeScreen = memo<WelcomeScreenProps>(({ onNavigate }) => {
  const [email, setEmail] = useState('');

  const handleEmailContinue = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Dismiss keyboard before navigating
    Keyboard.dismiss();

    // Navigate directly to confirmation code screen with email
    if (onNavigate) {
      onNavigate('confirmation', { email });
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'ios') {
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        // Handle successful sign in
        console.log('Apple Sign In:', credential);
        if (onNavigate) {
          onNavigate('confirmation', { email: credential.email });
        }
      } catch (e: any) {
        if (e.code !== 'ERR_CANCELED') {
          Alert.alert('Error', 'Apple sign in failed');
        }
      }
    } else {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS');
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign In', 'Google sign in coming soon!');
    // Will navigate to confirmation after implementation
  };

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
                <Text style={styles.subtitle}>Enter your email to get started</Text>
              </View>

              {/* Email Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={handleEmailContinue}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.continueButton,
                      !email && styles.continueButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleEmailContinue}
                    disabled={!email}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
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
  inputContainer: {
    marginBottom: scaleHeight(24),
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
});
