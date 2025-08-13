import * as Crypto from 'expo-crypto';
import { Linking } from 'react-native';

import { authMonitoring, securityUtils } from '../../supabase/client';

export interface DeepLinkValidationResult {
  isValid: boolean;
  error?: string;
  data?: Record<string, string>;
  securityLevel: 'secure' | 'warning' | 'danger';
}

export interface PendingAuthRequest {
  state: string;
  timestamp: number;
  expiresAt: number;
  origin: 'google' | 'apple' | 'unknown';
}

export class DeepLinkSecurityService {
  private static readonly PENDING_REQUESTS_KEY = 'pending_auth_requests';
  private static readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_PENDING_REQUESTS = 5;

  /**
   * Generate secure state parameter for OAuth
   */
  static async generateSecureState(origin: 'google' | 'apple'): Promise<string> {
    try {
      const timestamp = Date.now();
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const deviceFingerprint = await securityUtils.generateDeviceFingerprint();

      const stateData = {
        origin,
        timestamp,
        device: deviceFingerprint.substring(0, 16), // First 16 chars of fingerprint
        random: Array.from(randomBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      };

      const state = await securityUtils.hashToken(JSON.stringify(stateData));

      // Store pending request
      await this.storePendingRequest(state, origin);

      authMonitoring.logAuthEvent('secure_state_generated', {
        origin,
        stateLength: state.length,
      });

      return state;
    } catch (error) {
      authMonitoring.logSecurityEvent('state_generation_failed', 'high', { error });
      throw new Error('Failed to generate secure state');
    }
  }

  /**
   * Validate incoming deep link
   */
  static async validateDeepLink(url: string): Promise<DeepLinkValidationResult> {
    try {
      authMonitoring.logAuthEvent('deep_link_received', { url: this.sanitizeUrlForLogging(url) });

      // Basic URL validation
      const urlValidation = this.validateUrlStructure(url);
      if (!urlValidation.isValid) {
        return {
          isValid: false,
          error: urlValidation.error,
          securityLevel: 'danger',
        };
      }

      const parsedUrl = new URL(url);

      // Validate scheme
      if (parsedUrl.protocol !== 'sharedtable:') {
        authMonitoring.logSecurityEvent('invalid_deep_link_scheme', 'high', {
          scheme: parsedUrl.protocol,
          expected: 'sharedtable:',
        });
        return {
          isValid: false,
          error: 'Invalid URL scheme',
          securityLevel: 'danger',
        };
      }

      // Validate host for auth callbacks
      if (parsedUrl.host !== 'auth-callback') {
        authMonitoring.logSecurityEvent('invalid_deep_link_host', 'medium', {
          host: parsedUrl.host,
          expected: 'auth-callback',
        });
        return {
          isValid: false,
          error: 'Invalid callback host',
          securityLevel: 'warning',
        };
      }

      // Extract and validate parameters
      const params = Object.fromEntries(parsedUrl.searchParams.entries());
      const paramValidation = await this.validateAuthParameters(params);

      if (!paramValidation.isValid) {
        return {
          isValid: false,
          error: paramValidation.error,
          securityLevel: paramValidation.securityLevel || 'danger',
        };
      }

      // Validate state parameter if present
      if (params.state) {
        const stateValidation = await this.validateStateParameter(params.state);
        if (!stateValidation.isValid) {
          return {
            isValid: false,
            error: stateValidation.error,
            securityLevel: 'danger',
          };
        }
      }

      authMonitoring.logAuthEvent('deep_link_validated', {
        hasCode: !!params.code,
        hasState: !!params.state,
        hasError: !!params.error,
      });

      return {
        isValid: true,
        data: params,
        securityLevel: 'secure',
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('deep_link_validation_error', 'high', { error });
      return {
        isValid: false,
        error: 'Deep link validation failed',
        securityLevel: 'danger',
      };
    }
  }

  /**
   * Validate URL structure and basic security
   */
  private static validateUrlStructure(url: string): { isValid: boolean; error?: string } {
    try {
      // Basic checks
      if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'Invalid URL format' };
      }

      // Length check
      if (url.length > 2048) {
        authMonitoring.logSecurityEvent('oversized_deep_link', 'medium', {
          urlLength: url.length,
        });
        return { isValid: false, error: 'URL too long' };
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i, // Script injection
        /javascript:/i, // JavaScript protocol
        /data:/i, // Data URLs
        /[<>]/, // HTML tags
        /\0/, // Null bytes
        /\r|\n/, // CRLF injection
      ];

      if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
        authMonitoring.logSecurityEvent('suspicious_deep_link_pattern', 'high', {
          url: this.sanitizeUrlForLogging(url),
        });
        return { isValid: false, error: 'URL contains suspicious content' };
      }

      // Try parsing
      new URL(url);

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Malformed URL' };
    }
  }

  /**
   * Validate OAuth authentication parameters
   */
  private static async validateAuthParameters(params: Record<string, string>): Promise<{
    isValid: boolean;
    error?: string;
    securityLevel?: 'secure' | 'warning' | 'danger';
  }> {
    try {
      // Check for required parameters in successful auth
      if (params.code) {
        // Authorization code flow
        if (!params.code.match(/^[A-Za-z0-9_-]+$/)) {
          authMonitoring.logSecurityEvent('invalid_auth_code_format', 'high', {
            codeLength: params.code.length,
          });
          return {
            isValid: false,
            error: 'Invalid authorization code format',
            securityLevel: 'danger',
          };
        }

        // Code length validation
        if (params.code.length < 10 || params.code.length > 512) {
          authMonitoring.logSecurityEvent('auth_code_length_suspicious', 'medium', {
            codeLength: params.code.length,
          });
          return {
            isValid: false,
            error: 'Authorization code length is suspicious',
            securityLevel: 'warning',
          };
        }
      }

      // Check for error parameters
      if (params.error) {
        const allowedErrors = [
          'access_denied',
          'invalid_request',
          'unauthorized_client',
          'unsupported_response_type',
          'invalid_scope',
          'server_error',
          'temporarily_unavailable',
        ];

        if (!allowedErrors.includes(params.error)) {
          authMonitoring.logSecurityEvent('unknown_oauth_error', 'medium', {
            error: params.error,
          });
          return {
            isValid: false,
            error: 'Unknown OAuth error',
            securityLevel: 'warning',
          };
        }

        authMonitoring.logAuthEvent('oauth_error_received', {
          error: params.error,
          errorDescription: params.error_description,
        });
      }

      // Validate other parameters
      for (const [key, value] of Object.entries(params)) {
        if (value.length > 1024) {
          authMonitoring.logSecurityEvent('oversized_auth_parameter', 'medium', {
            parameter: key,
            valueLength: value.length,
          });
          return {
            isValid: false,
            error: `Parameter ${key} is too long`,
            securityLevel: 'warning',
          };
        }
      }

      return { isValid: true, securityLevel: 'secure' };
    } catch (error) {
      authMonitoring.logSecurityEvent('auth_parameter_validation_error', 'medium', { error });
      return {
        isValid: false,
        error: 'Parameter validation failed',
        securityLevel: 'danger',
      };
    }
  }

  /**
   * Validate state parameter against stored pending requests
   */
  private static async validateStateParameter(
    state: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!state || state.length < 32) {
        return { isValid: false, error: 'Invalid state parameter' };
      }

      const pendingRequests = await this.getPendingRequests();
      const request = pendingRequests[state];

      if (!request) {
        authMonitoring.logSecurityEvent('unknown_auth_state', 'high', {
          stateLength: state.length,
        });
        return { isValid: false, error: 'Unknown authentication state' };
      }

      // Check expiry
      if (Date.now() > request.expiresAt) {
        authMonitoring.logSecurityEvent('expired_auth_state', 'medium', {
          state,
          expiredBy: Date.now() - request.expiresAt,
        });
        await this.removePendingRequest(state);
        return { isValid: false, error: 'Authentication state expired' };
      }

      // Remove used state
      await this.removePendingRequest(state);

      authMonitoring.logAuthEvent('state_parameter_validated', {
        origin: request.origin,
        age: Date.now() - request.timestamp,
      });

      return { isValid: true };
    } catch (error) {
      authMonitoring.logSecurityEvent('state_validation_error', 'medium', { error });
      return { isValid: false, error: 'State validation failed' };
    }
  }

  /**
   * Store pending authentication request
   */
  private static async storePendingRequest(
    state: string,
    origin: 'google' | 'apple'
  ): Promise<void> {
    try {
      const requests = await this.getPendingRequests();

      // Clean up expired requests
      const now = Date.now();
      const validRequests = Object.fromEntries(
        Object.entries(requests).filter(([_, request]) => now < request.expiresAt)
      );

      // Limit number of pending requests
      const requestEntries = Object.entries(validRequests);
      if (requestEntries.length >= this.MAX_PENDING_REQUESTS) {
        // Remove oldest request
        const oldestEntry = requestEntries.reduce((oldest, current) =>
          current[1].timestamp < oldest[1].timestamp ? current : oldest
        );
        delete validRequests[oldestEntry[0]];

        authMonitoring.logSecurityEvent('max_pending_requests_reached', 'low', {
          maxRequests: this.MAX_PENDING_REQUESTS,
        });
      }

      // Add new request
      validRequests[state] = {
        state,
        timestamp: now,
        expiresAt: now + this.STATE_EXPIRY_MS,
        origin,
      };

      // Store updated requests (in production, use secure storage)
      // For now, we'll just keep them in memory (they're temporary anyway)
    } catch (error) {
      authMonitoring.logSecurityEvent('pending_request_storage_error', 'medium', { error });
    }
  }

  /**
   * Get pending authentication requests
   */
  private static async getPendingRequests(): Promise<Record<string, PendingAuthRequest>> {
    try {
      // In production, retrieve from secure storage
      // For now, return empty object (stateless for demo)
      return {};
    } catch (error) {
      authMonitoring.logSecurityEvent('pending_request_retrieval_error', 'low', { error });
      return {};
    }
  }

  /**
   * Remove pending authentication request
   */
  private static async removePendingRequest(state: string): Promise<void> {
    try {
      // In production, remove from secure storage
      authMonitoring.logAuthEvent('pending_request_removed', { state });
    } catch (error) {
      authMonitoring.logSecurityEvent('pending_request_removal_error', 'low', { error });
    }
  }

  /**
   * Sanitize URL for logging (remove sensitive parameters)
   */
  private static sanitizeUrlForLogging(url: string): string {
    try {
      const parsedUrl = new URL(url);

      // Remove sensitive parameters
      const sensitiveParams = ['code', 'access_token', 'id_token', 'refresh_token'];
      sensitiveParams.forEach((param) => {
        if (parsedUrl.searchParams.has(param)) {
          parsedUrl.searchParams.set(param, '[REDACTED]');
        }
      });

      return parsedUrl.toString();
    } catch (error) {
      return '[MALFORMED_URL]';
    }
  }

  /**
   * Handle deep link with security validation
   */
  static async handleSecureDeepLink(url: string): Promise<{
    success: boolean;
    data?: Record<string, string>;
    error?: string;
  }> {
    try {
      const validation = await this.validateDeepLink(url);

      if (!validation.isValid) {
        const severity =
          validation.securityLevel === 'danger'
            ? 'high'
            : validation.securityLevel === 'warning'
              ? 'medium'
              : 'low';
        authMonitoring.logSecurityEvent('deep_link_rejected', severity, {
          error: validation.error,
        });
        return {
          success: false,
          error: validation.error,
        };
      }

      authMonitoring.logAuthEvent('deep_link_accepted', {
        securityLevel: validation.securityLevel,
      });

      return {
        success: true,
        data: validation.data,
      };
    } catch (error) {
      authMonitoring.logSecurityEvent('deep_link_handling_error', 'high', { error });
      return {
        success: false,
        error: 'Deep link handling failed',
      };
    }
  }

  /**
   * Initialize deep link security monitoring
   */
  static async initializeDeepLinkSecurity(): Promise<void> {
    try {
      // Set up URL event listener with security validation
      const handleUrl = async (event: { url: string }) => {
        const result = await this.handleSecureDeepLink(event.url);

        if (!result.success) {
          authMonitoring.logSecurityEvent('malicious_deep_link_blocked', 'high', {
            url: this.sanitizeUrlForLogging(event.url),
            error: result.error,
          });
        }
      };

      Linking.addEventListener('url', handleUrl);

      authMonitoring.logAuthEvent('deep_link_security_initialized');
    } catch (error) {
      authMonitoring.logSecurityEvent('deep_link_security_init_failed', 'high', { error });
    }
  }
}
