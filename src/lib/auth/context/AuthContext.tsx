import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useAuthStore } from '@/store/authStore';

interface AuthContextType {
  // State
  user: any;
  isNewUser: boolean;
  loading: boolean;
  initializing: boolean;
  error: string | null;

  // Methods
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    privyUser: storePrivyUser,
    isAuthenticated: _isAuthenticated,
    isLoading: storeLoading,
    error,
    initializeAuth,
    logout: storeLogout,
    setPrivyUser,
  } = useAuthStore();

  const { logout: privyLogout, isLoading: privyLoading, user: privyUser } = usePrivyAuth();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync Privy user with store
  useEffect(() => {
    if (privyUser && !storePrivyUser) {
      setPrivyUser(privyUser);
    } else if (!privyUser && storePrivyUser) {
      // Privy logged out, clear store
      storeLogout();
    }
  }, [privyUser, storePrivyUser, setPrivyUser, storeLogout]);

  // For now, treat all users as existing users
  // You can implement logic to determine new vs existing users based on your requirements
  const isNewUser = false;

  const logout = async (): Promise<void> => {
    try {
      await privyLogout(); // Use Privy logout
      await storeLogout(); // Clear store
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signOut = async (): Promise<void> => {
    await logout();
  };

  const refreshUser = async (): Promise<void> => {
    // Refresh user data - for now just re-initialize auth
    console.log('Refreshing user data');
    await initializeAuth();
  };

  // Use store user as the source of truth
  const currentUser = storePrivyUser || privyUser;

  const contextValue: AuthContextType = {
    user: currentUser,
    isNewUser,
    loading: storeLoading || privyLoading,
    initializing: storeLoading,
    error,
    logout,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
