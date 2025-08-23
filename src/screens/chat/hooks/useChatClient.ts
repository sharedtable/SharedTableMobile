/**
 * Hook to get Stream Chat client instance
 */

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';

// Use singleton instance
let clientInstance: StreamChat | null = null;

export const useChatClient = () => {
  const [client, setClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    // Get or create singleton instance
    if (!clientInstance) {
      clientInstance = StreamChat.getInstance(STREAM_API_KEY);
    }
    setClient(clientInstance);
  }, []);

  return client;
};