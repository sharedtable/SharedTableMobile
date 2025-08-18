import * as Notifications from 'expo-notifications';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
  Platform,
  Linking,
} from 'react-native';

import { TopBar } from '@/components/navigation/TopBar';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface NotificationsScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface NotificationSetting {
  key: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
}

const NOTIFICATION_KEYS = {
  PUSH_ENABLED: 'notifications_push_enabled',
  EVENT_REMINDERS: 'notifications_event_reminders',
  BOOKING_UPDATES: 'notifications_booking_updates',
  CHAT_MESSAGES: 'notifications_chat_messages',
  PROMOTIONAL: 'notifications_promotional',
  SOUND_ENABLED: 'notifications_sound_enabled',
  BADGE_ENABLED: 'notifications_badge_enabled',
} as const;

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const { getPreference, updatePreference } = useUserPreferences();

  const settings: NotificationSetting[] = [
    {
      key: NOTIFICATION_KEYS.PUSH_ENABLED,
      title: 'Push Notifications',
      subtitle: 'Receive notifications on this device',
      enabled: getPreference(NOTIFICATION_KEYS.PUSH_ENABLED, true),
    },
    {
      key: NOTIFICATION_KEYS.EVENT_REMINDERS,
      title: 'Event Reminders',
      subtitle: 'Get reminded about upcoming events',
      enabled: getPreference(NOTIFICATION_KEYS.EVENT_REMINDERS, true),
    },
    {
      key: NOTIFICATION_KEYS.BOOKING_UPDATES,
      title: 'Booking Updates',
      subtitle: 'Status changes for your bookings',
      enabled: getPreference(NOTIFICATION_KEYS.BOOKING_UPDATES, true),
    },
    {
      key: NOTIFICATION_KEYS.CHAT_MESSAGES,
      title: 'Chat Messages',
      subtitle: 'New messages in event chats',
      enabled: getPreference(NOTIFICATION_KEYS.CHAT_MESSAGES, true),
    },
    {
      key: NOTIFICATION_KEYS.PROMOTIONAL,
      title: 'Promotional',
      subtitle: 'Special offers and announcements',
      enabled: getPreference(NOTIFICATION_KEYS.PROMOTIONAL, false),
    },
  ];

  const soundSettings: NotificationSetting[] = [
    {
      key: NOTIFICATION_KEYS.SOUND_ENABLED,
      title: 'Sound',
      subtitle: 'Play sound for notifications',
      enabled: getPreference(NOTIFICATION_KEYS.SOUND_ENABLED, true),
    },
    {
      key: NOTIFICATION_KEYS.BADGE_ENABLED,
      title: 'Badge',
      subtitle: 'Show badge count on app icon',
      enabled: getPreference(NOTIFICATION_KEYS.BADGE_ENABLED, true),
    },
  ];

  const [systemPermissions, setSystemPermissions] = useState({
    granted: false,
    canAskAgain: true,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      setSystemPermissions({
        granted: status === 'granted',
        canAskAgain,
      });
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      setSystemPermissions({
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
      });

      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in Settings to receive updates about your events and bookings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
    }
  };

  const updateSetting = async (key: string, enabled: boolean) => {
    try {
      // If enabling push notifications and no system permission, request it
      if (key === NOTIFICATION_KEYS.PUSH_ENABLED && enabled && !systemPermissions.granted) {
        await requestPermissions();
        // Check if permission was granted
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          return; // Don't update setting if permission denied
        }
      }

      // Update preference using the hook
      const success = await updatePreference(key, enabled);

      if (!success) {
        Alert.alert('Error', 'Failed to update notification setting');
        return;
      }

      // Configure notification behavior
      if (key === NOTIFICATION_KEYS.SOUND_ENABLED || key === NOTIFICATION_KEYS.BADGE_ENABLED) {
        const soundEnabled =
          key === NOTIFICATION_KEYS.SOUND_ENABLED
            ? enabled
            : getPreference(NOTIFICATION_KEYS.SOUND_ENABLED, true);
        const badgeEnabled =
          key === NOTIFICATION_KEYS.BADGE_ENABLED
            ? enabled
            : getPreference(NOTIFICATION_KEYS.BADGE_ENABLED, true);

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: soundEnabled,
            shouldSetBadge: badgeEnabled,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const handleBack = () => {
    onNavigate?.('settings');
  };

  const renderSettingSection = (title: string, sectionSettings: NotificationSetting[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingsList}>
        {sectionSettings.map((setting, index) => {
          const isDisabled =
            setting.key !== NOTIFICATION_KEYS.PUSH_ENABLED && !systemPermissions.granted;

          return (
            <View
              key={setting.key}
              style={[
                styles.settingsItem,
                index === sectionSettings.length - 1 && styles.lastItem,
                isDisabled && styles.disabledItem,
              ]}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, isDisabled && styles.disabledText]}>
                  {setting.title}
                </Text>
                {setting.subtitle && (
                  <Text style={[styles.settingSubtitle, isDisabled && styles.disabledText]}>
                    {setting.subtitle}
                  </Text>
                )}
              </View>
              <Switch
                value={
                  setting.enabled && (!isDisabled || setting.key === NOTIFICATION_KEYS.PUSH_ENABLED)
                }
                onValueChange={(enabled) => updateSetting(setting.key, enabled)}
                trackColor={{
                  false: '#E5E5E5',
                  true: theme.colors.primary.main,
                }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                disabled={isDisabled && setting.key !== NOTIFICATION_KEYS.PUSH_ENABLED}
              />
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Notifications" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!systemPermissions.granted && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              Notifications are disabled in Settings. Enable them to receive important updates.
            </Text>
          </View>
        )}

        {renderSettingSection('Push Notifications', settings)}
        {renderSettingSection('Alert Settings', soundSettings)}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoText}>
            • Event reminders help you prepare for upcoming dining experiences{'\n'}• Booking
            updates keep you informed about status changes{'\n'}• Chat messages ensure you
            don&apos;t miss important coordination{'\n'}• You can change these settings anytime
          </Text>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.text.secondary,
  },
  infoSection: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    padding: scaleWidth(20),
  },
  infoText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
  infoTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(12),
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  permissionBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    margin: scaleWidth(16),
    padding: scaleWidth(16),
  },
  permissionText: {
    color: '#856404',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    textAlign: 'center',
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
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  settingsList: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
});
