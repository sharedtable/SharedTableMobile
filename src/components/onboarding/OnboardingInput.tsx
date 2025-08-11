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
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray['3']}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: scaleHeight(20),
  },
  label: {
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
    fontFamily: theme.typography.fontFamily.body,
  },
  required: {
    color: theme.colors.brand.primary,
  },
  input: {
    height: scaleHeight(52),
    borderWidth: 1,
    borderColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
});