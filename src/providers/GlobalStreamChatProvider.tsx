import { normalizeStreamUserId } from '../../shared/streamUserId';
import React, { useRef, useState, useEffect, createContext, useContext } from 'react';
import { StreamChat } from 'stream-chat';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';
import { logger } from '@/utils/logger';
import { notificationIntegration } from '@/services/notificationIntegration';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';

// Create a singleton client instance only if we have a valid key
let client: StreamChat;
try {
  if (STREAM_API_KEY && STREAM_API_KEY !== 'your-stream-api-key') {
    client = StreamChat.getInstance(STREAM_API_KEY);
  } else {
    console.warn('⚠️ Stream Chat API key not configured. Chat features will be disabled.');
    // Create a dummy client that won't connect
    client = {} as StreamChat;
  }
} catch (error) {
  console.error('Failed to initialize Stream Chat client:', error);
  client = {} as StreamChat;
}

// Track connection state
let isConnecting = false;
let isConnected = false;
let lastConnectedUserId: string | null = null;

interface StreamChatContextValue {
  client: StreamChat;
  isReady: boolean;
  connectionError: Error | null;
}

const StreamChatContext = createContext<StreamChatContextValue>({
  client,
  isReady: false,
  connectionError: null,
});

export const useStreamChat = () => useContext(StreamChatContext);

/**
 * Global Stream Chat Provider that initializes early and maintains connection
 * This should be placed high in the component tree (e.g., in App.tsx)
 */
export const GlobalStreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = usePrivyAuth();
  const connectionAttempted = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Skip if Stream Chat is not properly configured
    if (!client || !client.connectUser) {
      console.warn('Stream Chat not configured. Skipping connection.');
      setIsReady(true);
      return;
    }
    
    if (!user || !user.id) {
      // Disconnect if user logs out
      if (isConnected && client.disconnectUser) {
        client.disconnectUser().then(() => {
          isConnected = false;
          lastConnectedUserId = null;
          setIsReady(false);
        });
      }
      return;
    }
    
    // Prevent multiple connection attempts
    if (isConnecting || connectionAttempted.current) {
      return;
    }
    
    // Check if we're already connected with the same user
    const streamUserId = normalizeStreamUserId(user.id);
    if (isConnected && lastConnectedUserId === streamUserId) {
      setIsReady(true);
      return;
    }
    
    const connectToStream = async () => {
      try {
        isConnecting = true;
        connectionAttempted.current = true;
        setConnectionError(null);
        
        // Always disconnect if there's an existing connection
        if (client && client.userID && client.disconnectUser) {
          console.log('🔴 Disconnecting existing Stream Chat user:', client.userID);
          await client.disconnectUser();
          isConnected = false;
          lastConnectedUserId = null;
        }
        
        // Small delay to ensure disconnection completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch the Stream user token from backend
        console.log('🔄 Fetching Stream Chat token...');
        let tokenResponse;
        let USER_TOKEN;
        
        try {
          tokenResponse = await api.getChatUserToken();
          USER_TOKEN = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token;
        } catch (_tokenError: any) {
          // Log quietly for debugging
          console.log('⚠️ Stream Chat not available - continuing without chat features');
          
          // Don't show error to user - chat is optional
          setConnectionError(null);
          
          // Mark as ready so app continues functioning
          setIsReady(true);
          isConnecting = false;
          connectionAttempted.current = true; // Don't retry automatically
          return;
        }
        
        // Use the display name from backend if available
        let displayName = tokenResponse.displayName || user.name || '';
        
        // Generate display name if needed
        if (!displayName || displayName === 'User' || displayName === user.phoneNumber) {
          if (user.email) {
            displayName = user.email.split('@')[0];
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          } else if (user.phoneNumber) {
            const last4 = user.phoneNumber.slice(-4);
            displayName = `User ${last4}`;
          } else {
            displayName = 'Anonymous User';
          }
        }
        
        const displayInfo = user.email || user.phoneNumber || '';
        
        console.log('🔄 Connecting to Stream Chat...');
        try {
          // Verify client has connectUser method before attempting
          if (!client || !client.connectUser) {
            throw new Error('Stream Chat client not properly initialized');
          }
          
          await client.connectUser(
            {
              id: streamUserId,
              name: displayName,
              ...({ 
                email: user.email,
                phone: user.phoneNumber,
                displayInfo,
                subtitle: displayInfo,
              } as any),
            },
            USER_TOKEN
          );
          
          isConnected = true;
          lastConnectedUserId = streamUserId;
        } catch (_connectError: any) {
          // Log quietly for debugging
          console.log('⚠️ Stream Chat connection unavailable - continuing without chat');
          
          // Clear any failed connection
          if (client && client.userID && client.disconnectUser) {
            try {
              await client.disconnectUser();
            } catch {
              // Ignore disconnection errors
            }
          }
          isConnected = false;
          lastConnectedUserId = null;
          
          // Don't show error to user
          setConnectionError(null);
          
          // Mark as ready even if chat fails
          setIsReady(true);
          connectionAttempted.current = true; // Don't retry automatically
          return;
        }
        
        // Initialize notification integration
        await notificationIntegration.initialize(streamUserId, client);
        
        setIsReady(true);
        logger.info('✅ Stream Chat connected successfully (global provider)');
      } catch (_error) {
        // Log quietly for debugging
        console.log('⚠️ Stream Chat unavailable - app will continue without chat');
        connectionAttempted.current = true; // Don't retry automatically
        // Still mark as ready even if chat fails - app can function without chat
        setIsReady(true);
        setConnectionError(null); // Don't show error to user
      } finally {
        isConnecting = false;
      }
    };
    
    // Connect immediately when user is available
    connectToStream();
    
    // Cleanup function - only disconnect on logout, not on unmount
    return () => {
      // Don't disconnect here - keep connection alive
    };
  }, [user?.id, user?.name, user?.email, user?.phoneNumber]);

  // Provide the client and ready state to all children
  return (
    <StreamChatContext.Provider value={{ client, isReady, connectionError }}>
      {children}
    </StreamChatContext.Provider>
  );
};