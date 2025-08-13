import AsyncStorage from '@react-native-async-storage/async-storage';

import { authMonitoring } from '../../supabase/client';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  isBlocked: boolean;
  blockExpiresAt?: number;
}

export interface RateLimitAttempt {
  timestamp: number;
  action: string;
  identifier: string;
}

export class RateLimitService {
  private static readonly STORAGE_PREFIX = 'rate_limit_';
  private static readonly BLOCK_PREFIX = 'rate_limit_block_';

  // Default rate limits for different actions
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    auth_login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    auth_signup: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    otp_request: {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    otp_verify: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    oauth_attempt: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    biometric_auth: {
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 20 * 60 * 1000, // 20 minutes
    },
  };

  /**
   * Check if action is allowed for identifier
   */
  static async checkRateLimit(
    action: string,
    identifier: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      const rateLimitConfig = { ...this.DEFAULT_CONFIGS[action], ...config };

      if (!rateLimitConfig.maxAttempts) {
        // No rate limit configured for this action
        return {
          allowed: true,
          remainingAttempts: Infinity,
          resetTime: 0,
          isBlocked: false,
        };
      }

      const key = this.getStorageKey(action, identifier);
      const blockKey = this.getBlockKey(action, identifier);
      const now = Date.now();

      // Check if currently blocked
      const blockInfo = await this.getBlockInfo(blockKey);
      if (blockInfo && now < blockInfo.expiresAt) {
        authMonitoring.logSecurityEvent('rate_limit_blocked_attempt', 'medium', {
          action,
          identifier,
          blockExpiresAt: blockInfo.expiresAt,
        });

        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: blockInfo.expiresAt,
          isBlocked: true,
          blockExpiresAt: blockInfo.expiresAt,
        };
      }

      // Get recent attempts
      const attempts = await this.getRecentAttempts(key, rateLimitConfig.windowMs);
      const remainingAttempts = Math.max(0, rateLimitConfig.maxAttempts - attempts.length);
      const oldestAttempt = attempts[0];
      const resetTime = oldestAttempt ? oldestAttempt.timestamp + rateLimitConfig.windowMs : now;

