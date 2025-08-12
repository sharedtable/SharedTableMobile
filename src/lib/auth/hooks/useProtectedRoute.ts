import { useEffect } from 'react';

import { useAuth } from './useAuth';

interface UseProtectedRouteOptions {
  requireEmailVerified?: boolean;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Hook to protect routes that require authentication
 * Automatically redirects unauthenticated users
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { requireEmailVerified = true, onUnauthorized } = options;

  const { user, loading, initializing, isEmailVerified } = useAuth();

  useEffect(() => {
    // Don't check auth state while still initializing
    if (initializing || loading) return;

    // Check if user is authenticated
    if (!user) {
      onUnauthorized?.();
      return;
    }

    // Check if email verification is required
    if (requireEmailVerified && !isEmailVerified) {
      onUnauthorized?.();
      return;
    }
  }, [user, loading, initializing, isEmailVerified, requireEmailVerified, onUnauthorized]);

  return {
    isAuthenticated: !!user,
    isEmailVerified,
    loading: loading || initializing,
    user,
  };
}
