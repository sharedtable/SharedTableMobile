import * as Linking from 'expo-linking';

import { supabase } from '../../supabase/client';

/**
 * Deep linking utilities for Supabase auth
 */
export class DeepLinkingService {
  /**
   * Handle incoming auth URLs from OAuth providers
   */
  static async handleAuthUrl(url: string): Promise<boolean> {
    try {
      console.log('🔗 [DeepLinking] Handling auth URL:', url);

      // Try different methods to extract session data

      // Method 1: URL fragments (hash)
      const urlObj = new URL(url);
      const fragment = urlObj.hash.substring(1);
      const hashParams = new URLSearchParams(fragment);

      console.log('🔗 [DeepLinking] URL hash fragment:', fragment);
      console.log('🔗 [DeepLinking] Hash params:', Object.fromEntries(hashParams.entries()));

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // Method 2: Query parameters
      const queryParams = new URLSearchParams(urlObj.search);
      console.log('🔗 [DeepLinking] Query params:', Object.fromEntries(queryParams.entries()));

      const code = queryParams.get('code');

      // Try setting session from tokens
      if (accessToken && refreshToken) {
        console.log('🔑 [DeepLinking] Found tokens in hash, setting session...');

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        console.log('🔑 [DeepLinking] Set session result:', {
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          error: error?.message,
        });

        if (error) {
          console.error('❌ [DeepLinking] Error setting session from URL:', error);
          return false;
        }

        if (data?.session) {
          console.log('✅ [DeepLinking] Successfully authenticated via deep link');
          return true;
        }
      }

      // Try handling auth code
      if (code) {
        console.log('🔑 [DeepLinking] Found auth code, exchanging for session...');

        // Let Supabase handle the code exchange
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log('🔑 [DeepLinking] Code exchange result:', {
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          error: error?.message,
        });

        if (error) {
          console.error('❌ [DeepLinking] Error exchanging code:', error);
          return false;
        }

        if (data?.session) {
          console.log('✅ [DeepLinking] Successfully authenticated via code exchange');
          return true;
        }
      }

      console.log('🔗 [DeepLinking] No valid auth data found in URL');
      return false;
    } catch (error) {
      console.error('❌ [DeepLinking] Error processing auth URL:', error);
      return false;
    }
  }

  /**
   * Parse and validate auth callback URLs
   */
  static parseAuthUrl(url: string) {
    const parsed = Linking.parse(url);

    if (parsed.scheme !== 'sharedtable' || parsed.hostname !== 'auth-callback') {
      return null;
    }

    return {
      scheme: parsed.scheme,
      hostname: parsed.hostname,
      path: parsed.path,
      queryParams: parsed.queryParams,
    };
  }

  /**
   * Check if URL is a valid auth callback
   */
  static isAuthCallback(url: string): boolean {
    const parsed = this.parseAuthUrl(url);
    return parsed !== null;
  }

  /**
   * Get the redirect URL for OAuth providers
   */
  static getAuthCallbackUrl(): string {
    return Linking.createURL('auth-callback');
  }

  /**
   * Setup deep linking listener for auth
   */
  static setupAuthListener(onAuthSuccess: () => void, onAuthError: (error: string) => void) {
    console.log('🔗 [DeepLinking] Setting up auth listener');

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('🔗 [DeepLinking] Deep link received:', url);

      if (this.isAuthCallback(url)) {
        console.log('🔗 [DeepLinking] URL is auth callback, processing...');
        const success = await this.handleAuthUrl(url);

        if (success) {
          console.log('✅ [DeepLinking] Auth success, calling success handler');
          onAuthSuccess();
        } else {
          console.error('❌ [DeepLinking] Auth failed, calling error handler');
          onAuthError('Authentication failed');
        }
      } else {
        console.log('🔗 [DeepLinking] URL is not auth callback, ignoring');
      }
    });

    return subscription;
  }
}
