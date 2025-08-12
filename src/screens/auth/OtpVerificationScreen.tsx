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
} from 'react-native';

import { useAuth } from '@/lib/auth';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OtpVerificationScreenProps {
  email: string;
  isSignUp?: boolean;
  onNavigate?: (screen: string, data?: any) => void;
  onBack?: () => void;
}

export const OtpVerificationScreen = memo<OtpVerificationScreenProps>(
  ({ email, isSignUp = false, onNavigate, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { verifyOtp, resendOtp, loading } = useAuth();
    const inputRefs = useRef<(TextInput | null)[]>([]);

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

    const handleOtpChange = (text: string, index: number) => {
      // Only allow numeric input
      const numericText = text.replace(/[^0-9]/g, '');

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
            handleVerifyOtp(completeOtp);
          }
        }
      }
    };

    const handleKeyPress = (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const handleVerifyOtp = async (otpCode?: string) => {
      const code = otpCode || otp.join('');

      if (code.length !== 6) {
        return;
      }

      Keyboard.dismiss();

      const success = await verifyOtp(email, code);

      if (success && onNavigate) {
        // Navigate to main app
        onNavigate('home');
      }
    };

    const handleResendOtp = async () => {
      if (!canResend) return;

      const success = await resendOtp(email);

      if (success) {
        // Reset timer
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
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
                  <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
                  <Text style={styles.email}>{email}</Text>
                </View>

                {/* OTP Input Section */}
                <View style={styles.otpSection}>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        style={[styles.otpInput, digit && styles.otpInputFilled]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                        autoComplete="one-time-code"
                      />
                    ))}
                  </View>

                  {/* Verify Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.verifyButton,
                      !isOtpComplete && styles.verifyButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleVerifyOtp()}
                    disabled={loading || !isOtpComplete}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.verifyButtonText}>
                        {isSignUp ? 'Create Account' : 'Verify & Sign In'}
                      </Text>
                    )}
                  </Pressable>

                  {/* Resend Section */}
                  <View style={styles.resendSection}>
                    <Text style={styles.resendText}>Didn't receive the code?</Text>

                    {canResend ? (
                      <Pressable onPress={handleResendOtp} disabled={loading}>
                        <Text style={styles.resendButton}>Resend Code</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                    )}
                  </View>
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacer} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }
);

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
  email: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(40),
  },
  otpInput: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(24),
    fontWeight: '600' as any,
    height: scaleHeight(56),
    width: scaleWidth(44),
  },
  otpInputFilled: {
    backgroundColor: 'rgba(226, 72, 73, 0.05)',
    borderColor: theme.colors.primary.main,
  },
  otpSection: {
    alignItems: 'center',
  },
  resendButton: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
  },
  resendSection: {
    alignItems: 'center',
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
    fontWeight: '700' as any,
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
    fontWeight: '600' as any,
  },
});
