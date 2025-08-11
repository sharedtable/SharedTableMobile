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
import { theme } from '@/theme';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { AppleIcon } from '@/components/icons/AppleIcon';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import * as AppleAuthentication from 'expo-apple-authentication';

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
                <Pressable 
                  style={styles.skipButton}
                  onPress={() => onNavigate?.('home')}
                >
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  titleSection: {
    paddingTop: scaleHeight(80),
    alignItems: 'center',
    marginBottom: scaleHeight(40),
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: scaleHeight(8),
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
  inputSection: {
    paddingTop: scaleHeight(20),
  },
  inputContainer: {
    marginBottom: scaleHeight(24),
  },
  emailInput: {
    height: scaleHeight(52),
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(16),
  },
  continueButton: {
    height: scaleHeight(52),
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scaleHeight(24),
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray['1'],
  },
  orText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginHorizontal: scaleWidth(16),
    fontFamily: theme.typography.fontFamily.body,
  },
  socialButtons: {
    gap: scaleHeight(12),
  },
  socialButton: {
    height: scaleHeight(52),
    borderRadius: scaleWidth(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(12),
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray['1'],
  },
  googleButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  appleButton: {
    backgroundColor: theme.colors.text.primary,
  },
  appleButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '500' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  bottomSpacer: {
    height: scaleHeight(40),
  },
  skipButton: {
    marginTop: scaleHeight(24),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    backgroundColor: 'rgba(226, 72, 73, 0.1)',
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    borderStyle: 'dashed' as any,
  },
  skipButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600' as any,
  },
});