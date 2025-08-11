import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface ConfirmationCodeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  email?: string;
}

export const ConfirmationCodeScreen: React.FC<ConfirmationCodeScreenProps> = ({
  onNavigate,
  email = 'dose@email.com',
}) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (index === 3 && value) {
      // Hide keyboard when last digit is entered
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit code');
      return;
    }

    setLoading(true);
    try {
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate directly without showing success message
      onNavigate?.('home');
    } catch (error) {
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    Alert.alert('Code Resent', `A new code has been sent to ${email}`);
    // Clear the current code
    setCode(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleBack = () => {
    onNavigate?.('welcome');
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
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
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={handleBack} style={styles.headerButton}>
                <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
              </Pressable>
              <View style={styles.headerSpacer} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Enter confirmation code</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              A 4-digit code was sent to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>

            {/* Code Input */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <View key={index} style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      focusedIndex === index && styles.codeInputFocused,
                      digit && styles.codeInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                    autoComplete="off"
                  />
                </View>
              ))}
            </View>

            {/* Resend Code */}
            <Pressable onPress={handleResend} style={styles.resendButton}>
              <Text style={styles.resendText}>Resend code</Text>
            </Pressable>

            {/* Continue Button */}
            <View style={styles.bottomContainer}>
              <Pressable
                style={[
                  styles.continueButton,
                  (!isCodeComplete || loading) && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!isCodeComplete || loading}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Verifying...' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: scaleHeight(40),
  },
  codeContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
    justifyContent: 'center',
    marginBottom: scaleHeight(32),
  },
  codeInput: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    borderWidth: 1.5,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(24),
    fontWeight: '600' as any,
    height: scaleHeight(60),
  },
  codeInputFilled: {
    backgroundColor: '#F9FAFB',
  },
  codeInputFocused: {
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
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
  email: {
    color: theme.colors.text.primary,
    fontWeight: '500' as any,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: -scaleWidth(4),
    paddingBottom: scaleHeight(20),
    paddingTop: scaleHeight(12), // Compensate for back button padding
  },
  headerButton: {
    padding: scaleWidth(4),
  },
  headerSpacer: {
    flex: 1,
  },
  inputWrapper: {
    flex: 1,
    maxWidth: scaleWidth(65),
  },
  keyboardView: {
    flex: 1,
  },
  resendButton: {
    alignSelf: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
  },
  resendText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500' as any,
    textDecorationLine: 'underline',
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    lineHeight: scaleHeight(22),
    marginBottom: scaleHeight(40),
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
});
