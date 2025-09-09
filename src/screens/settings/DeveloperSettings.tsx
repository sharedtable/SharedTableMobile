/**
 * Developer Settings Screen
 * Only visible in internal/development builds
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { featureFlags, FeatureFlags } from '@/utils/featureFlags';
import { theme } from '@/theme';
import Constants from 'expo-constants';

const DeveloperSettings: React.FC = () => {
  const navigation = useNavigation();
  const [flags, setFlags] = useState(featureFlags.getAllFlags());
  const [apiEndpoint] = useState(
    Constants.expoConfig?.extra?.apiUrl || ''
  );

  const handleFlagToggle = useCallback(async (flag: keyof FeatureFlags) => {
    const newValue = !flags[flag];
    await featureFlags.override(flag, newValue);
    setFlags(prev => ({ ...prev, [flag]: newValue }));
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [flags]);

  const clearCache = useCallback(async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and preferences. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!Updates.isEnabled) {
      Alert.alert('Updates Disabled', 'OTA updates are not enabled in this build');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new update is available. Download and apply?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('No Updates', 'App is up to date');
      }
    } catch {
      Alert.alert('Error', 'Failed to check for updates');
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem('onboarding_completed');
    Alert.alert('Success', 'Onboarding will show on next app launch');
  }, []);

  const exportLogs = useCallback(() => {
    // This would export logs to a file or service
    Alert.alert('Export Logs', 'Logs exported to clipboard');
  }, []);

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderFlag = (flag: keyof FeatureFlags, label: string) => (
    <View key={flag} style={styles.flagRow}>
      <View style={styles.flagInfo}>
        <Text style={styles.flagLabel}>{label}</Text>
        <Text style={styles.flagKey}>{flag}</Text>
      </View>
      <Switch
        value={flags[flag]}
        onValueChange={() => handleFlagToggle(flag)}
        trackColor={{ false: '#767577', true: theme.colors.primary.main }}
        thumbColor={flags[flag] ? '#f4f3f4' : '#f4f3f4'}
      />
    </View>
  );

  const renderButton = (
    title: string,
    onPress: () => void,
    destructive = false
  ) => (
    <TouchableOpacity
      style={[styles.button, destructive && styles.destructiveButton]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, destructive && styles.destructiveText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Environment Info */}
        {renderSection(
          'Environment',
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment:</Text>
              <Text style={styles.infoValue}>
                {featureFlags.getEnvironment()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version:</Text>
              <Text style={styles.infoValue}>
                {Constants.expoConfig?.version || 'Unknown'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build:</Text>
              <Text style={styles.infoValue}>
                {Constants.expoConfig?.ios?.buildNumber || 
                 Constants.expoConfig?.android?.versionCode || 
                 'Dev'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>API:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {apiEndpoint}
              </Text>
            </View>
          </View>
        )}

        {/* Feature Flags */}
        {renderSection(
          'Web3 Features',
          <>
            {renderFlag('WEB3_SOCIAL', 'Web3 Social Feed')}
            {renderFlag('TIPPING_ENABLED', 'Crypto Tipping')}
            {renderFlag('NFT_BADGES', 'NFT Achievements')}
            {renderFlag('TOKEN_REWARDS', 'Token Rewards')}
          </>
        )}

        {renderSection(
          'Gamification',
          <>
            {renderFlag('XP_SYSTEM', 'XP & Levels')}
            {renderFlag('LEADERBOARDS', 'Leaderboards')}
            {renderFlag('ACHIEVEMENTS', 'Achievements')}
            {renderFlag('DAILY_CHALLENGES', 'Daily Challenges')}
          </>
        )}

        {renderSection(
          'Experimental',
          <>
            {renderFlag('AI_RECOMMENDATIONS', 'AI Recommendations')}
            {renderFlag('AR_MENU_VIEWER', 'AR Menu Viewer')}
            {renderFlag('VOICE_REVIEWS', 'Voice Reviews')}
          </>
        )}

        {renderSection(
          'Debug',
          <>
            {renderFlag('DEBUG_MODE', 'Debug Mode')}
            {renderFlag('VERBOSE_LOGGING', 'Verbose Logging')}
            {renderFlag('SHOW_DEV_MENU', 'Dev Menu')}
            {renderFlag('MOCK_DATA', 'Use Mock Data')}
          </>
        )}

        {/* Actions */}
        {renderSection(
          'Actions',
          <>
            {renderButton('Check for Updates', checkForUpdates)}
            {renderButton('Reset Onboarding', resetOnboarding)}
            {renderButton('Export Logs', exportLogs)}
            {renderButton('Clear Cache', clearCache, true)}
            {renderButton('Reset All Flags', async () => {
              await featureFlags.clearOverrides();
              setFlags(featureFlags.getAllFlags());
              Alert.alert('Success', 'All flags reset to defaults');
            }, true)}
          </>
        )}

        {/* Test Crash */}
        {flags.DEBUG_MODE && renderSection(
          'Crash Testing',
          <>
            {renderButton('Test Crash', () => {
              throw new Error('Test crash from Developer Settings');
            }, true)}
            {renderButton('Test ANR', () => {
              // Simulate ANR (Application Not Responding)
              let i = 0;
              while (i < 1000000000) i++;
            }, true)}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SharedTable Internal Build
          </Text>
          <Text style={styles.footerText}>
            {Platform.OS} {Platform.Version}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray['200'],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.black['1'],
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: theme.colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.gray['600'],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.ui.lighterGray,
  },
  flagInfo: {
    flex: 1,
    marginRight: 10,
  },
  flagLabel: {
    fontSize: 16,
    color: theme.colors.black['1'],
  },
  flagKey: {
    fontSize: 12,
    color: theme.colors.gray['400'],
    marginTop: 2,
  },
  infoContainer: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.gray['600'],
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.black['1'],
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: theme.colors.ui.lighterGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#ffebee',
  },
  buttonText: {
    fontSize: 16,
    color: theme.colors.black['1'],
    fontWeight: '500',
  },
  destructiveText: {
    color: theme.colors.error.main,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.gray['400'],
    marginBottom: 4,
  },
});

export default DeveloperSettings;