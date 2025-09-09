import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  Pressable,
  Alert,
  Linking,
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface PrivacySecurityScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface PrivacySetting {
  key: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  type: 'toggle' | 'navigation' | 'action';
  icon?: string;
  onPress?: () => void;
}

const PRIVACY_KEYS = {
  BIOMETRIC_AUTH: 'privacy_biometric_auth',
  PROFILE_VISIBILITY: 'privacy_profile_visibility',
  LOCATION_SHARING: 'privacy_location_sharing',
  DATA_ANALYTICS: 'privacy_data_analytics',
  ACTIVITY_STATUS: 'privacy_activity_status',
} as const;

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({ onNavigate }) => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      key: PRIVACY_KEYS.BIOMETRIC_AUTH,
      title: 'Biometric Authentication',
      subtitle: 'Use Face ID or Touch ID to unlock app',
      enabled: false,
      type: 'toggle',
    },
    {
      key: PRIVACY_KEYS.PROFILE_VISIBILITY,
      title: 'Public Profile',
      subtitle: 'Allow others to find your profile',
      enabled: true,
      type: 'toggle',
    },
    {
      key: PRIVACY_KEYS.LOCATION_SHARING,
      title: 'Location Sharing',
      subtitle: 'Share location with event participants',
      enabled: false,
      type: 'toggle',
    },
    {
      key: PRIVACY_KEYS.ACTIVITY_STATUS,
      title: 'Activity Status',
      subtitle: "Show when you're active in the app",
      enabled: true,
      type: 'toggle',
    },
    {
      key: PRIVACY_KEYS.DATA_ANALYTICS,
      title: 'Analytics & Improvements',
      subtitle: 'Help improve app with usage data',
      enabled: true,
      type: 'toggle',
    },
  ]);

  const securityActions: PrivacySetting[] = [
    {
      key: 'change_password',
      title: 'Change Password',
      subtitle: 'Update your account password',
      enabled: false,
      type: 'navigation',
      icon: 'lock',
      onPress: () => handleChangePassword(),
    },
    {
      key: 'two_factor',
      title: 'Two-Factor Authentication',
      subtitle: 'Add extra security to your account',
      enabled: false,
      type: 'navigation',
      icon: 'shield',
      onPress: () => handleTwoFactor(),
    },
    {
      key: 'active_sessions',
      title: 'Active Sessions',
      subtitle: 'Manage devices signed into your account',
      enabled: false,
      type: 'navigation',
      icon: 'smartphone',
      onPress: () => handleActiveSessions(),
    },
    {
      key: 'download_data',
      title: 'Download My Data',
      subtitle: 'Get a copy of your information',
      enabled: false,
      type: 'action',
      icon: 'download',
      onPress: () => handleDownloadData(),
    },
    {
      key: 'delete_account',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      enabled: false,
      type: 'action',
      icon: 'trash',
      onPress: () => handleDeleteAccount(),
    },
  ];

  const legalItems: PrivacySetting[] = [
    {
      key: 'privacy_policy',
      title: 'Privacy Policy',
      subtitle: 'How we protect and use your data',
      enabled: false,
      type: 'navigation',
      onPress: () => openPrivacyPolicy(),
    },
    {
      key: 'terms_service',
      title: 'Terms of Service',
      subtitle: 'Terms and conditions of use',
      enabled: false,
      type: 'navigation',
      onPress: () => openTermsOfService(),
    },
  ];

  useEffect(() => {
    loadSettings();
    checkBiometricSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await Promise.all(
        privacySettings.map(async (setting) => {
          const value = await AsyncStorage.getItem(setting.key);
          return {
            ...setting,
            enabled: value !== null ? JSON.parse(value) : setting.enabled,
          };
        })
      );
      setPrivacySettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const checkBiometricSupport = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setBiometricAvailable(isAvailable && isEnrolled);

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Failed to check biometric support:', error);
    }
  };

  const updatePrivacySetting = async (key: string, enabled: boolean) => {
    try {
      if (key === PRIVACY_KEYS.BIOMETRIC_AUTH && enabled) {
        // Authenticate before enabling biometric auth
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          disableDeviceFallback: false,
        });

        if (!result.success) {
          return; // Don't update setting if authentication failed
        }
      }

      await AsyncStorage.setItem(key, JSON.stringify(enabled));

      setPrivacySettings((prev) =>
        prev.map((setting) => (setting.key === key ? { ...setting, enabled } : setting))
      );
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'You will be redirected to change your password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: () => {
          // Navigate to change password flow
          onNavigate?.('change-password');
        },
      },
    ]);
  };

  const handleTwoFactor = () => {
    Alert.alert('Two-Factor Authentication', 'Add an extra layer of security to your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Set Up',
        onPress: () => {
          // Navigate to 2FA setup
          onNavigate?.('two-factor-setup');
        },
      },
    ]);
  };

  const handleActiveSessions = () => {
    onNavigate?.('active-sessions');
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Data',
      "We'll prepare your data and send you a download link via email. This may take up to 24 hours.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            // API call to request data download
            Alert.alert(
              'Request Sent',
              "You'll receive an email with your data download link within 24 hours."
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you sure?', 'Type "DELETE" to confirm account deletion.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm',
                style: 'destructive',
                onPress: () => {
                  // Navigate to account deletion flow
                  onNavigate?.('delete-account');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://sharedtable.app/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://sharedtable.app/terms');
  };

  const handleBack = () => {
    onNavigate?.('settings');
  };

  const renderToggleSetting = (setting: PrivacySetting) => {
    const isDisabled = setting.key === PRIVACY_KEYS.BIOMETRIC_AUTH && !biometricAvailable;

    return (
      <View style={[styles.settingsItem, isDisabled && styles.disabledItem]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, isDisabled && styles.disabledText]}>
            {setting.key === PRIVACY_KEYS.BIOMETRIC_AUTH ? `${biometricType} Login` : setting.title}
          </Text>
          {setting.subtitle && (
            <Text style={[styles.settingSubtitle, isDisabled && styles.disabledText]}>
              {setting.subtitle}
            </Text>
          )}
          {isDisabled && (
            <Text style={styles.unavailableText}>{biometricType} not available on this device</Text>
          )}
        </View>
        <Switch
          value={setting.enabled && !isDisabled}
          onValueChange={(enabled) => updatePrivacySetting(setting.key, enabled)}
          trackColor={{
            false: theme.colors.ui.lightGray,
            true: theme.colors.primary.main,
          }}
          thumbColor="#FFFFFF"
          disabled={isDisabled}
        />
      </View>
    );
  };

  const renderActionSetting = (setting: PrivacySetting) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
        setting.key === 'delete_account' && styles.dangerItem,
      ]}
      onPress={setting.onPress}
    >
      {setting.icon && (
        <View style={[styles.iconContainer, setting.key === 'delete_account' && styles.dangerIcon]}>
          <Icon
            name={setting.icon as never}
            size={20}
            color={setting.key === 'delete_account' ? '#FF4444' : theme.colors.primary.main}
          />
        </View>
      )}
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, setting.key === 'delete_account' && styles.dangerText]}>
          {setting.title}
        </Text>
        {setting.subtitle && <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
    </Pressable>
  );

  const renderSection = (
    title: string,
    items: PrivacySetting[],
    renderItem: (item: PrivacySetting) => React.ReactNode
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingsList}>
        {items.map((item, index) => (
          <View key={item.key}>
            {renderItem(item)}
            {index < items.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Privacy & Security" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection('Privacy Controls', privacySettings, renderToggleSetting)}
        {renderSection('Security', securityActions, renderActionSetting)}
        {renderSection('Legal', legalItems, renderActionSetting)}

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.paper,
    flex: 1,
  },
  dangerIcon: {
    backgroundColor: theme.colors.ui.redLight,
  },
  dangerItem: {
    // Special styling for dangerous actions
  },
  dangerText: {
    color: theme.colors.error.light,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.text.secondary,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(20),
    height: scaleWidth(40),
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    width: scaleWidth(40),
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(24),
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
  settingContent: {
    flex: 1,
    marginRight: scaleWidth(16),
  },
  settingSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  settingTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
  settingsItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  settingsItemPressed: {
    backgroundColor: theme.colors.ui.lightestGray,
  },
  settingsList: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.ui.lightGray,
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  unavailableText: {
    color: theme.colors.warning.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(2),
  },
});
