import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { UserUpdate } from '@/lib/supabase/types/database';

interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

export const useUpdateProfile = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateProfile = async (updates: Partial<UserUpdate>): Promise<UpdateProfileResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as unknown as never)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      // Refresh auth context to get updated user data
      await refreshUser();

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    loading,
  };
};