      if (attempts.length >= rateLimitConfig.maxAttempts) {
        // Rate limit exceeded, block the identifier
        await this.blockIdentifier(blockKey, rateLimitConfig.blockDurationMs);

        authMonitoring.logSecurityEvent('rate_limit_exceeded', 'high', {
          action,
          identifier,
          attempts: attempts.length,
          maxAttempts: rateLimitConfig.maxAttempts,
          blockDuration: rateLimitConfig.blockDurationMs,
        });

        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: now + rateLimitConfig.blockDurationMs,
          isBlocked: true,
          blockExpiresAt: now + rateLimitConfig.blockDurationMs,
        };
      }

      return {
        allowed: true,
        remainingAttempts,
        resetTime,
        isBlocked: false,
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_check_error', 'medium', {
        action,
        identifier,
        error,
      });

      // On error, allow the action but log it
      return {
        allowed: true,
        remainingAttempts: 1,
        resetTime: Date.now(),
        isBlocked: false,
      };
    }
  }

  /**
   * Record an attempt for rate limiting
   */
  static async recordAttempt(action: string, identifier: string): Promise<void> {
    try {
      const key = this.getStorageKey(action, identifier);
      const attempt: RateLimitAttempt = {
        timestamp: Date.now(),
        action,
        identifier,
      };

      const existingData = await AsyncStorage.getItem(key);
      const attempts: RateLimitAttempt[] = existingData ? JSON.parse(existingData) : [];

      attempts.push(attempt);
      await AsyncStorage.setItem(key, JSON.stringify(attempts));

      authMonitoring.logAuthEvent('rate_limit_attempt_recorded', {
        action,
        identifier,
        totalAttempts: attempts.length,
      });
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_record_error', 'low', {
        action,
        identifier,
        error,
      });
    }
  }

  /**
   * Clear attempts for an identifier (e.g., after successful auth)
   */
  static async clearAttempts(action: string, identifier: string): Promise<void> {
    try {
      const key = this.getStorageKey(action, identifier);
      const blockKey = this.getBlockKey(action, identifier);

      await Promise.all([
        AsyncStorage.removeItem(key).catch(() => {}),
        AsyncStorage.removeItem(blockKey).catch(() => {}),
      ]);

      authMonitoring.logAuthEvent('rate_limit_attempts_cleared', {
        action,
        identifier,
      });
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_clear_error', 'low', {
        action,
        identifier,
        error,
      });
    }
  }

  /**
   * Get current status for an identifier
   */
  static async getStatus(
    action: string,
    identifier: string
  ): Promise<{
    attemptCount: number;
    isBlocked: boolean;
    blockExpiresAt?: number;
    nextResetAt: number;
  }> {
    try {
      const config = this.DEFAULT_CONFIGS[action];
      if (!config) {
        return {
          attemptCount: 0,
          isBlocked: false,
          nextResetAt: 0,
        };
      }

      const key = this.getStorageKey(action, identifier);
      const blockKey = this.getBlockKey(action, identifier);
      const now = Date.now();

      const [attempts, blockInfo] = await Promise.all([
        this.getRecentAttempts(key, config.windowMs),
        this.getBlockInfo(blockKey),
      ]);

      const isBlocked = blockInfo && now < blockInfo.expiresAt;
      const oldestAttempt = attempts[0];
      const nextResetAt = oldestAttempt ? oldestAttempt.timestamp + config.windowMs : now;

      return {
        attemptCount: attempts.length,
        isBlocked: !!isBlocked,
        blockExpiresAt: blockInfo?.expiresAt,
        nextResetAt,
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_status_error', 'low', {
        action,
        identifier,
        error,
      });

      return {
        attemptCount: 0,
        isBlocked: false,
        nextResetAt: 0,
      };
    }
  }

  /**
   * Clean up old rate limit data
   */
  static async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(
        (key) => key.startsWith(this.STORAGE_PREFIX) || key.startsWith(this.BLOCK_PREFIX)
      );

      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const key of rateLimitKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (!data) continue;

          if (key.startsWith(this.BLOCK_PREFIX)) {
            const blockInfo = JSON.parse(data);
            if (now > blockInfo.expiresAt) {
              keysToDelete.push(key);
            }
          } else {
            const attempts: RateLimitAttempt[] = JSON.parse(data);
            const recentAttempts = attempts.filter(
              (attempt) => now - attempt.timestamp < 24 * 60 * 60 * 1000 // Keep for 24 hours
            );

            if (recentAttempts.length === 0) {
              keysToDelete.push(key);
            } else if (recentAttempts.length < attempts.length) {
              await AsyncStorage.setItem(key, JSON.stringify(recentAttempts));
            }
          }
        } catch (error) {
          // If we can't parse the data, delete the key
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        authMonitoring.logAuthEvent('rate_limit_cleanup', {
          deletedKeys: keysToDelete.length,
        });
      }
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_cleanup_error', 'low', { error });
    }
  }

  // Private helper methods

  private static getStorageKey(action: string, identifier: string): string {
    return `${this.STORAGE_PREFIX}${action}_${identifier}`;
  }

  private static getBlockKey(action: string, identifier: string): string {
    return `${this.BLOCK_PREFIX}${action}_${identifier}`;
  }

  private static async getRecentAttempts(
    key: string,
    windowMs: number
  ): Promise<RateLimitAttempt[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];

      const attempts: RateLimitAttempt[] = JSON.parse(data);
      const now = Date.now();

      return attempts.filter((attempt) => now - attempt.timestamp < windowMs);
    } catch (error) {
      return [];
    }
  }

  private static async getBlockInfo(blockKey: string): Promise<{ expiresAt: number } | null> {
    try {
      const data = await AsyncStorage.getItem(blockKey);
      if (!data) return null;

      const blockInfo = JSON.parse(data);
      return blockInfo;
    } catch (error) {
      return null;
    }
  }

  private static async blockIdentifier(blockKey: string, durationMs: number): Promise<void> {
    try {
      const blockInfo = {
        expiresAt: Date.now() + durationMs,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem(blockKey, JSON.stringify(blockInfo));
    } catch (error) {
      authMonitoring.logSecurityEvent('rate_limit_block_error', 'medium', { error });
    }
  }
}
