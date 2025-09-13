import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { supabase } from '@/lib/supabase/client';

interface PrivacySettingsScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface PrivacySettings {
  profileVisibility: 'everyone' | 'matches_only' | 'nobody';
  showLastName: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: 'everyone' | 'matches_only' | 'nobody';
  shareDataForMatching: boolean;
  marketingEmails: boolean;
  showOnlineStatus: boolean;
}

const PRIVACY_SETTINGS_KEY = 'privacy_settings';

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  const { user } = usePrivyAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'everyone',
    showLastName: true,
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: 'everyone',
    shareDataForMatching: true,
    marketingEmails: false,
    showOnlineStatus: true,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      
      // First try to load from AsyncStorage for quick access
      const localSettings = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (localSettings) {
        setSettings(JSON.parse(localSettings));
      }
      
      // Then fetch from database for the source of truth
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_privacy_settings')
          .select('*')
          .eq('user_id', user.id)
          .single() as { data: any; error: any };
        
        if (data && !error) {
          const dbSettings: PrivacySettings = {
            profileVisibility: data.profile_visibility || 'everyone',
            showLastName: data.show_last_name ?? true,
            showEmail: data.show_email ?? false,
            showPhone: data.show_phone ?? false,
            showLocation: data.show_location ?? true,
            allowMessages: data.allow_messages || 'everyone',
            shareDataForMatching: data.share_data_for_matching ?? true,
            marketingEmails: data.marketing_emails ?? false,
            showOnlineStatus: data.show_online_status ?? true,
          };
          
          setSettings(dbSettings);
          // Update local storage with database values
          await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(dbSettings));
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Save to local storage immediately for quick access
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
      
      // Save to database
      if (user?.id) {
        const dbSettings = {
          user_id: user.id,
          profile_visibility: settings.profileVisibility,
          show_last_name: settings.showLastName,
          show_email: settings.showEmail,
          show_phone: settings.showPhone,
          show_location: settings.showLocation,
          allow_messages: settings.allowMessages,
          share_data_for_matching: settings.shareDataForMatching,
          marketing_emails: settings.marketingEmails,
          show_online_status: settings.showOnlineStatus,
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await (supabase
          .from('user_privacy_settings') as any)
          .upsert(dbSettings, {
            onConflict: 'user_id'
          });
        
        if (error) {
          throw error;
        }
      }
      
      Alert.alert('Success', 'Your privacy settings have been updated.');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar title="Privacy" showBack onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Privacy" 
        showBack 
        onBack={handleBack}
        rightAction={
          <Pressable 
            onPress={saveSettings} 
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary.main} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        }
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Visibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <View style={styles.sectionCard}>
            <View style={styles.radioGroup}>
              <Text style={styles.settingLabel}>Who can see your profile?</Text>
              {[
                { value: 'everyone', label: 'Everyone' },
                { value: 'matches_only', label: 'Matches only' },
                { value: 'nobody', label: 'Nobody (hidden)' }
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => updateSetting('profileVisibility', option.value as any)}
                >
                  <View style={styles.radioButton}>
                    {settings.profileVisibility === option.value && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show last name</Text>
              <Switch
                value={settings.showLastName}
                onValueChange={(value) => updateSetting('showLastName', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show email address</Text>
              <Switch
                value={settings.showEmail}
                onValueChange={(value) => updateSetting('showEmail', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show phone number</Text>
              <Switch
                value={settings.showPhone}
                onValueChange={(value) => updateSetting('showPhone', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show location</Text>
              <Switch
                value={settings.showLocation}
                onValueChange={(value) => updateSetting('showLocation', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* Messaging Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messaging</Text>
          <View style={styles.sectionCard}>
            <View style={styles.radioGroup}>
              <Text style={styles.settingLabel}>Who can message you?</Text>
              {[
                { value: 'everyone', label: 'Everyone' },
                { value: 'matches_only', label: 'Matches only' },
                { value: 'nobody', label: 'Nobody' }
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => updateSetting('allowMessages', option.value as any)}
                >
                  <View style={styles.radioButton}>
                    {settings.allowMessages === option.value && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show online status</Text>
              <Switch
                value={settings.showOnlineStatus}
                onValueChange={(value) => updateSetting('showOnlineStatus', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* Data & Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Permissions</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Share data for better matches</Text>
                <Text style={styles.settingDescription}>
                  Help us improve your dining matches by analyzing your preferences
                </Text>
              </View>
              <Switch
                value={settings.shareDataForMatching}
                onValueChange={(value) => updateSetting('shareDataForMatching', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Marketing emails</Text>
                <Text style={styles.settingDescription}>
                  Receive updates about new features and events
                </Text>
              </View>
              <Switch
                value={settings.marketingEmails}
                onValueChange={(value) => updateSetting('marketingEmails', value)}
                trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* Blocked Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <Pressable
            style={({ pressed }) => [
              styles.sectionCard,
              styles.blockedUsersCard,
              pressed && styles.cardPressed
            ]}
            onPress={() => {
              // TODO: Navigate to blocked users list
              Alert.alert('Blocked Users', 'No blocked users yet.');
            }}
          >
            <Text style={styles.settingLabel}>Manage blocked users</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  blockedUsersCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
  },
  cardPressed: {
    backgroundColor: '#F8F8F8',
  },
  container: {
    backgroundColor: '#F5F5F5',
    flex: 1,
  },
  divider: {
    backgroundColor: '#F0F0F0',
    height: 1,
    marginVertical: scaleHeight(2),
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  radioButton: {
    alignItems: 'center',
    borderColor: theme.colors.gray[300],
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    height: scaleWidth(20),
    justifyContent: 'center',
    marginRight: scaleWidth(12),
    width: scaleWidth(20),
  },
  radioButtonSelected: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(5),
    height: scaleWidth(10),
    width: scaleWidth(10),
  },
  radioGroup: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  radioLabel: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(15),
  },
  radioOption: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: scaleHeight(12),
  },
  saveButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
  },
  saveButtonText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: scaleHeight(20),
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(20),
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
    marginHorizontal: scaleWidth(20),
  },
  settingDescription: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(2),
  },
  settingInfo: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  settingLabel: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(15),
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
});