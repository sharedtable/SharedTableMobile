import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export enum BiometricType {
  FACE_ID = 'FACE_ID',
  FINGERPRINT = 'FINGERPRINT',
  IRIS = 'IRIS',
  UNKNOWN = 'UNKNOWN',
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
  biometricType?: BiometricType;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  securityLevel: LocalAuthentication.SecurityLevel;
}

export class BiometricAuthService {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
  private static readonly BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';
  private static readonly BIOMETRIC_USER_ID_KEY = 'biometric_user_id';

  /**
   * Check device biometric capabilities
   */
  static async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

      const mappedTypes = supportedTypes.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return BiometricType.FACE_ID;
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return BiometricType.FINGERPRINT;
          case LocalAuthentication.AuthenticationType.IRIS:
            return BiometricType.IRIS;
          default:
            return BiometricType.UNKNOWN;
        }
      });

      return {
        isAvailable,
        isEnrolled,
        supportedTypes: mappedTypes,
        securityLevel,
      };
    } catch (error) {
      console.error('❌ [BiometricAuth] Error checking capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
      };
    }
  }

  /**
   * Get user-friendly biometric type name
   */
  static getBiometricTypeName(types: BiometricType[]): string {
    if (types.includes(BiometricType.FACE_ID)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(BiometricType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(BiometricType.IRIS)) {
      return 'Iris Recognition';
    }
    return 'Biometric Authentication';
  }

  /**
   * Check if biometric authentication is enabled for current user
   */
  static async isBiometricEnabled(userId: string): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_ENABLED_KEY);
      const storedUserId = await SecureStore.getItemAsync(this.BIOMETRIC_USER_ID_KEY);

      return enabled === 'true' && storedUserId === userId;
    } catch (error) {
      console.error('❌ [BiometricAuth] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for user
   */
  static async enableBiometric(userId: string, authToken: string): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getCapabilities();

      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error:
            'No biometric credentials are enrolled. Please set up biometric authentication in your device settings.',
        };
      }

      // Test biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for SharedTable',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (!authResult.success) {
        return {
          success: false,
          error: this.getAuthErrorMessage(authResult.error),
        };
      }

      // Generate a secure token for this user
      const biometricToken = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${userId}-${authToken}-${Date.now()}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Store biometric credentials securely
      await Promise.all([
        SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, 'true'),
        SecureStore.setItemAsync(this.BIOMETRIC_TOKEN_KEY, biometricToken),
        SecureStore.setItemAsync(this.BIOMETRIC_USER_ID_KEY, userId),
      ]);

      return {
        success: true,
        biometricType: capabilities.supportedTypes[0],
      };
    } catch (error) {
      console.error('❌ [BiometricAuth] Error enabling biometric:', error);
      return {
        success: false,
        error: 'Failed to enable biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.BIOMETRIC_ENABLED_KEY),
        SecureStore.deleteItemAsync(this.BIOMETRIC_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.BIOMETRIC_USER_ID_KEY),
      ]);
    } catch (error) {
      console.error('❌ [BiometricAuth] Error disabling biometric:', error);
    }
  }

  /**
   * Authenticate with biometrics
   */
  static async authenticate(
    promptMessage: string = 'Authenticate to access SharedTable'
  ): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getCapabilities();

      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Force biometric only
        requireConfirmation: false,
      });

      if (authResult.success) {
        // Verify stored biometric token exists
        const storedToken = await SecureStore.getItemAsync(this.BIOMETRIC_TOKEN_KEY);
        if (!storedToken) {
          return {
            success: false,
            error: 'Biometric authentication is not properly configured',
          };
        }

        return {
          success: true,
          biometricType: capabilities.supportedTypes[0],
        };
      } else {
        return {
          success: false,
          error: this.getAuthErrorMessage(authResult.error),
        };
      }
    } catch (error) {
      console.error('❌ [BiometricAuth] Authentication error:', error);
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  }

  /**
   * Quick authentication check (for app unlock)
   */
  static async quickAuth(): Promise<boolean> {
    try {
      const result = await this.authenticate('Unlock SharedTable');
      return result.success;
    } catch (error) {
      console.error('❌ [BiometricAuth] Quick auth error:', error);
      return false;
    }
  }

  /**
   * Get stored biometric user ID
   */
  static async getBiometricUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.BIOMETRIC_USER_ID_KEY);
    } catch (error) {
      console.error('❌ [BiometricAuth] Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Clear all biometric data (on logout)
   */
  static async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.BIOMETRIC_ENABLED_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(this.BIOMETRIC_TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(this.BIOMETRIC_USER_ID_KEY).catch(() => {}),
      ]);
    } catch (error) {
      console.error('❌ [BiometricAuth] Error clearing data:', error);
    }
  }

  /**
   * Convert LocalAuthentication error to user-friendly message
   */
  private static getAuthErrorMessage(error?: string): string {
    switch (error) {
      case 'UserCancel':
        return 'Authentication was cancelled';
      case 'UserFallback':
        return 'Please use your device passcode instead';
      case 'SystemCancel':
        return 'Authentication was cancelled by the system';
      case 'PasscodeNotSet':
        return 'Please set up a device passcode first';
      case 'BiometricNotAvailable':
        return 'Biometric authentication is not available';
      case 'BiometricNotEnrolled':
        return 'No biometric credentials are enrolled';
      case 'BiometricLockout':
        return 'Biometric authentication is temporarily locked. Please try again later.';
      case 'BiometricLockoutPermanent':
        return 'Biometric authentication is permanently locked. Please use your device passcode.';
      case 'DeviceNotSecure':
        return 'Your device is not secure. Please set up a lock screen.';
      default:
        return 'Biometric authentication failed';
    }
  }

  /**
   * Check if device meets security requirements
   */
  static async checkSecurityRequirements(): Promise<{
    meets: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const capabilities = await this.getCapabilities();

      if (!capabilities.isAvailable) {
        issues.push('Biometric hardware not available');
      }

      if (!capabilities.isEnrolled) {
        issues.push('No biometric credentials enrolled');
      }

      if (capabilities.securityLevel === LocalAuthentication.SecurityLevel.NONE) {
        issues.push('Device does not meet minimum security requirements');
      }

      return {
        meets: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('❌ [BiometricAuth] Error checking security:', error);
      return {
        meets: false,
        issues: ['Unable to verify device security'],
      };
    }
  }
}
