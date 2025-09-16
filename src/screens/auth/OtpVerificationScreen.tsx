import * as Clipboard from 'expo-clipboard';
import React, { memo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OtpVerificationScreenProps {
  email?: string;
  phoneNumber?: string;
  verificationType: 'email' | 'sms';
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
  onBack?: () => void;
  privyVerifyCode: (code: string) => Promise<void>;
  privySendCode: (identifier: string) => Promise<void>;
}

export const OtpVerificationScreen = memo<OtpVerificationScreenProps>((props) => {
  const {
    email,
    phoneNumber,
    verificationType,
    onNavigate: _onNavigate,
    onBack,
    privyVerifyCode,
    privySendCode,
  } = props;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Add function to clear all OTP
  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    // Don't auto-focus to prevent unwanted focus jumping
  };

  const handleVerifyOtp = React.useCallback(async (otpCode?: string) => {
    const code = otpCode || otp.join('');

    if (code.length !== 6 || isVerifying) {
      return;
    }

    setIsVerifying(true);
    Keyboard.dismiss();

    try {
      setIsLoading(true);
      // Use Privy verification passed from parent
      await privyVerifyCode(code);
      // Navigation will be handled by parent component via Privy auth state changes
    } catch (error) {
      console.error('OTP verification error:', error);
      clearOtp();
      Alert.alert('Verification Failed', 'The code you entered is incorrect. Please try again.');
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  }, [otp, isVerifying, privyVerifyCode]);

  // Start countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-focus first input and check clipboard
  useEffect(() => {
    const initializeOtpInput = async () => {
      // Focus first input only if all fields are empty
      if (otp.every(digit => digit === '')) {
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 300);
      }

      // Check if there's a potential OTP in clipboard
      try {
        const clipboardText = await Clipboard.getStringAsync();
        const otpMatch = clipboardText.match(/\b\d{6}\b/);

        if (otpMatch) {
          // Ask user if they want to use clipboard OTP
          Alert.alert(
            'Use Copied Code?',
            `We found a 6-digit code "${otpMatch[0]}" in your clipboard. Would you like to use it?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Use Code',
                onPress: () => {
                  const digits = otpMatch[0].split('');
                  setOtp(digits);
                  // Auto-verify after a short delay
                  setTimeout(() => {
                    handleVerifyOtp(otpMatch[0]);
                  }, 500);
                },
              },
            ]
          );
        }
      } catch (error) {
        // Clipboard access failed, continue normally
        console.log('Clipboard access failed:', error);
      }
    };

    initializeOtpInput();
  }, [handleVerifyOtp]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');

    // Handle pasted multi-digit input
    if (numericText.length > 1) {
      // User pasted multiple digits
      const pastedDigits = numericText.slice(0, 6).split('');
      const newOtp = [...otp];

      // Fill in digits starting from current index
      for (let i = 0; i < pastedDigits.length && index + i < 6; i++) {
        newOtp[index + i] = pastedDigits[i];
      }

      setOtp(newOtp);

      // Focus the next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((digit, i) => i > index && digit === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }

      // Auto-verify if complete
      if (newOtp.every((digit) => digit !== '')) {
        setTimeout(() => {
          handleVerifyOtp(newOtp.join(''));
        }, 300);
      }

      return;
    }

    // Handle single digit input
    if (numericText.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericText;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify when all digits are entered
      if (index === 5 && numericText) {
        const completeOtp = newOtp.join('');
        if (completeOtp.length === 6) {
          setTimeout(() => {
            handleVerifyOtp(completeOtp);
          }, 300);
        }
      }
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current field is empty, go back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // Current field has content, clear it (handled by onChangeText)
        // The TextInput will handle clearing the current field
      }
    }
  };

  // Handle focus on OTP container tap
  const handleContainerPress = () => {
    // Find first empty input or focus last one
    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    try {
      setIsLoading(true);
      // Use Privy resend passed from parent
      const identifier = verificationType === 'email' ? email : phoneNumber;
      if (!identifier) {
        throw new Error('No identifier available for verification');
      }
      await privySendCode(identifier);

      // Reset timer and clear OTP
      setResendTimer(60);
      setCanResend(false);
      clearOtp();

      // Show feedback
      const message =
        verificationType === 'email'
          ? 'A new verification code has been sent to your email.'
          : 'A new verification code has been sent to your phone.';
      Alert.alert('Code Sent', message, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

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
              {/* Back Button */}
              {onBack && (
                <Pressable style={styles.backButton} onPress={onBack}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
              )}

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{' '}
                  {verificationType === 'email' ? 'your email' : 'your phone'}
                </Text>
                <Text style={styles.email}>
                  {verificationType === 'email' ? email : phoneNumber}
                </Text>
              </View>

              {/* OTP Input Section */}
              <View style={styles.otpSection}>
                <Pressable style={styles.otpContainer} onPress={handleContainerPress}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                        (isVerifying || isLoading) && styles.otpInputDisabled,
                      ]}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => {
                        // Prevent refocusing first input when trying to type in other inputs
                        if (otp[index]) {
                          // If this field has a value, select it
                          inputRefs.current[index]?.setNativeProps({ selection: { start: 0, end: 1 } });
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={index === 0 ? 6 : 1} // Only allow pasting full code in first input
                      textAlign="center"
                      selectTextOnFocus
                      autoComplete="one-time-code"
                      autoFocus={false} // Disable autoFocus to prevent jumping
                      editable={!isVerifying && !isLoading}
                      contextMenuHidden={false} // Allow paste
                    />
                  ))}
                </Pressable>

                {/* Resend Section - Moved up */}
                <View style={styles.resendSection}>
                  <Text style={styles.resendText}>Didn&apos;t receive the code?</Text>

                  {canResend ? (
                    <Pressable onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendButton}>Resend Code</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                  )}
                </View>

                {/* Verify Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.verifyButton,
                    (!isOtpComplete || isVerifying || isLoading) && styles.verifyButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleVerifyOtp()}
                  disabled={isLoading || !isOtpComplete || isVerifying}
                >
                  {isLoading || isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      {isOtpComplete ? 'Verify & Continue' : 'Enter 6-digit code'}
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacer} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
});

OtpVerificationScreen.displayName = 'OtpVerificationScreen';

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(4),
    paddingVertical: scaleHeight(8),
  },
  backButtonText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
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
  email: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(24),
  },
  otpInput: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(24),
    fontWeight: '600',
    height: scaleHeight(56),
    width: scaleWidth(44),
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  otpInputFilled: {
    backgroundColor: `${theme.colors.primary.main}0D`, // 0D is 5% opacity in hex
    borderColor: theme.colors.primary.main,
  },
  otpSection: {
    alignItems: 'center',
  },
  resendButton: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(32),
  },
  resendText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(8),
  },
  resendTimer: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(4),
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(28),
    fontWeight: '700',
    marginBottom: scaleHeight(12),
    textAlign: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(60),
    marginTop: scaleHeight(60),
  },
  verifyButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    height: scaleHeight(52),
    justifyContent: 'center',
    marginBottom: scaleHeight(32),
    width: '100%',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
});
