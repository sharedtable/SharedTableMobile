import { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { authConfig, authMonitoring, securityUtils } from '../../supabase/client';

export interface SecureSession {
  session: Session;
  deviceFingerprint: string;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
  needsRefresh?: boolean;
}

export class SessionService {
  private static readonly SESSION_KEY = 'secure_session';
  private static readonly SESSION_METADATA_KEY = 'session_metadata';
  private static readonly MAX_SESSION_AGE = authConfig.sessionTimeout;
  private static readonly REFRESH_THRESHOLD = authConfig.refreshThreshold;

  /**
   * Store session securely with metadata
   */
  static async storeSession(session: Session): Promise<void> {
    try {
      const deviceFingerprint = await securityUtils.generateDeviceFingerprint();
      const now = Date.now();

      const secureSession: SecureSession = {
        session,
        deviceFingerprint,
        createdAt: now,
        lastAccessedAt: now,
        expiresAt: now + this.MAX_SESSION_AGE,
      };

      // Encrypt session data
      const encryptedSession = await this.encryptSessionData(secureSession);

      // Store with additional metadata for validation
      await Promise.all([
        SecureStore.setItemAsync(this.SESSION_KEY, encryptedSession),
        SecureStore.setItemAsync(
          this.SESSION_METADATA_KEY,
          JSON.stringify({
            userId: session.user.id,
            deviceFingerprint,
            createdAt: now,
            expiresAt: secureSession.expiresAt,
          })
        ),
      ]);

      authMonitoring.logAuthEvent('session_stored', {
        userId: session.user.id,
        expiresAt: secureSession.expiresAt,
      });
    } catch (error) {
      authMonitoring.logSecurityEvent('session_store_failed', 'high', { error });
      throw new Error('Failed to store session securely');
    }
  }

  /**
   * Retrieve and validate stored session
   */
  static async getStoredSession(): Promise<SecureSession | null> {
    try {
      const [encryptedSession, metadataStr] = await Promise.all([
        SecureStore.getItemAsync(this.SESSION_KEY),
        SecureStore.getItemAsync(this.SESSION_METADATA_KEY),
      ]);

      if (!encryptedSession || !metadataStr) {
        return null;
      }

      const metadata = JSON.parse(metadataStr);

      // Basic metadata validation
      if (Date.now() > metadata.expiresAt) {
        authMonitoring.logSecurityEvent('session_expired', 'low', {
          userId: metadata.userId,
          expiredAt: metadata.expiresAt,
        });
        await this.clearStoredSession();
        return null;
      }

      // Decrypt and validate session
      const secureSession = await this.decryptSessionData(encryptedSession);

      if (!secureSession) {
        authMonitoring.logSecurityEvent('session_decrypt_failed', 'high', {
          userId: metadata.userId,
        });
        await this.clearStoredSession();
        return null;
      }

      // Validate session integrity
      const validation = await this.validateSession(secureSession);

      if (!validation.isValid) {
        authMonitoring.logSecurityEvent('session_validation_failed', 'high', {
          userId: secureSession.session.user.id,
          reason: validation.reason,
        });
        await this.clearStoredSession();
        return null;
      }

      // Update last accessed time
      secureSession.lastAccessedAt = Date.now();
      await this.updateSessionMetadata(secureSession);

      authMonitoring.logAuthEvent('session_retrieved', {
        userId: secureSession.session.user.id,
        lastAccessed: secureSession.lastAccessedAt,
      });

      return secureSession;
    } catch (error) {
      authMonitoring.logSecurityEvent('session_retrieval_error', 'medium', { error });
      await this.clearStoredSession();
      return null;
    }
  }

  /**
   * Update session with new data
   */
  static async updateSession(session: Session): Promise<void> {
    try {
      const existingSession = await this.getStoredSession();

      if (existingSession) {
        // Preserve metadata, update session
        existingSession.session = session;
        existingSession.lastAccessedAt = Date.now();

        const encryptedSession = await this.encryptSessionData(existingSession);
        await SecureStore.setItemAsync(this.SESSION_KEY, encryptedSession);

        authMonitoring.logAuthEvent('session_updated', {
          userId: session.user.id,
        });
      } else {
        // Store as new session
        await this.storeSession(session);
      }
    } catch (error) {
      authMonitoring.logSecurityEvent('session_update_failed', 'medium', { error });
      throw new Error('Failed to update session');
    }
  }

  /**
   * Clear stored session
   */
  static async clearStoredSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.SESSION_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(this.SESSION_METADATA_KEY).catch(() => {}),
      ]);

      authMonitoring.logAuthEvent('session_cleared');
    } catch (error) {
      authMonitoring.logSecurityEvent('session_clear_error', 'low', { error });
    }
  }

  /**
   * Check if session needs refresh
   */
  static async shouldRefreshSession(): Promise<boolean> {
    try {
      const secureSession = await this.getStoredSession();

      if (!secureSession) {
        return false;
      }

      const { session } = secureSession;
      const expiresAt = session.expires_at ? new Date(session.expires_at).getTime() : 0;
      const timeUntilExpiry = expiresAt - Date.now();

      return timeUntilExpiry < this.REFRESH_THRESHOLD;
    } catch (error) {
      authMonitoring.logSecurityEvent('session_refresh_check_error', 'low', { error });
      return false;
    }
  }

  /**
   * Validate session integrity and security
   */
  private static async validateSession(
    secureSession: SecureSession
  ): Promise<SessionValidationResult> {
    try {
      const { session, deviceFingerprint, createdAt, expiresAt } = secureSession;

      // Check session structure
      if (!session || !session.user || !session.access_token) {
        return { isValid: false, reason: 'Invalid session structure' };
      }

      // Check if session has expired
      if (Date.now() > expiresAt) {
        return { isValid: false, reason: 'Session expired' };
      }

      // Validate device fingerprint
      const currentFingerprint = await securityUtils.generateDeviceFingerprint();
      if (deviceFingerprint !== currentFingerprint) {
        authMonitoring.logSecurityEvent('device_fingerprint_mismatch', 'high', {
          userId: session.user.id,
          stored: deviceFingerprint,
          current: currentFingerprint,
        });
        return { isValid: false, reason: 'Device fingerprint mismatch' };
      }

      // Check if session is too old
      const sessionAge = Date.now() - createdAt;
      if (sessionAge > this.MAX_SESSION_AGE) {
        return { isValid: false, reason: 'Session too old' };
      }

      // Check if token needs refresh
      const tokenExpiresAt = session.expires_at ? new Date(session.expires_at).getTime() : 0;
      const needsRefresh = tokenExpiresAt - Date.now() < this.REFRESH_THRESHOLD;

      return {
        isValid: true,
        needsRefresh,
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('session_validation_error', 'medium', { error });
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * Encrypt session data
   */
  private static async encryptSessionData(secureSession: SecureSession): Promise<string> {
    try {
      const data = JSON.stringify(secureSession);

      // In production, you might want to use actual encryption
      // For now, we'll use base64 encoding with a hash for integrity
      const hash = await securityUtils.hashToken(data);
      const payload = {
        data: btoa(data), // Base64 encode
        hash,
        timestamp: Date.now(),
      };

      return JSON.stringify(payload);
    } catch (error) {
      authMonitoring.logSecurityEvent('session_encryption_error', 'high', { error });
      throw new Error('Failed to encrypt session data');
    }
  }

  /**
   * Decrypt session data
   */
  private static async decryptSessionData(encryptedData: string): Promise<SecureSession | null> {
    try {
      const payload = JSON.parse(encryptedData);

      if (!payload.data || !payload.hash) {
        throw new Error('Invalid encrypted data structure');
      }

      // Decode and verify integrity
      const decodedData = atob(payload.data);
      const expectedHash = await securityUtils.hashToken(decodedData);

      if (payload.hash !== expectedHash) {
        authMonitoring.logSecurityEvent('session_integrity_check_failed', 'high', {
          expected: expectedHash,
          received: payload.hash,
        });
        return null;
      }

      return JSON.parse(decodedData);
    } catch (error) {
      authMonitoring.logSecurityEvent('session_decryption_error', 'high', { error });
      return null;
    }
  }

  /**
   * Update session metadata
   */
  private static async updateSessionMetadata(secureSession: SecureSession): Promise<void> {
    try {
      const metadata = {
        userId: secureSession.session.user.id,
        deviceFingerprint: secureSession.deviceFingerprint,
        createdAt: secureSession.createdAt,
        lastAccessedAt: secureSession.lastAccessedAt,
        expiresAt: secureSession.expiresAt,
      };

      await SecureStore.setItemAsync(this.SESSION_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      authMonitoring.logSecurityEvent('session_metadata_update_error', 'low', { error });
    }
  }

  /**
   * Get session statistics for monitoring
   */
  static async getSessionStats(): Promise<{
    hasSession: boolean;
    sessionAge?: number;
    lastAccessed?: number;
    expiresIn?: number;
  }> {
    try {
      const secureSession = await this.getStoredSession();

      if (!secureSession) {
        return { hasSession: false };
      }

      const now = Date.now();
      return {
        hasSession: true,
        sessionAge: now - secureSession.createdAt,
        lastAccessed: secureSession.lastAccessedAt,
        expiresIn: secureSession.expiresAt - now,
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('session_stats_error', 'low', { error });
      return { hasSession: false };
    }
  }
}
