import { normalizeStreamUserId } from '../../../shared/streamUserId';
import React from 'react';

import {
  Chat,
  OverlayProvider,
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
} from 'stream-chat-expo';
import { StreamChat } from 'stream-chat';
import { useState } from 'react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';
// Note: Never use STREAM_SECRET in client code! Only use the public key here.
const client = StreamChat.getInstance(STREAM_API_KEY);

export const StreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = usePrivyAuth();
  React.useEffect(() => {
    if (!user || !user.id || !user.name) return;
    const fetchAndConnect = async () => {
      try {
        // Fetch the Stream user token from your backend using the api service
        const USER_TOKEN = await api.getChatUserToken();
        const streamUserId = normalizeStreamUserId(user.id);
        console.log('Fetched Stream USER_TOKEN:', USER_TOKEN);
        console.log('Privy user.id:', user.id, 'Stream user.id:', streamUserId);
        await client.connectUser(
          {
            id: streamUserId,
            name: user.name,
          },
          USER_TOKEN
        );
      } catch (e) {
        // Handle error
        console.error('Stream connectUser error:', e);
      }
    };
    fetchAndConnect();
    return () => {
      client.disconnectUser();
    };
  }, [user]);

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
};

export const BasicChannelListScreen: React.FC = () => {
  const [channel, setChannel] = useState<any>(null);
  if (channel) {
    return (
      <Channel channel={channel}>
        <MessageList />
        <MessageInput />
      </Channel>
    );
  }
  return <ChannelList onSelect={setChannel} />;
};
