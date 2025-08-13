import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { useAuth } from '@/lib/auth';
import { BiometricAuthService, BiometricType } from '@/lib/auth/services/biometricAuth';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface BiometricSettingsProps {
  testID?: string;
}

export const BiometricSettings = memo<BiometricSettingsProps>(({ testID }) => {
  const {
    biometricCapabilities,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    checkBiometricCapabilities,
    user,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Check capabilities on mount
  useEffect(() => {
    if (!biometricCapabilities) {
      setChecking(true);
      checkBiometricCapabilities().finally(() => setChecking(false));
    }
  }, []);

  const getBiometricIcon = (): string => {
    if (!biometricCapabilities?.supportedTypes.length) return 'finger-print';

    const types = biometricCapabilities.supportedTypes;

    if (types.includes(BiometricType.FACE_ID)) {
      return Platform.OS === 'ios' ? 'scan' : 'scan-circle';
    }
    if (types.includes(BiometricType.FINGERPRINT)) {
      return 'finger-print';
    }
    if (types.includes(BiometricType.IRIS)) {
      return 'eye';
    }
    return 'lock-closed';
  };

  const getBiometricTitle = (): string => {
    if (!biometricCapabilities?.supportedTypes.length) return 'Biometric Authentication';

    return BiometricAuthService.getBiometricTypeName(biometricCapabilities.supportedTypes);
  };

  const getBiometricDescription = (): string => {
    if (!user) return 'Sign in to enable biometric authentication';

    if (!biometricCapabilities?.isAvailable) {
      return 'Biometric authentication is not available on this device';
    }

    if (!biometricCapabilities?.isEnrolled) {
      return 'Please set up biometric authentication in your device settings first';
    }

    if (isBiometricEnabled) {
      return `Use ${getBiometricTitle().toLowerCase()} to quickly access your account`;
    }

    return `Enable ${getBiometricTitle().toLowerCase()} for quick and secure access`;
  };

  const getSecurityLevelText = (): string => {
    if (!biometricCapabilities) return '';

    const securityLevel = biometricCapabilities.securityLevel;
    switch (securityLevel) {
      case 1: // NONE
        return 'No security';
      case 2: // WEAK
        return 'Weak security';
      case 3: // STRONG
        return 'Strong security';
      default:
        return 'Unknown security level';
    }
  };

  const handleToggleBiometric = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to enable biometric authentication');
      return;
    }

    if (!biometricCapabilities?.isAvailable || !biometricCapabilities?.isEnrolled) {
      Alert.alert(
        'Biometric Setup Required',
        'Please set up biometric authentication in your device settings first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => {
              // In a real app, you might deep link to device settings
              Alert.alert(
                'Setup Instructions',
                'Go to Settings > Face ID & Passcode (or Touch ID & Passcode) to set up biometric authentication.'
              );
            },
          },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      if (isBiometricEnabled) {
        // Disable biometric
        Alert.alert(
          'Disable Biometric Authentication',
          `Are you sure you want to disable ${getBiometricTitle().toLowerCase()}? You'll need to enter your verification code each time you sign in.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableBiometric();
                Alert.alert('Disabled', 'Biometric authentication has been disabled.');
              },
            },
          ]
        );
      } else {
        // Enable biometric
        const result = await enableBiometric();

        if (result.success) {
          Alert.alert(
            'Enabled Successfully',
            `${getBiometricTitle()} has been enabled. You can now use it to quickly access your account.`
          );
        } else {
          Alert.alert(
            'Setup Failed',
            result.error || 'Failed to enable biometric authentication. Please try again.'
          );
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    !user || !biometricCapabilities?.isAvailable || !biometricCapabilities?.isEnrolled || loading;

  if (checking) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Checking biometric capabilities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        style={({ pressed }) => [
          styles.settingItem,
          isDisabled && styles.settingItemDisabled,
          pressed && !isDisabled && styles.settingItemPressed,
        ]}
        onPress={handleToggleBiometric}
        disabled={isDisabled}
        testID={`${testID}-toggle`}
      >
        <View style={styles.settingIcon}>
          <Ionicons
            name={getBiometricIcon() as any}
            size={24}
            color={isDisabled ? theme.colors.text.disabled : theme.colors.primary.main}
          />
        </View>

        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, isDisabled && styles.settingTitleDisabled]}>
            {getBiometricTitle()}
          </Text>
          <Text
            style={[styles.settingDescription, isDisabled && styles.settingDescriptionDisabled]}
          >
            {getBiometricDescription()}
          </Text>

          {biometricCapabilities?.isAvailable && (
            <Text style={styles.securityLevel}>Security Level: {getSecurityLevelText()}</Text>
          )}
        </View>

        <View style={styles.settingAction}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            <View
              style={[
                styles.toggle,
                isBiometricEnabled && !isDisabled && styles.toggleEnabled,
                isDisabled && styles.toggleDisabled,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  isBiometricEnabled && !isDisabled && styles.toggleThumbEnabled,
                ]}
              />
            </View>
          )}
        </View>
      </Pressable>

      {/* Security information */}
      {biometricCapabilities?.isAvailable && (
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.success.main} />
          <Text style={styles.securityInfoText}>
            Your biometric data is stored securely on your device and never shared
          </Text>
        </View>
      )}
    </View>
  );
});

BiometricSettings.displayName = 'BiometricSettings';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    marginVertical: scaleHeight(8),
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: scaleHeight(24),
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginLeft: scaleWidth(12),
  },
  securityInfo: {
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray['50'],
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  securityInfoText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginLeft: scaleWidth(8),
  },
  securityLevel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginTop: scaleHeight(4),
  },
  settingAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleWidth(16),
  },
  settingContent: {
    flex: 1,
  },
  settingDescription: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
  settingDescriptionDisabled: {
    color: theme.colors.text.disabled,
  },
  settingIcon: {
    alignItems: 'center',
    height: scaleWidth(40),
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    width: scaleWidth(40),
  },
  settingItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingItemPressed: {
    backgroundColor: theme.colors.neutral.gray['50'],
  },
  settingTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  settingTitleDisabled: {
    color: theme.colors.text.disabled,
  },
  toggle: {
    backgroundColor: theme.colors.gray[2],
    borderRadius: scaleWidth(12),
    height: scaleHeight(24),
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(2),
    width: scaleWidth(44),
  },
  toggleDisabled: {
    backgroundColor: theme.colors.gray[1],
  },
  toggleEnabled: {
    backgroundColor: theme.colors.primary.main,
  },
  toggleThumb: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(10),
    height: scaleHeight(20),
    transform: [{ translateX: 0 }],
    width: scaleWidth(20),
  },
  toggleThumbEnabled: {
    transform: [{ translateX: scaleWidth(18) }],
  },
});
