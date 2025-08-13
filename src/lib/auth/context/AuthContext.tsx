import { User, Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

import { AuthService, EmailAuthData } from '../../supabase/auth';
import { supabase, authMonitoring } from '../../supabase/client';
import { User as DatabaseUser } from '../../supabase/types/database';
import {
  BiometricAuthService,
  BiometricAuthResult,
  BiometricCapabilities,
} from '../services/biometricAuth';

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  dbUser: DatabaseUser | null;
  loading: boolean;
  initializing: boolean;

  // Biometric state
  biometricCapabilities: BiometricCapabilities | null;
  isBiometricEnabled: boolean;

  // Actions
  sendEmailOtp: (data: EmailAuthData) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, type?: 'email') => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;

  // Biometric actions
  enableBiometric: () => Promise<BiometricAuthResult>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: (promptMessage?: string) => Promise<BiometricAuthResult>;
  checkBiometricCapabilities: () => Promise<BiometricCapabilities>;

  // Helpers
  isEmailVerified: boolean;
  isNewUser: boolean;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Biometric state
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(
    null
  );
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Initialize biometric capabilities
        const capabilities = await BiometricAuthService.getCapabilities();
        if (isMounted) {
          setBiometricCapabilities(capabilities);
        }

        // Get initial session
        const { data, error } = await AuthService.getSession();
        if (isMounted) {
          if (error) {
            console.error('Error getting session:', error);
            authMonitoring.logAuthEvent('session_init_error', { error: error.message });
          } else {
            setSession(data.session);
            setUser(data.session?.user ?? null);

            // Check biometric status for this user
            if (data.session?.user) {
              const biometricEnabled = await BiometricAuthService.isBiometricEnabled(
                data.session.user.id
              );
              setIsBiometricEnabled(biometricEnabled);
            }

            authMonitoring.logAuthEvent('session_restored', {
              hasUser: !!data.session?.user,
              userId: data.session?.user?.id,
            });
          }
          setInitializing(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Auth initialization error:', error);
          authMonitoring.logSecurityEvent('auth_init_failed', 'medium', { error });
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔄 [AuthContext] Auth state changed:', event, session?.user?.email);
      console.log('🔄 [AuthContext] Full session object:', session);
      console.log('🔄 [AuthContext] User object:', session?.user);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle specific events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in');
          if (session?.user) {
            await fetchDbUser(session.user.id, session.user);
          }
          break;

        case 'SIGNED_OUT':
          console.log('User signed out');
          setDbUser(null);
          break;

        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;

        case 'USER_UPDATED':
          console.log('User updated');
          if (session?.user) {
            await fetchDbUser(session.user.id, session.user);
          }
          break;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user data from database or create if doesn't exist
  const fetchDbUser = async (userId: string, authUser?: User) => {
    try {
      console.log('🔍 [AuthContext] Fetching user from database:', userId);

      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist, create new user record
          console.log('👤 [AuthContext] User not found in database, creating new user...');
          await createDbUser(userId, authUser);
          return;
        } else {
          console.error('❌ [AuthContext] Error fetching user data:', error);
          return;
        }
      }

      console.log('✅ [AuthContext] User found in database:', data);
      setDbUser(data);
    } catch (error) {
      console.error('❌ [AuthContext] Error fetching user data:', error);
    }
  };

  // Create new user record in database
  const createDbUser = async (userId: string, authUser?: User) => {
    try {
      const userToUse = authUser || user;
      if (!userToUse) {
        console.error('❌ [AuthContext] No user session to create database record');
        return;
      }

      console.log('👤 [AuthContext] Creating new user record for:', userToUse.email);
      console.log('👤 [AuthContext] Supabase provider value:', userToUse.app_metadata?.provider);

      // Map Supabase provider to database enum values
      const getAuthProvider = (supabaseProvider: string): 'credentials' | 'google' | 'apple' => {
        switch (supabaseProvider) {
          case 'google':
            return 'google';
          case 'apple':
            return 'apple';
          case 'email':
          case 'phone':
          case 'credentials':
          default:
            return 'credentials';
        }
      };

      // Extract minimal user data from Supabase auth user
      // All personal details will be collected during onboarding
      const userData = {
        id: userId,
        email: userToUse.email || '',
        // Don't include email_normalized - it's a generated column
        auth_provider: getAuthProvider(userToUse.app_metadata?.provider || 'credentials'),
        external_auth_id: userToUse.id,
        // Don't pre-fill names - let onboarding collect this for consistent UX
        first_name: '',
        last_name: '',
        display_name: '',
        status: 'active' as const,
        role: 'user' as const,
        // Don't include phone or phone_normalized for now since they might also be generated
        // Don't include created_at and updated_at - let the database set these with defaults
        // Explicitly don't set onboarding_completed_at - all users must go through onboarding
      };

      console.log('👤 [AuthContext] User data to upsert:', userData);
      console.log('👤 [AuthContext] Using upsert to handle potential existing user');

      // Use upsert to handle existing users
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [AuthContext] Error creating/updating user record:', error);
        return;
      }

      console.log('✅ [AuthContext] Successfully created/updated user record:', data);
      setDbUser(data);
    } catch (error) {
      console.error('❌ [AuthContext] Error creating/updating user record:', error);
    }
  };

  // Refresh current user (validates JWT and gets fresh user data)
  const refreshUser = async () => {
    const { data, error } = await AuthService.getCurrentUser();
    if (error) {
      console.error('Error refreshing user:', error);
      return;
    }

    setUser(data.user);
    if (data.user) {
      await fetchDbUser(data.user.id);
    }
  };

  // Mark onboarding as complete
  const completeOnboarding = async () => {
    if (!dbUser) {
      console.error('❌ [AuthContext] No database user to update onboarding status');
      return;
    }

    try {
      console.log('🎯 [AuthContext] Marking onboarding as complete for user:', dbUser.id);

      const { data, error } = await supabase
        .from('users')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [AuthContext] Error updating onboarding status:', error);
        return;
      }

      console.log('✅ [AuthContext] Onboarding marked as complete');
      setDbUser(data);
    } catch (error) {
      console.error('❌ [AuthContext] Error completing onboarding:', error);
    }
  };

  // Send OTP via email (unified sign in/sign up)
  const sendEmailOtp = async (data: EmailAuthData): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await AuthService.sendEmailOtp(data);

      if (result.error) {
        Alert.alert('Authentication Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      // OTP sent successfully - no alert needed as user is navigating to OTP screen
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<boolean> => {
    console.log('🔄 [AuthContext] Starting Google sign in...');
    setLoading(true);

    try {
      const result = await AuthService.signInWithGoogle();
      console.log('🔄 [AuthContext] AuthService.signInWithGoogle result:', result);

      if (result.error) {
        console.error('❌ [AuthContext] Google sign in error:', result.error);
        Alert.alert('Google Sign In Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      // If we got a session directly from the OAuth flow, set it immediately
      if (result.session && result.user) {
        console.log('🔄 [AuthContext] Setting session from Google OAuth result');
        setSession(result.session);
        setUser(result.user);

        // Fetch/create database user
        await fetchDbUser(result.user.id, result.user);
      }

      console.log('✅ [AuthContext] Google sign in successful');
      return true;
    } finally {
      console.log('🔄 [AuthContext] Google sign in finally block, setting loading to false');
      setLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await AuthService.signInWithApple();

      if (result.error) {
        Alert.alert('Apple Sign In Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      return true;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await AuthService.signOut();

      if (error) {
        Alert.alert('Sign Out Error', AuthService.getAuthErrorMessage(error));
      }

      // Clear biometric data on logout
      await BiometricAuthService.clearBiometricData();
      setIsBiometricEnabled(false);

      authMonitoring.logAuthEvent('sign_out', { userId: user?.id });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (
    email: string,
    token: string,
    type: 'email' = 'email'
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await AuthService.verifyOtp(email, token, type);

      if (result.error) {
        Alert.alert('Verification Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      // Authentication successful - session will be set via auth state change
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await AuthService.resendOtp(email);

      if (error) {
        Alert.alert('Resend Error', AuthService.getAuthErrorMessage(error));
        return false;
      }

      // Verification code resent successfully - no alert needed
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Biometric authentication methods
  const enableBiometric = async (): Promise<BiometricAuthResult> => {
    if (!user || !session) {
      return {
        success: false,
        error: 'User must be authenticated to enable biometric authentication',
      };
    }

    try {
      const result = await BiometricAuthService.enableBiometric(user.id, session.access_token);

      if (result.success) {
        setIsBiometricEnabled(true);
        authMonitoring.logAuthEvent('biometric_enabled', { userId: user.id });
      } else {
        authMonitoring.logSecurityEvent('biometric_enable_failed', 'low', {
          userId: user.id,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      authMonitoring.logSecurityEvent('biometric_enable_error', 'medium', {
        userId: user.id,
        error,
      });
      return {
        success: false,
        error: 'Failed to enable biometric authentication',
      };
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await BiometricAuthService.disableBiometric();
      setIsBiometricEnabled(false);

      if (user) {
        authMonitoring.logAuthEvent('biometric_disabled', { userId: user.id });
      }
    } catch (error) {
      console.error('Failed to disable biometric authentication:', error);
      authMonitoring.logSecurityEvent('biometric_disable_error', 'low', { error });
    }
  };

  const authenticateWithBiometric = async (
    promptMessage?: string
  ): Promise<BiometricAuthResult> => {
    try {
      const result = await BiometricAuthService.authenticate(promptMessage);

      if (result.success) {
        authMonitoring.logAuthEvent('biometric_auth_success', { userId: user?.id });
      } else {
        authMonitoring.logSecurityEvent('biometric_auth_failed', 'low', {
          userId: user?.id,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      authMonitoring.logSecurityEvent('biometric_auth_error', 'medium', {
        userId: user?.id,
        error,
      });
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  };

  const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
    const capabilities = await BiometricAuthService.getCapabilities();
    setBiometricCapabilities(capabilities);
    return capabilities;
  };

  // Computed values
  const isEmailVerified = AuthService.isEmailVerified(user);
  const isNewUser = dbUser ? !dbUser.onboarding_completed_at : true; // New user if no onboarding completion date

  const value: AuthContextType = {
    // State
    user,
    session,
    dbUser,
    loading,
    initializing,

    // Biometric state
    biometricCapabilities,
    isBiometricEnabled,

    // Actions
    sendEmailOtp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    verifyOtp,
    resendOtp,

    // Biometric actions
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    checkBiometricCapabilities,

    // Helpers
    isEmailVerified,
    isNewUser,
    refreshUser,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
