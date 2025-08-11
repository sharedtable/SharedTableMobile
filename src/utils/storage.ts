import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage for sensitive data (tokens, passwords, etc.)
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting secure item ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
    }
  },
};

// Regular storage for non-sensitive data (preferences, cache, etc.)
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return [];
    }
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
    }
  },
};

// Helper functions for JSON data
export const jsonStorage = {
  async getItem<T>(key: string): Promise<T | null> {
    const value = await storage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    await storage.setItem(key, JSON.stringify(value));
  },
};

// Cache with expiration
export const cacheStorage = {
  async getItem<T>(key: string): Promise<T | null> {
    const cached = await jsonStorage.getItem<{ data: T; expiry: number }>(`cache_${key}`);
    if (cached) {
      if (Date.now() < cached.expiry) {
        return cached.data;
      }
      await storage.removeItem(`cache_${key}`);
    }
    return null;
  },

  async setItem<T>(key: string, value: T, ttlMs: number = 3600000): Promise<void> {
    const cacheData = {
      data: value,
      expiry: Date.now() + ttlMs,
    };
    await jsonStorage.setItem(`cache_${key}`, cacheData);
  },

  async removeItem(key: string): Promise<void> {
    await storage.removeItem(`cache_${key}`);
  },

  async clearExpired(): Promise<void> {
    const keys = await storage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    
    for (const key of cacheKeys) {
      const cached = await jsonStorage.getItem<{ expiry: number }>(key);
      if (cached && Date.now() >= cached.expiry) {
        await storage.removeItem(key);
      }
    }
  },
};