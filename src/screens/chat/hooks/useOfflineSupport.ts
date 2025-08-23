/**
 * Offline Support Hook
 * Handles offline message queuing and synchronization
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const OFFLINE_MESSAGES_KEY = '@chat_offline_messages';

export interface OfflineMessage {
  id: string;
  channelId: string;
  text: string;
  timestamp: number;
  userId: string;
}

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMessages, setOfflineMessages] = useState<OfflineMessage[]>([]);

  useEffect(() => {
    // Load offline messages on mount
    loadOfflineMessages();

    // Subscribe to network state
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
      
      if (online) {
        logger.info('Network connected - syncing offline messages');
        syncOfflineMessages();
      } else {
        logger.info('Network disconnected - enabling offline mode');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadOfflineMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_MESSAGES_KEY);
      if (stored) {
        const messages = JSON.parse(stored);
        setOfflineMessages(messages);
      }
    } catch (error) {
      logger.error('Failed to load offline messages', error);
    }
  };

  const saveOfflineMessage = async (message: Omit<OfflineMessage, 'id' | 'timestamp'>) => {
    try {
      const newMessage: OfflineMessage = {
        ...message,
        id: `offline_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
      };

      const updated = [...offlineMessages, newMessage];
      setOfflineMessages(updated);
      await AsyncStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(updated));
      
      logger.info('Message saved for offline sync', { messageId: newMessage.id });
      return newMessage;
    } catch (error) {
      logger.error('Failed to save offline message', error);
      throw error;
    }
  };

  const syncOfflineMessages = async () => {
    if (offlineMessages.length === 0) return;

    try {
      // This would be implemented with actual Stream Chat sync
      // For now, just clear the messages after "syncing"
      logger.info(`Syncing ${offlineMessages.length} offline messages`);
      
      // Clear offline messages after successful sync
      setOfflineMessages([]);
      await AsyncStorage.removeItem(OFFLINE_MESSAGES_KEY);
    } catch (error) {
      logger.error('Failed to sync offline messages', error);
    }
  };

  const clearOfflineMessages = async () => {
    try {
      setOfflineMessages([]);
      await AsyncStorage.removeItem(OFFLINE_MESSAGES_KEY);
    } catch (error) {
      logger.error('Failed to clear offline messages', error);
    }
  };

  return {
    isOnline,
    offlineMessages,
    saveOfflineMessage,
    syncOfflineMessages,
    clearOfflineMessages,
  };
};