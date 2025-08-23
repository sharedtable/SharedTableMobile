/**
 * Channel Screen
 * Individual chat channel with messages, input, and actions
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Channel,
  MessageList,
  MessageInput,
  KeyboardCompatibleView,
} from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { ChatStackParamList } from './ChatNavigator';
import { useChatClient } from './hooks/useChatClient';

type RouteProps = RouteProp<ChatStackParamList, 'Channel'>;
type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;



export const ChannelScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const client = useChatClient();
  const [channel, setChannel] = useState<any>(null);

  const { channelId } = route.params;

  useEffect(() => {
    if (!client || !channelId) return;

    const fetchChannel = async () => {
      try {
        // Wait for client to be ready
        if (!client.userID) {
          return;
        }

        // Query channel with message history
        const channels = await client.queryChannels(
          { id: channelId },
          { last_message_at: -1 as const },
          {
            state: true,
            watch: true,
            presence: true,
            message_limit: 30, // Load last 30 messages
          }
        );
        
        if (channels.length > 0) {
          const channelInstance = channels[0];
          
          // Make sure the channel is properly initialized with messages
          await channelInstance.watch();
          
          setChannel(channelInstance);
          
          // Set navigation title based on channel type and members
          let channelTitle = 'Chat';
          
          const channelData = channelInstance.data as any;
          if (channelData?.name) {
            // Use custom channel name if set
            channelTitle = channelData.name;
          } else if (channelInstance.type === 'messaging') {
            // For direct messages, show the other user's name
            const members = Object.values(channelInstance.state.members || {});
            const otherMembers = members.filter((member: any) => 
              member.user?.id !== client.userID
            );
            
            if (otherMembers.length === 1) {
              // Direct message - show other user's name
              const otherUser = otherMembers[0].user;
              channelTitle = otherUser?.name || otherUser?.id || 'Direct Message';
            } else if (otherMembers.length > 1) {
              // Group chat - show member names
              const names = otherMembers
                .slice(0, 3)
                .map((m: any) => m.user?.name || 'User')
                .join(', ');
              channelTitle = otherMembers.length > 3 
                ? `${names} +${otherMembers.length - 3}` 
                : names;
            }
          }
          
          // Don't show normalized IDs in the title
          if (channelTitle.startsWith('!members-') || channelTitle.includes('did:privy:')) {
            channelTitle = 'Chat';
          }
          
          navigation.setOptions({
            title: channelTitle,
            headerRight: () => (
              <View style={styles.headerRight}>
                <Pressable 
                  onPress={() => handleVideoCall()}
                  style={styles.headerButton}
                >
                  <Ionicons name="videocam-outline" size={24} color={theme.colors.primary.main} />
                </Pressable>
                <Pressable 
                  onPress={() => handleChannelInfo()}
                  style={styles.headerButton}
                >
                  <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary.main} />
                </Pressable>
              </View>
            ),
          });
        }
      } catch (error) {
        // Only show alert for actual errors, not connection issues
        if (error instanceof Error && !error.message.includes('connectUser')) {
          Alert.alert('Error', 'Failed to load channel');
        }
      }
    };

    // Add a small delay and retry logic
    const timer = setTimeout(fetchChannel, 500);
    return () => clearTimeout(timer);
  }, [client, channelId, navigation]);

  const handleVideoCall = useCallback(() => {
    Alert.alert(
      'Video Call',
      'Video calling feature coming soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleChannelInfo = useCallback(() => {
    navigation.navigate('ChannelMembers', { channelId });
  }, [navigation, channelId]);

  const handleThreadSelect = useCallback((message: any) => {
    if (!message?.id) return;
    
    navigation.navigate('Thread', {
      channelId,
      messageId: message.id,
      parentMessage: message,
    });
  }, [navigation, channelId]);


  if (!channel) {
    return (
      <View style={styles.loading}>
        <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.gray['3']} />
      </View>
    );
  }

  return (
    <KeyboardCompatibleView style={styles.container}>
      <Channel 
        channel={channel}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <MessageList
          onThreadSelect={handleThreadSelect}
          additionalFlatListProps={{
            keyboardDismissMode: 'on-drag',
          }}
          DateHeader={() => null}
          disableTypingIndicator={false}
          NetworkDownIndicator={() => null}
        />
        <MessageInput
          additionalTextInputProps={{
            placeholder: 'Type a message...',
            placeholderTextColor: theme.colors.text.secondary,
          }}
          compressImageQuality={0.7}
        />
      </Channel>
    </KeyboardCompatibleView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
});