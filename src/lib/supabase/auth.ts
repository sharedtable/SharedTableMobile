import { AuthError, User, Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { RateLimitService } from '../auth/services/rateLimitService';
import { RetryService, CircuitBreaker } from '../auth/services/retryService';

import { supabase, authConfig, authMonitoring, securityUtils } from './client';

export interface EmailAuthData {
  email: string;
}

export interface OtpVerificationData {
  email: string;
  token: string;
  type?: 'email';
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: AuthError | Error | null;
}

export class AuthService {
  private static circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout

  /**
   * Enhanced email validation with security checks
   */
  static isValidEmail(email: string): boolean {
    return securityUtils.validateEmail(email);
  }

  /**
   * Stanford email validation
   */
  static isStanfordEmail(email: string): boolean {
    return securityUtils.validateStanfordEmail(email);
  }

  /**
   * Validate and sanitize email input
   */
  private static async validateEmailInput(
    email: string
  ): Promise<{ isValid: boolean; sanitized?: string; error?: string }> {
    try {
      // Basic validation
      if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
      }

      // Sanitize input
      const sanitized = email.toLowerCase().trim();

      // Length check
      if (sanitized.length < 3 || sanitized.length > 254) {
        return { isValid: false, error: 'Email length is invalid' };
      }

      // Format validation
      if (!this.isValidEmail(sanitized)) {
        return { isValid: false, error: 'Email format is invalid' };
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /[<>]/, // HTML injection
        /'|"/, // SQL injection attempts
        /\s{2,}/, // Multiple spaces
        /[^\x20-\x7E]/, // Non-ASCII characters (except in domain)
      ];

      if (suspiciousPatterns.some((pattern) => pattern.test(sanitized))) {
        authMonitoring.logSecurityEvent('suspicious_email_pattern', 'high', { email: sanitized });
        return { isValid: false, error: 'Email contains invalid characters' };
      }

      return { isValid: true, sanitized };
    } catch (error) {
      authMonitoring.logSecurityEvent('email_validation_error', 'medium', { error });
      return { isValid: false, error: 'Email validation failed' };
    }
  }

  /**
   * Send OTP to email (unified sign in/sign up flow)
   * Supabase will automatically create user if they don't exist
   */
  static async sendEmailOtp({
    email,
  }: EmailAuthData): Promise<{ error?: AuthError | Error | null }> {
    try {
      // Validate and sanitize email
      const emailValidation = await this.validateEmailInput(email);
      if (!emailValidation.isValid) {
        authMonitoring.logSecurityEvent('invalid_email_auth', 'low', {
          email,
          error: emailValidation.error,
        });
        throw new Error(emailValidation.error || 'Invalid email address');
      }

      const sanitizedEmail = emailValidation.sanitized!;

      // Check rate limiting
      const rateLimitResult = await RateLimitService.checkRateLimit('otp_request', sanitizedEmail);
      if (!rateLimitResult.allowed) {
        const errorMessage = rateLimitResult.isBlocked
          ? `Too many attempts. Please try again later.`
          : `Rate limit exceeded. ${rateLimitResult.remainingAttempts} attempts remaining.`;

        authMonitoring.logSecurityEvent('email_otp_rate_limited', 'medium', {
          email: sanitizedEmail,
          isBlocked: rateLimitResult.isBlocked,
          remainingAttempts: rateLimitResult.remainingAttempts,
        });

        throw new Error(errorMessage);
      }

      authMonitoring.logAuthEvent('email_otp_request', { email: sanitizedEmail });

      // Record rate limit attempt
      await RateLimitService.recordAttempt('otp_request', sanitizedEmail);

      // Send OTP with retry logic - Supabase handles user creation automatically
      const result = await RetryService.withRetry(
        async () => {
          return await supabase.auth.signInWithOtp({
            email: sanitizedEmail,
            options: {
              shouldCreateUser: true, // Auto-create user if doesn't exist
              emailRedirectTo: undefined, // Force OTP instead of magic link
              // No user metadata here - will be collected in onboarding
            },
          });
        },
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            authMonitoring.logAuthEvent('email_otp_retry', {
              email: sanitizedEmail,
              attempt,
              error: error.message,
            });
          },
        }
      );

      if (result.error) {
        authMonitoring.logSecurityEvent('email_otp_failed', 'medium', {
          email: sanitizedEmail,
          error: result.error.message,
        });
        throw result.error;
      }

      // Clear rate limit on success
      await RateLimitService.clearAttempts('otp_request', sanitizedEmail);

      authMonitoring.logAuthEvent('email_otp_sent', { email: sanitizedEmail });
      return { error: null };
    } catch (error) {
      authMonitoring.logSecurityEvent('email_otp_error', 'medium', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      return { error: error as AuthError };
    }
  }

  /**
   * @deprecated Use sendEmailOtp instead - unified flow
   */
  static async signIn({ email }: EmailAuthData): Promise<{ error?: AuthError | Error | null }> {
    return this.sendEmailOtp({ email });
  }

  /**
   * @deprecated Use sendEmailOtp instead - unified flow
   */
  static async signUp({ email }: EmailAuthData): Promise<{ error?: AuthError | Error | null }> {
    return this.sendEmailOtp({ email });
  }

  /**
   * Sign in with Google OAuth with enhanced error handling
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      authMonitoring.logAuthEvent('google_oauth_start');

      return await this.circuitBreaker.execute(async () => {
        return await RetryService.withRetry(
          async () => {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: authConfig.redirectUrl,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'select_account',
                },
                skipBrowserRedirect: true,
              },
            });

            if (error) {
              authMonitoring.logSecurityEvent('google_oauth_init_failed', 'medium', {
                error: error.message,
              });
              throw error;
            }

            if (!data?.url) {
              throw new Error('No OAuth URL received from Supabase');
            }

            authMonitoring.logAuthEvent('google_oauth_browser_open', { url: data.url });

            // Enhanced browser session handling
            WebBrowser.maybeCompleteAuthSession();

            const result = await WebBrowser.openAuthSessionAsync(data.url, authConfig.redirectUrl, {
              showInRecents: false,
              preferEphemeralSession: true, // Enhanced privacy
            });

            authMonitoring.logAuthEvent('google_oauth_browser_result', {
              type: result.type,
              hasUrl: !!(result as any).url,
            });

            if (result.type === 'success' && (result as any).url) {
              const redirectUrl = (result as any).url;

              // Validate redirect URL security
              if (!redirectUrl.startsWith(authConfig.redirectUrl)) {
                authMonitoring.logSecurityEvent('invalid_oauth_redirect', 'high', {
                  expected: authConfig.redirectUrl,
                  received: redirectUrl,
                });
                throw new Error('Invalid OAuth redirect URL');
              }

              const url = new URL(redirectUrl);
              const code = url.searchParams.get('code');
              const error_description = url.searchParams.get('error_description');

              if (error_description) {
                authMonitoring.logSecurityEvent('oauth_callback_error', 'medium', {
                  error: error_description,
                });
                throw new Error(error_description);
              }

              if (!code) {
                authMonitoring.logSecurityEvent('missing_oauth_code', 'high', { url: redirectUrl });
                throw new Error('No authorization code received');
              }

              // Exchange code for session with validation
              const { data: sessionData, error: sessionError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (sessionError) {
                authMonitoring.logSecurityEvent('oauth_code_exchange_failed', 'high', {
                  error: sessionError.message,
                });
                throw sessionError;
              }

              if (!sessionData?.session) {
                throw new Error('No session created from OAuth code');
              }

              authMonitoring.logAuthEvent('google_oauth_success', {
                userId: sessionData.user?.id,
              });

              return {
                user: sessionData.user,
                session: sessionData.session,
                error: null,
              };
            } else if (result.type === 'cancel') {
              authMonitoring.logAuthEvent('google_oauth_cancelled');
              return {
                user: null,
                session: null,
                error: new Error('Authentication cancelled by user'),
              };
            } else {
              authMonitoring.logSecurityEvent('google_oauth_unexpected_result', 'medium', {
                type: result.type,
              });
              throw new Error('Unexpected OAuth result');
            }
          },
          {
            maxAttempts: 2, // Limit retries for OAuth
            onRetry: (attempt, error) => {
              authMonitoring.logAuthEvent('google_oauth_retry', {
                attempt,
                error: error.message,
              });
            },
          }
        );
      });
    } catch (error) {
      authMonitoring.logSecurityEvent('google_oauth_failed', 'medium', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with Apple (iOS only)
   */
  static async signInWithApple(): Promise<AuthResponse> {
    try {
      console.log('🍎 Starting Apple Sign In...');

      if (Platform.OS !== 'ios') {
        throw new Error('Apple authentication is only available on iOS');
      }

      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🍎 Apple Sign In available:', isAvailable);

      if (!isAvailable) {
        throw new Error('Apple authentication is not available on this device');
      }

      console.log('🍎 Requesting Apple credentials...');

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken,
      });

      if (!credential.identityToken) {
        throw new Error('Apple authentication failed - no identity token');
      }

      console.log('🍎 Signing in with Supabase...');

      // Sign in with Supabase using Apple credential
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      console.log('🍎 Supabase Apple auth response:', { data, error });

      if (error) {
        console.error('❌ Apple Supabase auth error:', error);
        throw error;
      }

      console.log('✅ Apple Sign In successful');
      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error('❌ Apple Sign In catch error:', error);
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error?: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current user session
   * Note: getSession() returns cached data, use getUser() for fresh user validation
   */
  static async getSession(): Promise<{
    data: { session: Session | null };
    error?: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: { session: null },
        error: error as AuthError,
      };
    }
  }

  /**
   * Get current user (recommended approach)
   * getUser() validates the JWT and ensures user is still valid
   */
  static async getCurrentUser(): Promise<{
    data: { user: User | null };
    error?: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: { user: null },
        error: error as AuthError,
      };
    }
  }

  /**
   * Verify OTP for authentication
   */
  static async verifyOtp(
    email: string,
    token: string,
    type: 'email' = 'email'
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token,
        type,
      });

      if (error) throw error;

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Resend OTP code
   */
  static async resendOtp(email: string): Promise<{ error?: AuthError | null }> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: undefined, // Force OTP instead of magic link
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Check if user email is verified
   */
  static isEmailVerified(user: User | null): boolean {
    return user?.email_confirmed_at != null;
  }

  /**
   * Get auth error message for display
   */
  static getAuthErrorMessage(error: AuthError | Error | null): string {
    if (!error) return '';

    // Handle common Supabase auth errors
    if ('message' in error) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Invalid email or verification code. Please check and try again.';
        case 'Email not confirmed':
          return 'Please check your email and enter the verification code.';
        case 'User already registered':
          return 'An account with this email already exists. Please sign in instead.';
        case 'Token has expired or is invalid':
          return 'The verification code has expired. Please request a new one.';
        case 'Unable to validate email address: invalid format':
          return 'Please enter a valid email address.';
        case 'Email rate limit exceeded':
          return 'Too many emails sent. Please wait before requesting another code.';
        default:
          return error.message;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
