import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';

import { useAuth } from '@/lib/auth';
import { RateLimitService } from '@/lib/auth/services/rateLimitService';
import { SessionService } from '@/lib/auth/services/sessionService';
import { AuthFlowTestRunner } from '@/lib/auth/tests/authFlowTest';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface MonitoringStats {
  session: {
    hasSession: boolean;
    sessionAge?: number;
    lastAccessed?: number;
    expiresIn?: number;
  };
  biometric: {
    isAvailable: boolean;
    isEnabled: boolean;
    securityLevel: string;
  };
  rateLimits: {
    login: { attemptCount: number; isBlocked: boolean };
    signup: { attemptCount: number; isBlocked: boolean };
    otp: { attemptCount: number; isBlocked: boolean };
  };
}

interface AuthMonitoringDashboardProps {
  testID?: string;
}

export const AuthMonitoringDashboard = memo<AuthMonitoringDashboardProps>(({ testID }) => {
  const { user, biometricCapabilities, isBiometricEnabled } = useAuth();
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load monitoring stats
  const loadStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [sessionStats, loginStatus, signupStatus, otpStatus] = await Promise.all([
        SessionService.getSessionStats(),
        user ? RateLimitService.getStatus('auth_login', user.email || '') : null,
        user ? RateLimitService.getStatus('auth_signup', user.email || '') : null,
        user ? RateLimitService.getStatus('otp_verify', user.email || '') : null,
      ]);

      const newStats: MonitoringStats = {
        session: sessionStats,
        biometric: {
          isAvailable: biometricCapabilities?.isAvailable || false,
          isEnabled: isBiometricEnabled,
          securityLevel: getSecurityLevelText(biometricCapabilities?.securityLevel || 0),
        },
        rateLimits: {
          login: loginStatus || { attemptCount: 0, isBlocked: false },
          signup: signupStatus || { attemptCount: 0, isBlocked: false },
          otp: otpStatus || { attemptCount: 0, isBlocked: false },
        },
      };

      setStats(newStats);
    } catch (error) {
      console.error('Failed to load monitoring stats:', error);
      Alert.alert('Error', 'Failed to load monitoring statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user, biometricCapabilities, isBiometricEnabled]);

  const getSecurityLevelText = (level: number): string => {
    switch (level) {
      case 1:
        return 'None';
      case 2:
        return 'Weak';
      case 3:
        return 'Strong';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const runAuthTests = async () => {
    try {
      setLoading(true);
      const suites = await AuthFlowTestRunner.runAllTests();
      AuthFlowTestRunner.showTestResultsAlert(suites);
    } catch (error) {
      console.error('Test execution failed:', error);
      Alert.alert('Test Error', 'Failed to run authentication tests');
    } finally {
      setLoading(false);
    }
  };

  const clearRateLimits = async () => {
    if (!user?.email) return;

    Alert.alert(
      'Clear Rate Limits',
      'Are you sure you want to clear all rate limits for your account? This is only for development.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                RateLimitService.clearAttempts('auth_login', user.email!),
                RateLimitService.clearAttempts('auth_signup', user.email!),
                RateLimitService.clearAttempts('otp_verify', user.email!),
              ]);
              await loadStats();
              Alert.alert('Success', 'Rate limits cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear rate limits');
            }
          },
        },
      ]
    );
  };

  if (!stats && loading) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.loading}>Loading monitoring data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      testID={testID}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStats(true)} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color={theme.colors.primary.main} />
        <Text style={styles.title}>Auth Monitoring</Text>
      </View>

      {/* User Info */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.valueSmall}>{user.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Provider:</Text>
            <Text style={styles.value}>{user.app_metadata?.provider || 'Unknown'}</Text>
          </View>
        </View>
      )}

      {/* Session Stats */}
      {stats?.session && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Active Session:</Text>
            <Text
              style={[
                styles.value,
                {
                  color: stats.session.hasSession
                    ? theme.colors.success.main
                    : theme.colors.error.main,
                },
              ]}
            >
              {stats.session.hasSession ? 'Yes' : 'No'}
            </Text>
          </View>
          {stats.session.hasSession && (
            <>
              {stats.session.sessionAge && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Session Age:</Text>
                  <Text style={styles.value}>{formatDuration(stats.session.sessionAge)}</Text>
                </View>
              )}
              {stats.session.lastAccessed && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Last Accessed:</Text>
                  <Text style={styles.valueSmall}>
                    {formatTimestamp(stats.session.lastAccessed)}
                  </Text>
                </View>
              )}
              {stats.session.expiresIn && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Expires In:</Text>
                  <Text style={styles.value}>{formatDuration(stats.session.expiresIn)}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Biometric Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Authentication</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Available:</Text>
          <Text
            style={[
              styles.value,
              {
                color: stats?.biometric.isAvailable
                  ? theme.colors.success.main
                  : theme.colors.error.main,
              },
            ]}
          >
            {stats?.biometric.isAvailable ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Enabled:</Text>
          <Text
            style={[
              styles.value,
              {
                color: stats?.biometric.isEnabled
                  ? theme.colors.success.main
                  : theme.colors.text.secondary,
              },
            ]}
          >
            {stats?.biometric.isEnabled ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Security Level:</Text>
          <Text style={styles.value}>{stats?.biometric.securityLevel}</Text>
        </View>
      </View>

      {/* Rate Limit Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate Limits</Text>

        <View style={styles.rateLimitItem}>
          <Text style={styles.rateLimitLabel}>Login Attempts:</Text>
          <Text
            style={[
              styles.rateLimitValue,
              {
                color: stats?.rateLimits.login.isBlocked
                  ? theme.colors.error.main
                  : theme.colors.text.primary,
              },
            ]}
          >
            {stats?.rateLimits.login.attemptCount || 0}{' '}
            {stats?.rateLimits.login.isBlocked && '(BLOCKED)'}
          </Text>
        </View>

        <View style={styles.rateLimitItem}>
          <Text style={styles.rateLimitLabel}>Signup Attempts:</Text>
          <Text
            style={[
              styles.rateLimitValue,
              {
                color: stats?.rateLimits.signup.isBlocked
                  ? theme.colors.error.main
                  : theme.colors.text.primary,
              },
            ]}
          >
            {stats?.rateLimits.signup.attemptCount || 0}{' '}
            {stats?.rateLimits.signup.isBlocked && '(BLOCKED)'}
          </Text>
        </View>

        <View style={styles.rateLimitItem}>
          <Text style={styles.rateLimitLabel}>OTP Attempts:</Text>
          <Text
            style={[
              styles.rateLimitValue,
              {
                color: stats?.rateLimits.otp.isBlocked
                  ? theme.colors.error.main
                  : theme.colors.text.primary,
              },
            ]}
          >
            {stats?.rateLimits.otp.attemptCount || 0}{' '}
            {stats?.rateLimits.otp.isBlocked && '(BLOCKED)'}
          </Text>
        </View>
      </View>

      {/* Development Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development Tools</Text>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={runAuthTests}
          disabled={loading}
        >
          <Ionicons name="bug" size={20} color={theme.colors.white} />
          <Text style={styles.actionButtonText}>Run Auth Tests</Text>
        </Pressable>

        {user && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.dangerButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={clearRateLimits}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Clear Rate Limits</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => loadStats()}
          disabled={loading}
        >
          <Ionicons name="sync" size={20} color={theme.colors.primary.main} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary.main }]}>
            Refresh Stats
          </Text>
        </Pressable>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="warning" size={16} color={theme.colors.warning.main} />
        <Text style={styles.securityNoticeText}>
          This monitoring dashboard is for development only. Remove from production builds.
        </Text>
      </View>
    </ScrollView>
  );
});

AuthMonitoringDashboard.displayName = 'AuthMonitoringDashboard';

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(8),
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    paddingVertical: scaleHeight(12),
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginLeft: scaleWidth(8),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    padding: scaleWidth(16),
  },
  dangerButton: {
    backgroundColor: theme.colors.error.main,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: scaleHeight(24),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  loading: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  rateLimitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  rateLimitLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  rateLimitValue: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderWidth: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(16),
    padding: scaleWidth(16),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(12),
  },
  securityNotice: {
    alignItems: 'center',
    backgroundColor: theme.colors.warning.light || 'rgba(255, 193, 7, 0.1)',
    borderRadius: scaleWidth(8),
    flexDirection: 'row',
    marginTop: scaleHeight(16),
    padding: scaleWidth(12),
  },
  securityNoticeText: {
    color: theme.colors.warning.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginLeft: scaleWidth(8),
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginLeft: scaleWidth(12),
  },
  value: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '400',
  },
  valueSmall: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    fontWeight: '400',
  },
});
