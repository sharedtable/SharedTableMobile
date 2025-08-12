import { User, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { AuthService } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  sendOtp: (email: string, isSignUp?: boolean) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

interface SignUpData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth from stored data
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Get current session from Supabase
      const { data, error } = await AuthService.getSession();

      if (error) {
        console.error('Auth initialization error:', error);
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      if (data.session?.user) {
        set({
          user: data.session.user,
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            error: null,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Send OTP for login/signup
  sendOtp: async (email: string, _isSignUp: boolean = false) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await AuthService.signIn({ email });

      if (error) {
        throw new Error(AuthService.getAuthErrorMessage(error));
      }

      set({
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send verification code',
        isLoading: false,
      });
      throw error;
    }
  },

  // Verify OTP and complete login
  verifyOtp: async (email: string, token: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, session, error } = await AuthService.verifyOtp(email, token);

      if (error) {
        throw new Error(AuthService.getAuthErrorMessage(error));
      }

      if (user && session) {
        set({
          user,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error: any) {
      set({
        error: error.message || 'Verification failed',
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign up
  signUp: async (data: SignUpData) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await AuthService.signUp(data);

      if (error) {
        throw new Error(AuthService.getAuthErrorMessage(error));
      }

      set({
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Sign up failed',
        isLoading: false,
      });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Sign out from Supabase
      const { error } = await AuthService.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      // Clear state regardless of API result
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even if something goes wrong
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Update user
  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
