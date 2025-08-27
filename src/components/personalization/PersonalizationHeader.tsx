/**
 * Production-grade header component for personalization screens
 * Shows title, back button, and progress
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PersonalizationHeaderProps {
  title: string;
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const PersonalizationHeader: React.FC<PersonalizationHeaderProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  showBack = true,
  rightAction,
  style,
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={scaleWidth(24)}
              color={theme.colors.text.primary}
            />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        {currentStep && totalSteps && (
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>
        )}

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
    paddingBottom: scaleHeight(20),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(16),
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  stepIndicator: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
  },
  stepText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.primary[700],
  },
  rightActionContainer: {
    minWidth: scaleWidth(40),
    alignItems: 'flex-end',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: scaleFont(34),
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleHeight(8),
    lineHeight: scaleFont(22),
  },
});