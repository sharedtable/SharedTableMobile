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
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(32),
    fontWeight: '700' as any,
    lineHeight: scaleHeight(40),
    marginBottom: scaleHeight(32),
  },
});
