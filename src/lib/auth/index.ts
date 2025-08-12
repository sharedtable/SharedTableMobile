// Auth exports
export { AuthProvider, useAuth } from './context/AuthContext';
export { useProtectedRoute } from './hooks/useProtectedRoute';
export { AuthService } from '../supabase/auth';
export type { SignUpData, SignInData } from '../supabase/auth';
