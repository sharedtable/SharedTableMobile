import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: any;
  autoFocus?: boolean;
  error?: string;
}

export const OnboardingInput: React.FC<OnboardingInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  autoFocus = false,
  error,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray['3']}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: '#e53e3e',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(4),
  },
  input: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    height: scaleHeight(52),
    paddingHorizontal: scaleWidth(16),
  },
  inputError: {
    borderColor: '#e53e3e',
    borderWidth: 1.5,
  },
  inputGroup: {
    marginBottom: scaleHeight(20),
  },
  label: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(8),
  },
  required: {
    color: theme.colors.brand.primary,
  },
});
