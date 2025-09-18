import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface PrivyUser {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatar?: string;
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',                    // User hasn't started onboarding
  MANDATORY_COMPLETE = 'mandatory_complete',      // Name, Birthday, Gender complete
  OPTIONAL_COMPLETE = 'optional_complete',        // Not used anymore - kept for backward compatibility
  FULLY_COMPLETE = 'fully_complete'              // All onboarding complete (including optional profile, food preferences, and final touch)
}

interface AuthState {
  // State
  privyUser: PrivyUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  onboardingStatus: OnboardingStatus;
  continueOnboardingScreen: string | null;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  setPrivyUser: (user: PrivyUser | null) => void;
  setNeedsOnboarding: (needs: boolean) => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setContinueOnboarding: (screen: string | null) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  privyUser: null,
  isAuthenticated: false,
  isLoading: true,
  needsOnboarding: false,
  onboardingStatus: OnboardingStatus.NOT_STARTED,
  continueOnboardingScreen: null,
  error: null,

  // Initialize auth from stored data
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Check for Privy session
      try {
        const privySession = await SecureStore.getItemAsync('privy_user_session');
        const savedOnboardingStatus = await SecureStore.getItemAsync('onboarding_status');
        
        if (privySession) {
          const privyUser = JSON.parse(privySession);
          // Check if session is not expired (24 hours)
          const isExpired = Date.now() - privyUser.timestamp > 24 * 60 * 60 * 1000;

          if (!isExpired) {
            const onboardingStatus = savedOnboardingStatus as OnboardingStatus || OnboardingStatus.NOT_STARTED;
            
            set({
              privyUser,
              isAuthenticated: true,
              isLoading: false,
              onboardingStatus,
              error: null,
              // Don't set needsOnboarding here - let RootNavigator determine it based on database
            });
            return;
          } else {
            await SecureStore.deleteItemAsync('privy_user_session');
            await SecureStore.deleteItemAsync('onboarding_status');
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
        needsOnboarding: false,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        needsOnboarding: false,
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
        isLoading: false,
        error: null,
      });
    } else {
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        needsOnboarding: false,
      });
    }
  },

  // Set onboarding status
  setNeedsOnboarding: (needs: boolean) => {
    set({ needsOnboarding: needs });
  },

  // Set onboarding status
  setOnboardingStatus: async (status: OnboardingStatus) => {
    try {
      await SecureStore.setItemAsync('onboarding_status', status);
      set({ onboardingStatus: status });
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  // Set continue onboarding screen
  setContinueOnboarding: (screen: string | null) => {
    set({ continueOnboardingScreen: screen });
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear Privy session
      try {
        await SecureStore.deleteItemAsync('privy_user_session');
        await SecureStore.deleteItemAsync('needs_onboarding');
        await SecureStore.deleteItemAsync('onboarding_status');
      } catch (error) {
        console.warn('Error clearing Privy session:', error);
      }

      // Clear state
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        needsOnboarding: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even if something goes wrong
      set({
        privyUser: null,
        isAuthenticated: false,
        isLoading: false,
        needsOnboarding: false,
        error: null,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
