import { User, Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

import { AuthService, SignUpData, SignInData } from '../../supabase/auth';
import { supabase } from '../../supabase/client';
import { User as DatabaseUser } from '../../supabase/types/database';

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  dbUser: DatabaseUser | null;
  loading: boolean;
  initializing: boolean;

  // Actions
  signIn: (data: SignInData) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, type?: 'email') => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;

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

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    // Get initial session
    AuthService.getSession().then(({ data, error }) => {
      if (isMounted) {
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        setInitializing(false);
      }
    });

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

      // Extract user data from Supabase auth user
      const userData = {
        id: userId,
        email: userToUse.email || '',
        // Don't include email_normalized - it's a generated column
        auth_provider: getAuthProvider(userToUse.app_metadata?.provider || 'credentials'),
        external_auth_id: userToUse.id,
        first_name:
          userToUse.user_metadata?.first_name ||
          userToUse.user_metadata?.full_name?.split(' ')[0] ||
          '',
        last_name:
          userToUse.user_metadata?.last_name ||
          userToUse.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
          '',
        display_name: userToUse.user_metadata?.full_name || userToUse.user_metadata?.name || '',
        status: 'active' as const,
        role: 'user' as const,
        // Don't include phone or phone_normalized for now since they might also be generated
        // Don't include created_at and updated_at - let the database set these with defaults
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

  // Refresh current user
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

  // Send OTP for sign in
  const signIn = async (data: SignInData): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(data);

      if (result.error) {
        Alert.alert('Sign In Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      // Show success message for OTP sent
      Alert.alert(
        'Check Your Email',
        'We sent you a verification code. Please check your email and enter the code.'
      );
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for sign up
  const signUp = async (data: SignUpData): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(data);

      if (result.error) {
        Alert.alert('Sign Up Error', AuthService.getAuthErrorMessage(result.error));
        return false;
      }

      // Show success message for OTP sent
      Alert.alert(
        'Check Your Email',
        'We sent you a verification code. Please check your email and enter the code to complete your registration.'
      );
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

      Alert.alert('Verification Code Sent', 'A new verification code has been sent to your email.');
      return true;
    } finally {
      setLoading(false);
    }
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

    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    verifyOtp,
    resendOtp,

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
