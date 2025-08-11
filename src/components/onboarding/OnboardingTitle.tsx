import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingTitleProps {
  children: React.ReactNode;
  style?: any;
}

export const OnboardingTitle: React.FC<OnboardingTitleProps> = ({ children, style }) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  title: {
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(32),
    fontFamily: theme.typography.fontFamily.heading,
    lineHeight: scaleHeight(40),
  },
});