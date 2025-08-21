import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface PrivyUser {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  // State
  privyUser: PrivyUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  setPrivyUser: (user: PrivyUser | null) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  privyUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth from stored data
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Check for Privy session
      try {
        const privySession = await SecureStore.getItemAsync('privy_user_session');
        if (privySession) {
          const privyUser = JSON.parse(privySession);
          // Check if session is not expired (24 hours)
          const isExpired = Date.now() - privyUser.timestamp > 24 * 60 * 60 * 1000;

          if (!isExpired) {
            set({
              privyUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          } else {
            await SecureStore.deleteItemAsync('privy_user_session');
          }
        }
      } catch (privyError) {
        console.warn('Error checking Privy session:', privyError);
      }

      // No session found
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Set Privy user
  setPrivyUser: (privyUser: PrivyUser | null) => {
    if (privyUser) {
      // Store session
      SecureStore.setItemAsync(
        'privy_user_session',
        JSON.stringify({
          ...privyUser,
          timestamp: Date.now(),
        })
      ).catch(console.error);

      set({
        privyUser,
        isAuthenticated: true,
        error: null,
      });
    } else {
      set({
        privyUser: null,
        isAuthenticated: false,
      });
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear Privy session
      try {
        await SecureStore.deleteItemAsync('privy_user_session');
      } catch (error) {
        console.warn('Error clearing Privy session:', error);
      }

      // Clear state
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even if something goes wrong
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
