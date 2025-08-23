import { normalizeStreamUserId } from '../../../shared/streamUserId';
import React, { useRef, useState } from 'react';

import {
  Chat,
  OverlayProvider,
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
} from 'stream-chat-expo';
import { StreamChat } from 'stream-chat';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';
import { logger } from '@/utils/logger';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';
// Note: Never use STREAM_SECRET in client code! Only use the public key here.
const client = StreamChat.getInstance(STREAM_API_KEY);

// Track connection state to prevent multiple connections
let isConnecting = false;
let isConnected = false;
let lastConnectedUserId: string | null = null;

export const StreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = usePrivyAuth();
  const connectionAttempted = useRef(false);
  const [clientReady, setClientReady] = useState(false);
  
  React.useEffect(() => {
    if (!user || !user.id) return;
    
    // Prevent multiple connection attempts
    if (isConnecting || connectionAttempted.current) {
      return;
    }
    
    // Check if we're already connected with the same user
    if (isConnected && lastConnectedUserId === normalizeStreamUserId(user.id)) {
      setClientReady(true);
      return;
    }
    
    const fetchAndConnect = async () => {
      try {
        isConnecting = true;
        connectionAttempted.current = true;
        
        const streamUserId = normalizeStreamUserId(user.id);
        
        // Always disconnect if there's an existing connection to ensure fresh data
        if (client.userID) {
          console.log('🔴 Disconnecting existing Stream Chat user:', client.userID);
          await client.disconnectUser();
          isConnected = false;
          lastConnectedUserId = null;
        }
        
        // Small delay to ensure disconnection completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch the Stream user token from your backend using the api service
        const tokenResponse = await api.getChatUserToken();
        const USER_TOKEN = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token;
        
        // Use the display name from backend if available, otherwise generate locally
        let displayName = tokenResponse.displayName || user.name || '';
        
        // If the backend didn't provide a good display name, create one locally
        if (!displayName || displayName === 'User' || displayName === user.phoneNumber) {
          if (user.email) {
            displayName = user.email.split('@')[0];
            // Capitalize first letter
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          } else if (user.phoneNumber) {
            // Format phone number for display
            const last4 = user.phoneNumber.slice(-4);
            displayName = `User ${last4}`;
          } else {
            displayName = 'Anonymous User';
          }
        }
        
        // Create display info - show email or phone as subtitle
        const displayInfo = user.email || user.phoneNumber || '';
        
        // The backend already updated the user in Stream, so we just connect
        await client.connectUser(
          {
            id: streamUserId,
            name: displayName,
            // Add custom data for display
            ...({ 
              email: user.email,
              phone: user.phoneNumber,
              displayInfo,
              subtitle: displayInfo,
            } as any), // Custom fields for Stream Chat
          },
          USER_TOKEN
        );
        
        isConnected = true;
        lastConnectedUserId = streamUserId;
        setClientReady(true);
        logger.info('Stream Chat connected successfully');
      } catch (e) {
        // Handle error
        logger.error('Stream Chat connection failed', e);
        connectionAttempted.current = false; // Allow retry on error
        setClientReady(false);
      } finally {
        isConnecting = false;
      }
    };
    
    fetchAndConnect();
    
    // Don't disconnect on cleanup - let the app handle this globally
    return () => {
      // We'll keep the connection alive unless explicitly logging out
    };
  }, [user?.id, user?.name, user?.email, user?.phoneNumber]);

  // Don't render children until client is ready
  if (!clientReady) {
    return null;
  }

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
