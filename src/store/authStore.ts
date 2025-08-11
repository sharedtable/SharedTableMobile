import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { api, User } from '@/services/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
}

const USER_KEY = 'user_data';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth from stored data
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Check for stored user
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedUser) {
        const _user = JSON.parse(storedUser);

        // Verify session with backend
        try {
          const response = await api.getSession();
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
            // Update stored user
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data));
          } else {
            // Session invalid
            await SecureStore.deleteItemAsync(USER_KEY);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          // Session check failed
          await SecureStore.deleteItemAsync(USER_KEY);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.login(email, password);

      if (response.success && response.data) {
        const { user } = response.data;

        // Store user data
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign up
  signUp: async (data: SignUpData) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.createAccount(data);

      if (response.success && response.data) {
        const { user } = response.data;

        // Store user data
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Sign up failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Sign up failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Call logout API
      await api.logout();

      // Clear stored data
      await SecureStore.deleteItemAsync(USER_KEY);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local data
      await SecureStore.deleteItemAsync(USER_KEY);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Update user
  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });

      // Update stored data
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
