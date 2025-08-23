/**
 * Channel List Screen
 * Displays all user's channels with search and filtering
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChannelList,
} from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { normalizeStreamUserId } from '../../../shared/streamUserId';
import { ChatStackParamList } from './ChatNavigator';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

interface CustomChannelPreviewProps {
  channel: any; // Stream Channel type
  latestMessagePreview?: any; // Stream message preview
  unread?: number;
}

const CustomChannelPreview: React.FC<CustomChannelPreviewProps> = (props) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = usePrivyAuth();
  
  // Extract channel from props (Stream Chat passes it this way)
  const channel = props.channel;
  
  const handlePress = useCallback(() => {
    if (channel) {
      navigation.navigate('Channel', { channelId: channel.id });
    }
  }, [channel, navigation]);

  if (!channel) {
    return null;
  }

  const unread = channel?.state?.unreadCount || 0;
  
  // Get proper channel name based on type
  let channelName = 'Channel';
  
  
  if (channel?.data?.name) {
    // Use custom channel name if set
    channelName = channel.data.name;
  } else if (channel?.type === 'messaging') {
    // For direct messages, show the other user's name
    const currentUserId = user?.id ? normalizeStreamUserId(user.id) : '';
    const members = Object.values(channel?.state?.members || {});
    const otherMembers = members.filter((member: any) => 
      member.user?.id !== currentUserId
    );
    
    if (otherMembers.length === 1) {
      // Direct message - show other user's name
      const otherUser = (otherMembers[0] as any).user;
      channelName = otherUser?.name || 'Direct Message';
      
      // Don't show the ID if it's still normalized
      if (channelName === otherUser?.id || 
          channelName.startsWith('!members-') || 
          channelName.includes('did:privy:')) {
        channelName = 'User';
      }
    } else if (otherMembers.length > 1) {
      // Group chat - show member names
      const names = otherMembers
        .slice(0, 2)
        .map((m: any) => m.user?.name || 'User')
        .filter(name => !name.startsWith('!members-') && !name.includes('did:privy:'))
        .join(', ');
      channelName = otherMembers.length > 2 
        ? `${names} +${otherMembers.length - 2}` 
        : names || 'Group Chat';
    }
  }
  
  // Final check - don't show normalized IDs
  if (channelName.startsWith('!members-') || 
      channelName.includes('did:privy:') ||
      channelName.includes('cmekwb')) {
    channelName = 'Chat';
  }
  
  // Get the latest message safely
  const messages = channel?.state?.messages || [];
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  
  // Get the last message text for display
  const lastMessageText = latestMessage?.text || 'No messages yet';
  
  // Get the last message time
  const lastMessageTime = latestMessage?.created_at ? new Date(latestMessage.created_at) : null;
  const timeText = lastMessageTime ? formatTime(lastMessageTime) : '';


  // Get first letter for avatar - make sure it's not from an ID
  let avatarLetter = channelName.charAt(0).toUpperCase();
  if (avatarLetter === '!' || avatarLetter === 'C') {
    // Fallback for IDs that slipped through
    avatarLetter = 'U';
  }

  return (
    <Pressable style={styles.channelPreview} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </View>
      </View>
      <View style={styles.channelInfo}>
        <View style={styles.channelHeader}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channelName}
          </Text>
          {timeText ? (
            <Text style={styles.timeText}>{timeText}</Text>
          ) : null}
        </View>
        <View style={styles.channelFooter}>
          <Text style={styles.messageText} numberOfLines={1}>
            {lastMessageText}
          </Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// Helper function to format time
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};

export const ChannelListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = usePrivyAuth();

  const userId = useMemo(() => {
    return user?.id ? normalizeStreamUserId(user.id) : undefined;
  }, [user?.id]);

  const filters = useMemo(() => {
    if (!userId) return undefined;
    return {
      type: 'messaging',
      members: { $in: [userId] },
    };
  }, [userId]);

  const sort = useMemo(() => {
    return { last_message_at: -1 as const };
  }, []);

  const options = useMemo(() => {
    return {
      state: true,
      watch: true,
      presence: true,
      limit: 20,
      message_limit: 1, // Load at least one message per channel for preview
      member_limit: 100, // Load all members to get their names
    };
  }, []);

  const handleNewChat = useCallback(() => {
    navigation.navigate('NewChat');
  }, [navigation]);

  const handleChannelSelect = useCallback((channel: any) => { // Stream Channel
    navigation.navigate('Channel', { channelId: channel.id });
  }, [navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleNewChat} style={styles.headerButton}>
          <Ionicons name="create-outline" size={24} color={theme.colors.primary.main} />
        </Pressable>
      ),
    });
  }, [navigation, handleNewChat]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Please log in to view messages</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={handleChannelSelect}
        Preview={CustomChannelPreview}
        EmptyStateIndicator={() => (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.gray['3']} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Start a new conversation to connect with other SharedTable members
            </Text>
            <Pressable style={styles.newChatButton} onPress={handleNewChat}>
              <Text style={styles.newChatButtonText}>Start New Chat</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  headerButton: {
    padding: 8,
  },
  channelPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray['1'],
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: theme.colors.white,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  newChatButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 16,
  },
});