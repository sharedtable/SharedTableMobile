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
import { useNavigation } from '@react-navigation/native';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface HowItWorksScreenProps {
  onNavigate?: (screen: string, data?: unknown) => void;
}

const steps = [
  {
    number: '1',
    title: 'Create Your Profile',
    description:
      'Favorite cuisines, must-haves, dietary needs, and your vibe. The more we know, the better the match.',
  },
  {
    number: '2',
    title: 'We Create the Perfect Match',
    description:
      'Our agentic algorithm pairs you with a surprise restaurant and a dinner party. Both chosen to match your unique taste.',
  },
  {
    number: '3',
    title: 'The Big Reveal',
    description: 'No need to search or plan. Just check your reveal 24 hours before dinner.',
  },
  {
    number: '4',
    title: 'Show Up, Dine, & Connect',
    description:
      'Enjoy an amazing meal and a great conversation with a fellow foodie. You might just discover your new favorite dish—or person.',
  },
  {
    number: '5',
    title: 'Rate Your Experience',
    description:
      'Your feedback helps us fine-tune your future matches. The more you go, the better it gets.',
  },
];

export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  
  const handleClose = () => {
    navigation.goBack();
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
              {/* Number circle - positioned absolutely over the card */}
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              {/* Main card content */}
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
  closeButton: {
    alignItems: 'center',
    height: scaleWidth(32),
    justifyContent: 'center',
    width: scaleWidth(32),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(20),
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: scaleHeight(24),
  },
  scrollView: {
    flex: 1,
  },
  stepCard: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 2.5,
    borderColor: theme.colors.primary.main,
    borderLeftWidth: 1,
    borderRadius: scaleWidth(40),
    borderRightWidth: 1,
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: scaleHeight(70),
    paddingLeft: scaleWidth(64),
    paddingRight: scaleWidth(20),
    paddingVertical: scaleHeight(14),
  },
  stepCardWrapper: {
    marginBottom: scaleHeight(14),
    overflow: 'visible',
    position: 'relative',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.white,
    borderRadius: scaleWidth(18),
    borderWidth: 3,
    elevation: 5,
    height: scaleWidth(36),
    justifyContent: 'center',
    left: scaleWidth(20),
    position: 'absolute',
    shadowColor: theme.colors.black['1'],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: scaleHeight(16),
    width: scaleWidth(36),
    zIndex: 10,
  },
  stepNumberText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(18),
    fontWeight: '700',
    textAlign: 'center',
  },
  stepTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600',
    marginBottom: scaleHeight(3),
  },
  stepsContainer: {
    overflow: 'visible',
    paddingHorizontal: scaleWidth(20),
  },
  titleContainer: {
    paddingBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(24),
  },
});
