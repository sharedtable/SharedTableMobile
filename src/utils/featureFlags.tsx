import { theme } from "@/theme";
/**
 * Feature Flags System for Internal Testing
 * Allows enabling/disabling features for different environments
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlags {
  // Social Features
  WEB3_SOCIAL: boolean;
  TIPPING_ENABLED: boolean;
  NFT_BADGES: boolean;
  TOKEN_REWARDS: boolean;
  
  // Gamification
  XP_SYSTEM: boolean;
  LEADERBOARDS: boolean;
  ACHIEVEMENTS: boolean;
  DAILY_CHALLENGES: boolean;
  
  // Experimental
  AI_RECOMMENDATIONS: boolean;
  AR_MENU_VIEWER: boolean;
  VOICE_REVIEWS: boolean;
  
  // Debug
  DEBUG_MODE: boolean;
  VERBOSE_LOGGING: boolean;
  SHOW_DEV_MENU: boolean;
  MOCK_DATA: boolean;
}

// Default flags per environment
const defaultFlags: Record<string, FeatureFlags> = {
  development: {
    WEB3_SOCIAL: true,
    TIPPING_ENABLED: true,
    NFT_BADGES: true,
    TOKEN_REWARDS: true,
    XP_SYSTEM: true,
    LEADERBOARDS: true,
    ACHIEVEMENTS: true,
    DAILY_CHALLENGES: true,
    AI_RECOMMENDATIONS: true,
    AR_MENU_VIEWER: true,
    VOICE_REVIEWS: true,
    DEBUG_MODE: true,
    VERBOSE_LOGGING: true,
    SHOW_DEV_MENU: true,
    MOCK_DATA: true,
  },
  internal: {
    WEB3_SOCIAL: true,
    TIPPING_ENABLED: true,
    NFT_BADGES: false,
    TOKEN_REWARDS: false,
    XP_SYSTEM: true,
    LEADERBOARDS: true,
    ACHIEVEMENTS: true,
    DAILY_CHALLENGES: false,
    AI_RECOMMENDATIONS: false,
    AR_MENU_VIEWER: false,
    VOICE_REVIEWS: false,
    DEBUG_MODE: true,
    VERBOSE_LOGGING: true,
    SHOW_DEV_MENU: true,
    MOCK_DATA: false,
  },
  preview: {
    WEB3_SOCIAL: false,
    TIPPING_ENABLED: false,
    NFT_BADGES: false,
    TOKEN_REWARDS: false,
    XP_SYSTEM: true,
    LEADERBOARDS: true,
    ACHIEVEMENTS: true,
    DAILY_CHALLENGES: false,
    AI_RECOMMENDATIONS: false,
    AR_MENU_VIEWER: false,
    VOICE_REVIEWS: false,
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    SHOW_DEV_MENU: false,
    MOCK_DATA: false,
  },
  production: {
    WEB3_SOCIAL: false,
    TIPPING_ENABLED: false,
    NFT_BADGES: false,
    TOKEN_REWARDS: false,
    XP_SYSTEM: false,
    LEADERBOARDS: false,
    ACHIEVEMENTS: false,
    DAILY_CHALLENGES: false,
    AI_RECOMMENDATIONS: false,
    AR_MENU_VIEWER: false,
    VOICE_REVIEWS: false,
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    SHOW_DEV_MENU: false,
    MOCK_DATA: false,
  },
};

class FeatureFlagManager {
  private flags: FeatureFlags;
  private environment: string;
  private overrides: Partial<FeatureFlags> = {};
  
  constructor() {
    this.environment = Constants.expoConfig?.extra?.env || 'production';
    this.flags = defaultFlags[this.environment] || defaultFlags.production;
    this.loadOverrides();
  }
  
  /**
   * Load flag overrides from AsyncStorage (for runtime changes)
   */
  private async loadOverrides() {
    try {
      const stored = await AsyncStorage.getItem('feature_flag_overrides');
      if (stored) {
        this.overrides = JSON.parse(stored);
        this.flags = { ...this.flags, ...this.overrides };
      }
    } catch (error) {
      console.error('Failed to load feature flag overrides:', error);
    }
  }
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    // Check for override first
    if (flag in this.overrides) {
      return this.overrides[flag] as boolean;
    }
    
    // Check remote config (if implemented)
    // This could fetch from your backend
    
    // Fall back to default
    return this.flags[flag] || false;
  }
  
  /**
   * Override a feature flag (for testing)
   */
  async override(flag: keyof FeatureFlags, value: boolean) {
    this.overrides[flag] = value;
    this.flags[flag] = value;
    
    try {
      await AsyncStorage.setItem(
        'feature_flag_overrides',
        JSON.stringify(this.overrides)
      );
    } catch (error) {
      console.error('Failed to save feature flag override:', error);
    }
  }
  
  /**
   * Clear all overrides
   */
  async clearOverrides() {
    this.overrides = {};
    this.flags = defaultFlags[this.environment] || defaultFlags.production;
    
    try {
      await AsyncStorage.removeItem('feature_flag_overrides');
    } catch (error) {
      console.error('Failed to clear overrides:', error);
    }
  }
  
  /**
   * Get all current flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
  
  /**
   * Get environment
   */
  getEnvironment(): string {
    return this.environment;
  }
  
  /**
   * Check if running in test mode
   */
  isTestMode(): boolean {
    return this.environment === 'development' || this.environment === 'internal';
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React Hook for feature flags
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const [enabled, setEnabled] = useState(featureFlags.isEnabled(flag));
  
  useEffect(() => {
    // Re-check when component mounts
    setEnabled(featureFlags.isEnabled(flag));
    
    // Could add listener for flag changes here
  }, [flag]);
  
  return enabled;
}

// HOC for feature-gated components
export function withFeatureFlag<P extends object>(
  flag: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const enabled = useFeatureFlag(flag);
    
    if (enabled) {
      return <Component {...props} />;
    }
    
    if (Fallback) {
      return <Fallback {...props} />;
    }
    
    return null;
  };
  
  WrappedComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

// Utility to check multiple flags
export function useFeatureFlags(...flags: (keyof FeatureFlags)[]): boolean[] {
  // We need to call hooks unconditionally, so we get all flags first
  const flagStates: boolean[] = [];
  
   
  for (const flag of flags) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    flagStates.push(useFeatureFlag(flag));
  }
  
  return flagStates;
}

// Debug component for internal builds
export function FeatureFlagDebugger() {
  if (!featureFlags.isTestMode()) {
    return null;
  }
  
  const allFlags = featureFlags.getAllFlags();
  
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>
        Feature Flags ({featureFlags.getEnvironment()})
      </Text>
      {Object.entries(allFlags).map(([key, value]) => (
        <View key={key} style={styles.flagRow}>
          <Text style={styles.flagName}>{key}</Text>
          <Switch
            value={value}
            onValueChange={(newValue) => {
              featureFlags.override(key as keyof FeatureFlags, newValue);
            }}
          />
        </View>
      ))}
    </View>
  );
}

// Styles for debug component
const styles = StyleSheet.create({
  debugContainer: {
    backgroundColor: theme.colors.overlay.darkest,
    padding: 20,
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 10,
    zIndex: 9999,
  },
  debugTitle: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  flagName: {
    color: theme.colors.white,
    fontSize: 14,
  },
});