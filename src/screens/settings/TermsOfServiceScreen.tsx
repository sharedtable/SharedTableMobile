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

interface TermsOfServiceScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Terms of Service" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using the Fare beta application, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Beta Program</Text>
            <Text style={styles.paragraph}>
              This is a beta version of Fare. Features may change, and the service may experience interruptions. 
              Your feedback is valuable in helping us improve the experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.paragraph}>
              You are responsible for:
            </Text>
            <Text style={styles.bulletPoint}>• Providing accurate profile information</Text>
            <Text style={styles.bulletPoint}>• Maintaining the security of your account</Text>
            <Text style={styles.bulletPoint}>• All activities under your account</Text>
            <Text style={styles.bulletPoint}>• Notifying us of unauthorized use</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Booking and Payments</Text>
            <Text style={styles.paragraph}>
              When you book a dining experience:
            </Text>
            <Text style={styles.bulletPoint}>• A $30 hold is placed on your payment method</Text>
            <Text style={styles.bulletPoint}>• The hold is released after attendance confirmation</Text>
            <Text style={styles.bulletPoint}>• No-shows may result in charges</Text>
            <Text style={styles.bulletPoint}>• Cancellations must be made 24 hours in advance</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. User Conduct</Text>
            <Text style={styles.paragraph}>
              You agree to:
            </Text>
            <Text style={styles.bulletPoint}>• Be respectful to other users</Text>
            <Text style={styles.bulletPoint}>• Show up for confirmed bookings</Text>
            <Text style={styles.bulletPoint}>• Provide honest information</Text>
            <Text style={styles.bulletPoint}>• Not misuse the platform</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Matching Service</Text>
            <Text style={styles.paragraph}>
              Fare provides a matching service to connect users for dining experiences. We do not guarantee compatibility 
              or specific outcomes from matches. Users interact at their own discretion.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              Fare is not responsible for:
            </Text>
            <Text style={styles.bulletPoint}>• User interactions or experiences</Text>
            <Text style={styles.bulletPoint}>• Restaurant service or quality</Text>
            <Text style={styles.bulletPoint}>• Losses from service interruptions</Text>
            <Text style={styles.bulletPoint}>• User-generated content</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Privacy</Text>
            <Text style={styles.paragraph}>
              Your use of our service is also governed by our Privacy Policy. Please review it to understand how we 
              collect and use your information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Termination</Text>
            <Text style={styles.paragraph}>
              We reserve the right to suspend or terminate accounts that violate these terms or for any other reason 
              at our discretion.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may update these terms at any time. Continued use of the service after changes constitutes acceptance 
              of the new terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.paragraph}>
              For questions about these terms, contact us at:
            </Text>
            <Text style={styles.contactInfo}>legal@getfare.app</Text>
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