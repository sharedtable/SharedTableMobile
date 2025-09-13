import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PrivacyPolicyScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Privacy Policy" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to Fare ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and protect your information when you use our beta application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect information you provide directly to us, including:
            </Text>
            <Text style={styles.bulletPoint}>• Name and email address</Text>
            <Text style={styles.bulletPoint}>• Profile information (birthday, preferences)</Text>
            <Text style={styles.bulletPoint}>• Dining preferences and dietary restrictions</Text>
            <Text style={styles.bulletPoint}>• Location data (with your permission)</Text>
            <Text style={styles.bulletPoint}>• Payment information (processed securely)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <Text style={styles.bulletPoint}>• Match you with compatible dining partners</Text>
            <Text style={styles.bulletPoint}>• Process your bookings and payments</Text>
            <Text style={styles.bulletPoint}>• Send you relevant notifications</Text>
            <Text style={styles.bulletPoint}>• Improve our matching algorithm</Text>
            <Text style={styles.bulletPoint}>• Provide customer support</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Protection</Text>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. Your data is encrypted both in transit and at rest.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, trade, or rent your personal information to third parties. We may share limited information with:
            </Text>
            <Text style={styles.bulletPoint}>• Other users you're matched with for dining</Text>
            <Text style={styles.bulletPoint}>• Restaurant partners (reservation details only)</Text>
            <Text style={styles.bulletPoint}>• Payment processors (securely)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Access your personal data</Text>
            <Text style={styles.bulletPoint}>• Correct inaccurate data</Text>
            <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
            <Text style={styles.bulletPoint}>• Opt-out of marketing communications</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beta Program</Text>
            <Text style={styles.paragraph}>
              As this is a beta version, we may collect additional usage analytics to improve the app experience. 
              This data is anonymized and used solely for product development.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have questions about this privacy policy or your personal data, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>privacy@getfare.app</Text>
          </View>

          <View style={{ height: scaleHeight(50) }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bulletPoint: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(24),
    marginLeft: scaleWidth(16),
    marginTop: scaleHeight(4),
  },
  contactInfo: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    marginTop: scaleHeight(8),
  },
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleWidth(24),
    paddingTop: scaleHeight(24),
  },
  lastUpdated: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(24),
    textAlign: 'center',
  },
  paragraph: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(24),
    marginTop: scaleHeight(8),
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(32),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700',
  },
});