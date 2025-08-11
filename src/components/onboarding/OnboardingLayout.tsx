import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';
import { ProgressBar } from './ProgressBar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  onBack,
  currentStep,
  totalSteps,
  scrollable = false,
  keyboardAvoiding = false,
}) => {
  const content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Icon name="back" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {/* Progress Bar */}
      {currentStep && totalSteps && (
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      )}

      {/* Content */}
      {children}
    </>
  );

  const wrappedContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>{content}</View>
    </ScrollView>
  ) : (
    <View style={styles.content}>{content}</View>
  );

  const keyboardWrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  ) : (
    wrappedContent
  );

  return (
    <SafeAreaView style={styles.container}>{keyboardWrappedContent}</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(100), // Space for bottom button
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(20),
    marginHorizontal: -scaleWidth(4),
  },
  headerButton: {
    padding: scaleWidth(4),
  },
});