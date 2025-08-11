import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface FAQsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What do I do after I get matched?',
    answer:
      "Just show up at the place and time we picked for you. We'll handle the details and give you a fun info pack curated just for you.",
  },
  {
    question: 'When can I see my match?',
    answer:
      "You'll receive your match details 24 hours before your dinner. This includes the restaurant location, your dining companions, and any special instructions.",
  },
  {
    question: "What if I'm running late?",
    answer:
      "Please notify us through the app as soon as possible. We'll inform your dining companions and the restaurant. Try to arrive within 15 minutes of the reservation time.",
  },
  {
    question: 'When do I get my deposit back?',
    answer:
      'Your deposit is automatically refunded within 3-5 business days after attending your dinner. If you need to cancel, please do so at least 48 hours in advance for a full refund.',
  },
];

export const FAQsScreen: React.FC<FAQsScreenProps> = ({ onNavigate }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleClose = () => {
    onNavigate?.('home');
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
        <Text style={styles.headerTitle}>Frequently Asked</Text>
        <Text style={styles.headerTitle}>Questions</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.faqsContainer}>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Pressable style={styles.questionContainer} onPress={() => toggleExpanded(index)}>
                <Text style={styles.questionText}>{faq.question}</Text>
                <View style={styles.iconContainer}>
                  <Icon name={expandedIndex === index ? 'x' : 'plus'} size={18} color="#9B9B9B" />
                </View>
              </Pressable>
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  answerContainer: {
    marginTop: scaleHeight(14),
    paddingRight: scaleWidth(36),
  },
  answerText: {
    color: '#6B6B6B',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '400' as any,
    lineHeight: scaleFont(22),
  },
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
  faqItem: {
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    paddingVertical: scaleHeight(18),
  },
  faqsContainer: {
    paddingHorizontal: scaleWidth(24),
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
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(28),
    fontWeight: '700' as any,
    lineHeight: scaleFont(32),
  },
  iconContainer: {
    alignItems: 'center',
    height: scaleWidth(24),
    justifyContent: 'center',
    width: scaleWidth(24),
  },
  questionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: scaleHeight(24),
  },
  questionText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    paddingRight: scaleWidth(16),
  },
  scrollContent: {
    paddingBottom: scaleHeight(40),
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    paddingBottom: scaleHeight(30),
    paddingHorizontal: scaleWidth(24),
  },
});
