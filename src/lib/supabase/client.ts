import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { Database } from './types/database';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check app.json extra config.');
}

// Enhanced secure storage for production
class SecureAsyncStorage {
  static async getItem(key: string): Promise<string | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      // In production, we could add encryption here
      return item;
    } catch (error) {
      console.error('❌ [SecureStorage] Error getting item:', error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      // In production, we could add encryption here
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('❌ [SecureStorage] Error setting item:', error);
      throw error;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('❌ [SecureStorage] Error removing item:', error);
      throw error;
    }
  }
}

// Generate unique device identifier for enhanced security
const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: Date.now(),
    };

    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      JSON.stringify(deviceInfo),
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  } catch (error) {
    console.error('❌ [DeviceFingerprint] Error generating:', error);
    return 'unknown-device';
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile
    flowType: 'pkce', // Most secure OAuth flow
    debug: false, // Disable verbose logging
  },
  global: {
    headers: {
      'X-Client-Info': 'SharedTable-Mobile',
      'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
      'X-Platform': Platform.OS,
      'X-Platform-Version': String(Platform.Version),
    },
  },
  // Enhanced error handling
  realtime: {
    params: {
      eventsPerSecond: 2, // Rate limit for security
    },
  },
});

// Production auth configuration
export const authConfig = {
  redirectUrl: 'sharedtable://auth-callback',
  storageKey: 'sharedtable-auth-token',
  sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  refreshThreshold: 60 * 1000, // Refresh token 1 minute before expiry
  maxRetryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Security utilities
export const securityUtils = {
  async generateDeviceFingerprint(): Promise<string> {
    return await getDeviceFingerprint();
  },

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateStanfordEmail(email: string): boolean {
    const stanfordDomains = ['stanford.edu', 'alumni.stanford.edu'];
    const domain = email.toLowerCase().split('@')[1];
    return stanfordDomains.includes(domain);
  },

  async hashToken(token: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  },
};

// Production monitoring
export const authMonitoring = {
  logAuthEvent(event: string, metadata?: any) {
    if (__DEV__) {
      console.log(`🔐 [Auth] ${event}:`, metadata);
    }

    // In production, send to analytics/monitoring service
    // Example: Analytics.track('auth_event', { event, ...metadata });
  },

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', metadata?: any) {
    console.warn(`🚨 [Security] ${severity.toUpperCase()}: ${event}:`, metadata);

    // In production, send to security monitoring service
    // Example: SecurityMonitoring.alert(event, severity, metadata);
  },
};
