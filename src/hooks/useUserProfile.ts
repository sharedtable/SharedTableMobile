import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { UserProfile, Booking, Event } from '@/lib/supabase/types/database';

interface UserProfileData {
  profile: UserProfile | null;
  bookings: (Booking & { event: Event })[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserProfile = (): UserProfileData => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<(Booking & { event: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        setError('Failed to load profile data');
      } else {
        setProfile(profileData);
      }

      // Fetch user bookings with event details
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          event:events(*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        setError('Failed to load bookings data');
      } else {
        setBookings(bookingsData || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    profile,
    bookings,
    loading,
    error,
    refetch: fetchUserProfile,
  };
};
