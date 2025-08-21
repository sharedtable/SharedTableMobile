// Auth exports
export { AuthProvider, useAuth } from './context/AuthContext';
export { useProtectedRoute } from './hooks/useProtectedRoute';

// Export authentication services
export { BiometricAuthService } from './services/biometricAuth';
export { RateLimitService } from './services/rateLimitService';
export { SessionService } from './services/sessionService';
export { RetryService } from './services/retryService';
export { DeepLinkSecurityService } from './services/deepLinkSecurity';

// Export components
export { BiometricSettings } from '../../components/auth/BiometricSettings';
export { AuthMonitoringDashboard } from '../../components/auth/AuthMonitoringDashboard';

// Export types
export type {
  BiometricAuthResult,
  BiometricCapabilities,
  BiometricType,
} from './services/biometricAuth';
export type { RateLimitResult, RateLimitConfig } from './services/rateLimitService';
export type { SecureSession, SessionValidationResult } from './services/sessionService';
export type { RetryOptions } from './services/retryService';
export type { DeepLinkValidationResult, PendingAuthRequest } from './services/deepLinkSecurity';
