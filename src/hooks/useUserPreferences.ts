import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { supabase } from '@/lib/supabase/client';
import { UserPreferences, UserPreferencesUpdate } from '@/lib/supabase/types/database';

interface UserPreferencesData {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreference: (key: string, value: any) => Promise<boolean>;
  getPreference: (key: string, defaultValue?: any) => any;
}

// Mapping of preference keys to storage locations
const PREFERENCE_STORAGE: Record<string, 'local' | 'database'> = {
  // Local storage for app-specific settings
  notifications_push_enabled: 'local',
  notifications_event_reminders: 'local',
  notifications_booking_updates: 'local',
  notifications_chat_messages: 'local',
  notifications_promotional: 'local',
  notifications_sound_enabled: 'local',
  notifications_badge_enabled: 'local',
  app_theme_mode: 'local',
  app_font_size: 'local',
  app_reduce_motion: 'local',
  privacy_biometric_auth: 'local',
  privacy_profile_visibility: 'local',
  privacy_location_sharing: 'local',
  privacy_data_analytics: 'local',
  privacy_activity_status: 'local',

  // Database storage for dining preferences
  preferred_cuisines: 'database',
  dietary_restrictions: 'database',
  preferred_price_range: 'database',
  preferred_times: 'database',
  preferred_days: 'database',
  max_travel_distance: 'database',
  group_size_preference: 'database',
  notification_preferences: 'database',
};

export const useUserPreferences = (): UserPreferencesData => {
  const { user } = usePrivyAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [localPreferences, setLocalPreferences] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Load preferences from database and local storage
  useEffect(() => {
    loadPreferences();
  }, [user?.email]);

  const loadPreferences = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Privy user ID directly
      const userId = user.id;
      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }
      setDbUserId(userId);

      // Load database preferences
      const { data: dbPreferences, error: dbError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Error loading database preferences:', dbError);
        setError('Failed to load preferences');
      } else {
        setPreferences(dbPreferences);
      }

      // Load local preferences
      const localPrefs: Record<string, any> = {};
      const localKeys = Object.keys(PREFERENCE_STORAGE).filter(
        (key) => PREFERENCE_STORAGE[key] === 'local'
      );

      for (const key of localKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            localPrefs[key] = JSON.parse(value);
          }
        } catch (error) {
          console.error(`Error loading local preference ${key}:`, error);
        }
      }

      setLocalPreferences(localPrefs);
    } catch (err) {
      console.error('Error in loadPreferences:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: any): Promise<boolean> => {
    if (!user?.email || !dbUserId) {
      console.error('No user available for preference update');
      return false;
    }

    const storageType = PREFERENCE_STORAGE[key];
    if (!storageType) {
      console.error(`Unknown preference key: ${key}`);
      return false;
    }

    try {
      if (storageType === 'local') {
        // Store in AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(value));
        setLocalPreferences((prev) => ({ ...prev, [key]: value }));
        return true;
      } else {
        // Store in database
        const updateData = { [key]: value };

        if (preferences) {
          // Update existing preferences
          const { error } = await supabase
            .from('user_preferences')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            } as UserPreferencesUpdate)
            .eq('user_id', dbUserId);

          if (error) {
            console.error('Error updating database preferences:', error);
            return false;
          }
        } else {
          // Create new preferences record
          const { error } = await supabase.from('user_preferences').insert([{
            user_id: dbUserId,
            ...updateData,
          }]);

          if (error) {
            console.error('Error creating database preferences:', error);
            return false;
          }
        }

        // Reload preferences to get updated data
        await loadPreferences();
        return true;
      }
    } catch (error) {
      console.error(`Error updating preference ${key}:`, error);
      return false;
    }
  };

  const getPreference = (key: string, defaultValue: any = null): any => {
    const storageType = PREFERENCE_STORAGE[key];

    if (storageType === 'local') {
      return localPreferences[key] ?? defaultValue;
    } else if (storageType === 'database' && preferences) {
      return (preferences as any)[key] ?? defaultValue;
    }

    return defaultValue;
  };

  return {
    preferences,
    loading,
    error,
    updatePreference,
    getPreference,
  };
};
