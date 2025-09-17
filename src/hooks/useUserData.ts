import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Database } from '@/lib/supabase/types/database';

type UserRow = Database['public']['Tables']['users']['Row'] & {
  access_granted?: boolean;
  onboarding_status?: string;
  gender?: string | null;
  birthday?: string | null;
};

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  name: string | null; // Full name constructed from firstName + lastName
  access_granted?: boolean;
  onboarding_status?: string;
  gender?: string | null;
  birthday?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export const useUserData = () => {
  const privyUser = useAuthStore((state) => state.privyUser);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (): Promise<UserData | null> => {
    if (!privyUser?.id) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user data from users table using external_auth_id
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('external_auth_id', privyUser.id)
        .single() as { data: UserRow | null; error: any };

      if (fetchError) {
        // If user not found by external_auth_id, try by email
        if (fetchError.code === 'PGRST116' && privyUser.email) {
          const { data: emailData, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', privyUser.email)
            .single() as { data: UserRow | null; error: any };

          if (emailError) {
            // User doesn't exist yet - this is expected for new users
            if (emailError.code === 'PGRST116') {
              console.log('User not found in database yet - sync may be in progress');
              // Return minimal user data while waiting for sync
              const fallbackData: UserData = {
                id: privyUser.id,
                email: privyUser.email || '',
                firstName: null,
                lastName: null,
                displayName: null,
                name: null,
                access_granted: false,
                onboarding_status: 'not_started'
              };
              setUserData(fallbackData);
              return fallbackData;
            }
            throw emailError;
          }

          if (emailData) {
            const userData: UserData = {
              id: emailData.id,
              email: emailData.email,
              firstName: emailData.first_name,
              lastName: emailData.last_name,
              displayName: emailData.display_name,
              name: emailData.first_name && emailData.last_name 
                ? `${emailData.first_name} ${emailData.last_name}`
                : emailData.first_name || emailData.last_name || null,
              access_granted: emailData.access_granted,
              onboarding_status: emailData.onboarding_status,
              gender: emailData.gender,
              birthday: emailData.birthday,
              first_name: emailData.first_name,
              last_name: emailData.last_name,
              display_name: emailData.display_name
            };
            setUserData(userData);
            return userData;
          }
        } else if (fetchError.code === 'PGRST116') {
          // User not found at all - return fallback data for new users
          console.log('User not found in database - new user or sync pending');
          const fallbackData: UserData = {
            id: privyUser.id,
            email: privyUser.email || '',
            firstName: null,
            lastName: null,
            displayName: null,
            name: null,
            access_granted: false,
            onboarding_status: 'not_started'
          };
          setUserData(fallbackData);
          return fallbackData;
        } else {
          throw fetchError;
        }
      } else if (data) {
        const userData: UserData = {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          displayName: data.display_name,
          name: data.first_name && data.last_name 
            ? `${data.first_name} ${data.last_name}`
            : data.first_name || data.last_name || null,
          access_granted: data.access_granted,
          onboarding_status: data.onboarding_status,
          gender: data.gender,
          birthday: data.birthday,
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: data.display_name
        };
        setUserData(userData);
        return userData;
      }
    } catch (err: any) {
      // Don't log expected errors for new users
      if (err?.code !== 'PGRST116') {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      }
      
      // Fallback to privyUser data if database fetch fails
      if (privyUser) {
        const fallbackData: UserData = {
          id: privyUser.id,
          email: privyUser.email || '',
          firstName: null,
          lastName: null,
          displayName: privyUser.name || null,
          name: privyUser.name || null,
          access_granted: false,
          onboarding_status: 'not_started'
        };
        setUserData(fallbackData);
        return fallbackData;
      }
    } finally {
      setLoading(false);
    }
    
    return null;
  };

  useEffect(() => {
    fetchUserData();
  }, [privyUser?.id]);

  // Listen for a custom event to refetch user data
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Refreshing user data due to event');
      fetchUserData();
    };

    // Listen for a custom event (we'll emit this when invitation code is validated)
    const subscription = DeviceEventEmitter.addListener('USER_DATA_REFRESH', handleRefresh);

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    userData,
    loading,
    error,
    refetch: fetchUserData
  };
};