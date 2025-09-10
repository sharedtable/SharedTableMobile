/**
 * Optimized Channel List Screen with performance improvements
 * - Uses React.memo to prevent unnecessary re-renders
 * - Optimized channel preview component
 * - Lazy loading for better initial render
 */

import React, { useCallback, useMemo, memo } from 'react';
import { View, StyleSheet, Pressable, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChannelList,
} from 'stream-chat-expo';
import type { Channel, ChannelMemberResponse } from 'stream-chat';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { theme } from '@/theme';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { normalizeStreamUserId } from '../../../shared/streamUserId';
import { ChatStackParamList } from './ChatNavigator';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

interface CustomChannelPreviewProps {
  channel: Channel;
  latestMessagePreview?: any;
  unread?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Memoized channel preview to prevent re-renders
const CustomChannelPreview: React.FC<CustomChannelPreviewProps> = memo((props) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = usePrivyAuth();
  const scale = useSharedValue(1);
  
  const channel = props.channel;
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = useCallback(() => {
    if (channel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.98, {}, () => {
        scale.value = withSpring(1);
      });
      navigation.navigate('Channel', { channelId: channel.id! });
    }
  }, [channel, navigation, scale]);

  // Optimized channel name calculation
  const channelName = useMemo(() => {
    let name = 'Channel';
    
    if ((channel?.data as any)?.name) {
      name = (channel.data as any).name;
    } else if (channel?.type === 'messaging') {
      const currentUserId = user?.id ? normalizeStreamUserId(user.id) : '';
      const members = Object.values(channel?.state?.members || {});
      const otherMembers = members.filter((member: ChannelMemberResponse) => 
        member.user?.id !== currentUserId
      );
      
      if (otherMembers.length === 1) {
        const otherUser = (otherMembers[0] as any).user;
        name = otherUser?.name || 'Direct Message';
        
        if (name === otherUser?.id || 
            name.startsWith('!members-') || 
            name.includes('did:privy:')) {
          name = 'User';
        }
      } else if (otherMembers.length > 1) {
        const names = otherMembers
          .slice(0, 2)
          .map((m: ChannelMemberResponse) => m.user?.name || 'User')
          .filter(n => !n.startsWith('!members-') && !n.includes('did:privy:'))
          .join(', ');
        name = otherMembers.length > 2 
          ? `${names} +${otherMembers.length - 2}` 
          : names || 'Group Chat';
      }
    }
    
    if (name.startsWith('!members-') || 
        name.includes('did:privy:') ||
        name.includes('cmekwb')) {
      name = 'Chat';
    }
    
    return name;
  }, [channel, user?.id]);

  const gradientColors = useMemo(() => {
    const colors: [string, string][] = [
      ['#667EEA', '#764BA2'],
      ['#F093FB', '#F5576C'],
      ['#4FACFE', '#00F2FE'],
      ['#43E97B', '#38F9D7'],
      ['#FA709A', '#FEE140'],
      ['#30CFD0', '#330867'],
    ];
    const index = channelName.charCodeAt(0) % colors.length;
    return colors[index];
  }, [channelName]);

  if (!channel) {
    return null;
  }

  const unread = channel?.state?.unreadCount || 0;
  const messages = channel?.state?.messages || [];
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageText = latestMessage?.text || 'No messages yet';
  const lastMessageTime = latestMessage?.created_at ? new Date(latestMessage.created_at) : null;
  const timeText = lastMessageTime ? formatTime(lastMessageTime) : '';

  let avatarLetter = channelName.charAt(0).toUpperCase();
  if (avatarLetter === '!' || avatarLetter === 'C') {
    avatarLetter = 'U';
  }

  return (
    <AnimatedPressable 
      style={[styles.channelPreview, animatedStyle]} 
      onPress={handlePress}
      entering={FadeInDown.duration(300).springify()}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </LinearGradient>
        {unread > 0 && (
          <View style={styles.unreadDot} />
        )}
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
          <Text style={[styles.messageText, unread > 0 && styles.unreadMessage]} numberOfLines={1}>
            {lastMessageText}
          </Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.channel.id === nextProps.channel.id &&
    prevProps.channel.state?.unreadCount === nextProps.channel.state?.unreadCount &&
    prevProps.channel.state?.messages?.length === nextProps.channel.state?.messages?.length
  );
});

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};

// Memoized empty state component
const EmptyState = memo(() => {
  const navigation = useNavigation<NavigationProp>();
  
  const handleNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('NewChat');
  }, [navigation]);
  
  return (
    <Animated.View 
      style={styles.emptyState}
      entering={FadeInDown.duration(500).springify()}
    >
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <Ionicons name="chatbubbles" size={40} color="white" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        Start a new conversation to connect with other SharedTable members
      </Text>
      <Pressable 
        style={styles.newChatButton} 
        onPress={handleNewChat}
      >
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.newChatButtonGradient}
        >
          <Text style={styles.newChatButtonText}>Start New Chat</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

export const OptimizedChannelListScreen: React.FC = memo(() => {
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
      message_limit: 1,
      member_limit: 100,
    };
  }, []);

  const handleNewChat = useCallback(() => {
    navigation.navigate('NewChat');
  }, [navigation]);

  const handleChannelSelect = useCallback((channel: Channel) => {
    navigation.navigate('Channel', { channelId: channel.id! });
  }, [navigation]);

  const handleFriends = useCallback(() => {
    navigation.getParent()?.navigate('Profile', {
      screen: 'FindFriends',
    });
  }, [navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable 
            onPress={handleFriends} 
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people-outline" size={24} color={theme.colors.primary.main} />
          </Pressable>
          <Pressable 
            onPress={handleNewChat} 
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newChatGradient}
            >
              <Ionicons name="add" size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, handleNewChat, handleFriends]);

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
        EmptyStateIndicator={EmptyState}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray['50'],
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  newChatGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  channelPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.ios.red,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  channelName: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  timeText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  unreadMessage: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  unreadBadge: {
    backgroundColor: theme.colors.ui.blueIndigo,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    marginLeft: 8,
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
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  newChatButton: {
    overflow: 'hidden',
    borderRadius: 25,
  },
  newChatButtonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  newChatButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 15,
  },
});