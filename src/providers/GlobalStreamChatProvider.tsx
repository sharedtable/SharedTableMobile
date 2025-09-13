import { normalizeStreamUserId } from '../../shared/streamUserId';
import React, { useRef, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { StreamChat } from 'stream-chat';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';
import { logger } from '@/utils/logger';
import { notificationIntegration } from '@/services/notificationIntegration';
import { Alert, AppState, AppStateStatus } from 'react-native';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// Create a singleton client instance only if we have a valid key
let client: StreamChat | null = null;

// Initialize client with proper error handling
const initializeClient = (): StreamChat | null => {
  try {
    if (!STREAM_API_KEY || STREAM_API_KEY === 'your-stream-api-key') {
      console.warn('⚠️ Stream Chat API key not configured. Chat features will be disabled.');
      return null;
    }
    
    if (!client) {
      client = StreamChat.getInstance(STREAM_API_KEY);
      console.log('✅ Stream Chat client initialized');
    }
    return client;
  } catch (error) {
    console.error('Failed to initialize Stream Chat client:', error);
    return null;
  }
};

// Track connection state
const connectionState = {
  isConnecting: false,
  isConnected: false,
  lastConnectedUserId: null as string | null,
  retryCount: 0,
  lastError: null as Error | null,
};

interface StreamChatContextValue {
  client: StreamChat | null;
  isReady: boolean;
  connectionError: Error | null;
  reconnect: () => Promise<void>;
  isConnecting: boolean;
}

const StreamChatContext = createContext<StreamChatContextValue>({
  client: null,
  isReady: false,
  connectionError: null,
  reconnect: async () => {},
  isConnecting: false,
});

export const useStreamChat = () => useContext(StreamChatContext);

/**
 * Global Stream Chat Provider with robust error handling and retry logic
 */
export const GlobalStreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = usePrivyAuth();
  const connectionAttempted = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Initialize client on mount
  useEffect(() => {
    const chatClient = initializeClient();
    if (chatClient) {
      client = chatClient;
      console.log('🚀 Stream Chat client created, waiting for user authentication...');
    }
  }, []);
  
  // Function to disconnect safely
  const disconnectSafely = async () => {
    if (client?.userID && client?.disconnectUser) {
      try {
        console.log('🔴 Disconnecting Stream Chat user:', client.userID);
        await client.disconnectUser();
        connectionState.isConnected = false;
        connectionState.lastConnectedUserId = null;
        setIsReady(false);
      } catch (error) {
        console.error('Error during disconnect:', error);
      }
    }
  };
  
  // Main connection function with retry logic
  const connectToStream = useCallback(async (retryAttempt = 0): Promise<boolean> => {
    // Skip if Stream Chat is not properly configured
    if (!client) {
      client = initializeClient();
      if (!client) {
        console.warn('Stream Chat client not available');
        setIsReady(true); // Allow app to continue
        return false;
      }
    }
    
    if (!user?.id) {
      await disconnectSafely();
      return false;
    }
    
    // Prevent multiple simultaneous connection attempts
    if (connectionState.isConnecting) {
      console.log('⏳ Connection already in progress...');
      return false;
    }
    
    // Check if already connected with same user
    const streamUserId = normalizeStreamUserId(user.id);
    if (connectionState.isConnected && connectionState.lastConnectedUserId === streamUserId) {
      console.log('✅ Already connected with same user');
      setIsReady(true);
      return true;
    }
    
    try {
      connectionState.isConnecting = true;
      setIsConnecting(true);
      setConnectionError(null);
      
      // Disconnect any existing connection
      if (client.userID) {
        await disconnectSafely();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for disconnect
      }
      
      console.log(`🔄 Attempting to connect to Stream Chat (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
      
      // Fetch Stream Chat token with timeout
      const tokenPromise = api.getChatUserToken();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Token fetch timeout')), 10000)
      );
      
      let tokenData;
      try {
        tokenData = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (error: any) {
        console.error('❌ Failed to fetch Stream Chat token:', error.message);
        throw new Error('Unable to fetch chat token. Please check your connection.');
      }
      
      const USER_TOKEN = typeof tokenData === 'string' ? tokenData : tokenData.token;
      
      // Generate display name
      let displayName = tokenData.displayName || user.name || '';
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
      
      // Connect to Stream Chat with timeout
      const connectPromise = client.connectUser(
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
      
      const connectTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      await Promise.race([connectPromise, connectTimeoutPromise]);
      
      connectionState.isConnected = true;
      connectionState.lastConnectedUserId = streamUserId;
      connectionState.retryCount = 0;
      connectionState.lastError = null;
      
      // Initialize notification integration for real-time chat notifications
      try {
        console.log('🔔 Initializing notification integration for Stream Chat...');
        await notificationIntegration.initialize(streamUserId, client);
        console.log('✅ Notification integration initialized - Chat notifications will work in background');
      } catch (error) {
        console.warn('Failed to initialize notifications:', error);
      }
      
      setIsReady(true);
      setConnectionError(null);
      logger.info('✅ Stream Chat connected successfully');
      return true;
      
    } catch (error: any) {
      console.error(`❌ Stream Chat connection failed (attempt ${retryAttempt + 1}):`, error.message);
      connectionState.lastError = error;
      
      // Retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        connectionState.retryCount = retryAttempt + 1;
        
        // Schedule retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return connectToStream(retryAttempt + 1);
      } else {
        // Max retries reached
        console.error('❌ Max retry attempts reached. Chat connection failed.');
        setConnectionError(new Error('Unable to connect to chat. Please check your connection and try again.'));
        
        // Still mark as ready so app can function
        setIsReady(true);
        
        // Show user-friendly error
        Alert.alert(
          'Chat Connection Issue',
          'Unable to connect to chat. You can still use other features. Please try again later.',
          [
            {
              text: 'Retry',
              onPress: () => reconnect(),
            },
            {
              text: 'Continue',
              style: 'cancel',
            },
          ]
        );
        
        return false;
      }
    } finally {
      connectionState.isConnecting = false;
      setIsConnecting(false);
    }
  }, [user?.id, user?.name, user?.email, user?.phoneNumber]);
  
  // Manual reconnect function
  const reconnect = useCallback(async () => {
    console.log('🔄 Manual reconnect requested');
    connectionState.retryCount = 0;
    connectionAttempted.current = false;
    await connectToStream(0);
  }, [connectToStream]);
  
  // Handle app state changes (reconnect when app comes to foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user?.id &&
        !connectionState.isConnected
      ) {
        console.log('📱 App came to foreground, checking connection...');
        // Debounce reconnection attempt
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToStream(0);
        }, 1000);
      }
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.id, connectToStream]);
  
  // Main connection effect - Connect immediately when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      disconnectSafely();
      connectionAttempted.current = false;
      return;
    }
    
    // Reset connection attempt flag when user changes
    const currentUserId = normalizeStreamUserId(user.id);
    if (connectionState.lastConnectedUserId !== currentUserId) {
      connectionAttempted.current = false;
    }
    
    // Only attempt connection once per user session
    if (connectionAttempted.current) {
      return;
    }
    
    connectionAttempted.current = true;
    
    // Connect immediately for notifications to work
    console.log('👤 User authenticated, connecting to Stream Chat for notifications...');
    connectToStream(0);
    
    // Cleanup on unmount (not on user change)
    return () => {
      // Don't disconnect here - keep connection alive
    };
  }, [user?.id, connectToStream]);
  
  // Provide enhanced context with reconnect capability
  return (
    <StreamChatContext.Provider 
      value={{ 
        client, 
        isReady, 
        connectionError,
        reconnect,
        isConnecting,
      }}
    >
      {children}
    </StreamChatContext.Provider>
  );
};