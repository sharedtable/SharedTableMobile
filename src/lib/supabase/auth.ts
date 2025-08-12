import { AuthError, User, Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase, authConfig } from './client';

export interface SignUpData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface SignInData {
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
  /**
   * Basic email validation
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send OTP to email for sign up
   */
  static async signUp({
    email,
    firstName,
    lastName,
    phone,
  }: SignUpData): Promise<{ error?: AuthError | Error | null }> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('📧 Sending signup OTP to:', email);

      // Send OTP for sign up
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true, // Explicitly allow user creation
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone?.trim() || null,
          },
        },
      });

      console.log('📧 Signup OTP response:', { data, error });

      if (error) {
        console.error('❌ Signup OTP error:', error);
        throw error;
      }

      console.log('✅ Signup OTP sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Signup OTP catch error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Send OTP to email for sign in
   */
  static async signIn({ email }: SignInData): Promise<{ error?: AuthError | Error | null }> {
    try {
      console.log('📧 Sending signin OTP to:', email);

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false, // Only existing users for sign in
        },
      });

      console.log('📧 Signin OTP response:', { data, error });

      if (error) {
        console.error('❌ Signin OTP error:', error);
        throw error;
      }

      console.log('✅ Signin OTP sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Signin OTP catch error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      console.log('🔄 [AuthService] Starting Google OAuth...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authConfig.redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Force account selection
          },
          skipBrowserRedirect: true, // Handle redirect manually
        },
      });

      console.log('🔄 [AuthService] Google OAuth response:', {
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        error: error?.message,
      });

      if (error) {
        console.error('❌ [AuthService] Google OAuth error:', error);
        throw error;
      }

      // Check if we got a URL to open in browser
      if (data?.url) {
        console.log('🌐 [AuthService] Opening browser for Google OAuth:', data.url);

        // Open browser for OAuth with proper redirect handling
        WebBrowser.maybeCompleteAuthSession();

        const result = await WebBrowser.openAuthSessionAsync(data.url, authConfig.redirectUrl, {
          showInRecents: false,
        });

        console.log('🌐 [AuthService] Browser result:', result);

        if (result.type === 'success' && result.url) {
          console.log('🌐 [AuthService] Browser redirect successful:', result.url);

          // Handle the redirect URL manually
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const error_description = url.searchParams.get('error_description');

          if (error_description) {
            throw new Error(error_description);
          }

          if (code) {
            console.log('🔑 [AuthService] Got auth code, exchanging for session...');

            try {
              // Exchange code for session using Supabase
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);

              console.log('🔑 [AuthService] Code exchange result:', {
                hasSession: !!data?.session,
                hasUser: !!data?.user,
                error: error?.message,
              });

              if (error) {
                console.error('❌ [AuthService] Error exchanging code:', error);
                throw error;
              }

              if (data?.session) {
                console.log('✅ [AuthService] Session created successfully!');
                return {
                  user: data.user,
                  session: data.session,
                  error: null,
                };
              }
            } catch (exchangeError) {
              console.error('❌ [AuthService] Code exchange failed:', exchangeError);
              throw exchangeError;
            }
          }
        } else {
          console.log('🚫 [AuthService] Browser session cancelled or failed');
          return {
            user: null,
            session: null,
            error: new Error('Authentication cancelled'),
          };
        }
      } else {
        console.log('📍 [AuthService] No URL in response, checking for direct session...');
      }

      console.log('✅ [AuthService] Google OAuth flow completed');
      return {
        user: null,
        session: null,
        error: null,
      };
    } catch (error) {
      console.error('❌ [AuthService] Google OAuth catch error:', error);
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
   * Get current user
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
