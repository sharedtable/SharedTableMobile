import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';

interface HowItWorksScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

const steps = [
  {
    number: '1',
    title: 'Create Your Profile',
    description: 'Favorite cuisines, must-haves, dietary needs, and your vibe. The more we know, the better the match.',
  },
  {
    number: '2',
    title: 'We Create the Perfect Match',
    description: 'Our agentic algorithm pairs you with a surprise restaurant and a dinner party. Both chosen to match your unique taste.',
  },
  {
    number: '3',
    title: 'The Big Reveal',
    description: 'No need to search or plan. Just check your reveal 24 hours before dinner.',
  },
  {
    number: '4',
    title: 'Show Up, Dine, & Connect',
    description: 'Enjoy an amazing meal and a great conversation with a fellow foodie. You might just discover your new favorite dish—or person.',
  },
  {
    number: '5',
    title: 'Create Your Profile',
    description: 'Your feedback helps us fine-tune your future matches. The more you go, the better it gets.',
  },
];

export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({ onNavigate }) => {
  const handleClose = () => {
    onNavigate?.('home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Icon name="x" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>
      
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>HOW DOES IT WORK?</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCardWrapper}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(10),
  },
  closeButton: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(20),
  },
  headerTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(24),
  },
  stepsContainer: {
    paddingHorizontal: scaleWidth(20),
  },
  stepCardWrapper: {
    position: 'relative',
    marginBottom: scaleHeight(14),
  },
  stepCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(40),
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2.5,
    borderColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(14),
    paddingLeft: scaleWidth(64),
    paddingRight: scaleWidth(20),
    minHeight: scaleHeight(70),
    justifyContent: 'center',
  },
  stepNumber: {
    position: 'absolute',
    left: scaleWidth(20),
    top: scaleHeight(16),
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: theme.colors.primary.main,
    borderWidth: 3,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1, // For Android
  },
  stepNumberText: {
    fontSize: scaleFont(22),
    fontWeight: '700' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(3),
  },
  stepDescription: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: scaleFont(18),
  },
});