/**
 * Production-grade layout component for personalization screens
 * Provides consistent structure and navigation for all personalization flows
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight } from '@/utils/responsive';

interface PersonalizationLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
  keyboardAvoid?: boolean;
  backgroundColor?: string;
  contentStyle?: ViewStyle;
  safeArea?: boolean;
  padding?: boolean;
}

export const PersonalizationLayout: React.FC<PersonalizationLayoutProps> = ({
  children,
  scrollable = true,
  keyboardAvoid = true,
  backgroundColor = theme.colors.background.default,
  contentStyle,
  safeArea = true,
  padding = true,
}) => {
  const Container = safeArea ? SafeAreaView : View;
  
  const content = (
    <Container style={[styles.container, { backgroundColor }]}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            padding && styles.padding,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[
          styles.staticContent,
          padding && styles.padding,
          contentStyle,
        ]}>
          {children}
        </View>
      )}
    </Container>
  );

  if (keyboardAvoid && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
    paddingBottom: scaleHeight(20),
  },
});