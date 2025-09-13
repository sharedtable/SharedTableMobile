import * as Application from 'expo-application';
import * as Device from 'expo-device';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface AboutScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface AboutItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  type: 'info' | 'link' | 'action';
}

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const _buildNumber = Application.nativeBuildVersion || '1';
  const _deviceName = Device.deviceName || 'Unknown Device';
  const osVersion = Device.osVersion || 'Unknown';

  const aboutItems: AboutItem[] = [
    {
      id: 'version',
      title: 'Version',
      value: `Beta ${appVersion}`,
      type: 'info',
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Help us improve Fare',
      icon: 'message-circle',
      onPress: () => sendFeedback(),
      type: 'action',
    },
  ];

  const legalItems: AboutItem[] = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      onPress: () => openPrivacyPolicy(),
      type: 'link',
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Terms and conditions',
      onPress: () => openTermsOfService(),
      type: 'link',
    },
    {
      id: 'delete-account',
      title: 'Account Deletion',
      subtitle: 'Request account removal',
      onPress: () => handleDeleteAccount(),
      type: 'link',
    },
  ];

  const _openWebsite = () => {
    Linking.openURL('https://getfare.app');
  };

  const _openSupport = () => {
    Linking.openURL('https://getfare.app/support');
  };

  const sendFeedback = () => {
    const emailSubject = encodeURIComponent('Fare Beta Feedback');
    const emailBody = encodeURIComponent(
      `Hi Fare Team,\n\nI'd like to share some feedback about the beta app:\n\n` +
        `App Version: Beta ${appVersion}\n` +
        `Device: ${Device.osName} ${osVersion}\n\n` +
        `My feedback:\n\n`
    );

    Linking.openURL(`mailto:feedback@getfare.app?subject=${emailSubject}&body=${emailBody}`);
  };

  const openPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const openTermsOfService = () => {
    navigation.navigate('TermsOfService');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact Support', 
          onPress: () => {
            const emailSubject = encodeURIComponent('Account Deletion Request');
            const emailBody = encodeURIComponent(
              'I would like to request the deletion of my Fare account.\n\n' +
              `Email: [Please provide your account email]\n` +
              `Reason: [Optional]\n`
            );
            Linking.openURL(`mailto:support@getfare.app?subject=${emailSubject}&body=${emailBody}`);
          }
        }
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderInfoItem = (item: AboutItem) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{item.title}</Text>
      <Text style={styles.infoValue}>{item.value}</Text>
    </View>
  );

  const renderActionItem = (item: AboutItem) => (
    <Pressable
      style={({ pressed }) => [styles.actionItem, pressed && styles.pressedItem]}
      onPress={item.onPress}
    >
      {item.icon && (
        <View style={styles.actionIcon}>
          <Icon name={item.icon as never} size={20} color={theme.colors.primary.main} />
        </View>
      )}
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.actionSubtitle}>{item.subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
    </Pressable>
  );

  const renderSection = (
    title: string,
    items: AboutItem[],
    renderItem: (item: AboutItem) => React.ReactNode
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <View key={item.id}>
            {renderItem(item)}
            {index < items.length - 1 && item.type !== 'info' && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="About" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <Icon name="users" size={40} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.appName}>Fare</Text>
          <Text style={styles.appTagline}>
            Connect over great food
          </Text>
          <Text style={styles.betaBadge}>BETA</Text>
        </View>

        {/* App Information */}
        {renderSection(
          'App Information',
          aboutItems.filter((item) => item.type === 'info'),
          renderInfoItem
        )}

        {/* Actions */}
        {aboutItems.filter((item) => item.type === 'action').length > 0 && 
          renderSection(
            'Support & Feedback',
            aboutItems.filter((item) => item.type === 'action'),
            renderActionItem
          )
        }

        {/* Legal */}
        {renderSection('Legal', legalItems, renderActionItem)}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ in San Francisco</Text>
          <Text style={styles.copyrightText}>© 2025 Fare. All rights reserved.</Text>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContent: {
    flex: 1,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(20),
    height: scaleWidth(40),
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    width: scaleWidth(40),
  },
  actionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  actionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  actionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
  appHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(24),
    paddingVertical: scaleHeight(40),
  },
  appIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(40),
    height: scaleWidth(80),
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
    width: scaleWidth(80),
  },
  appName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(28),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
  },
  appTagline: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(22),
    marginHorizontal: scaleWidth(32),
    textAlign: 'center',
  },
  betaBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(12),
    fontWeight: '700',
    marginTop: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    overflow: 'hidden',
  },
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
  },
  copyrightText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(32),
  },
  footerText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  infoItem: {
    alignItems: 'center',
    borderBottomColor: theme.colors.ui.lighterGray,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  infoLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
  infoValue: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  pressedItem: {
    backgroundColor: theme.colors.ui.lightestGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(24),
  },
  sectionContent: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(8),
    marginHorizontal: scaleWidth(16),
    textTransform: 'uppercase',
  },
  separator: {
    backgroundColor: theme.colors.ui.lighterGray,
    height: 1,
    marginLeft: scaleWidth(20),
  },
});
