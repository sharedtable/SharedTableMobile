import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isYesterday, isToday } from 'date-fns';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api, EventMessage } from '@/services/api';

type RouteParams = {
  EventChat: {
    eventId: string;
    eventTitle: string;
    isHost: boolean;
  };
};


const EventChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventChat'>>();
  const { eventId, eventTitle, isHost } = route.params;
  
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<EventMessage | null>(null);
  const [currentUserId] = useState('current-user-id'); // TODO: Get from auth
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchMessages();
    // TODO: Set up real-time updates
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const response = await api.getEventMessages(eventId, { limit: 50 });
      if (response.success && response.data) {
        setMessages(response.data.reverse());
      }
    } catch {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Haptic feedback can be added if needed

    setSending(true);
    try {
      const response = await api.sendEventMessage(eventId, {
        message: inputText.trim(),
        replyToId: replyingTo?.id,
      });

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data as EventMessage]);
        setInputText('');
        setReplyingTo(null);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendAnnouncement = () => {
    if (!isHost) return;
    
    // TODO: Implement custom prompt dialog
    // Alert.prompt doesn't exist in React Native
    Alert.alert(
      'Send Announcement',
      'Feature coming soon - will allow sending announcements to all attendees'
    );
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteEventMessage(eventId, messageId);
              setMessages(prev => prev.filter(m => m.id !== messageId));
            } catch {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const renderMessage = ({ item }: { item: EventMessage }) => {
    const isOwnMessage = item.user_id === currentUserId;
    const isAnnouncement = item.message_type === 'announcement';
    const isSystem = item.message_type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.message}</Text>
        </View>
      );
    }

    if (isAnnouncement) {
      return (
        <View style={styles.announcement}>
          <Ionicons name="megaphone" size={16} color="#F59E0B" />
          <View style={styles.announcementContent}>
            <Text style={styles.announcementTitle}>Announcement from Host</Text>
            <Text style={styles.announcementText}>{item.message}</Text>
            <Text style={styles.announcementTime}>{formatMessageTime(item.created_at)}</Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        onLongPress={() => {
          if (isOwnMessage || isHost) {
            Alert.alert(
              'Message Options',
              '',
              [
                { text: 'Reply', onPress: () => setReplyingTo(item) },
                ...(isOwnMessage ? [
                  { text: 'Delete', style: 'destructive' as const, onPress: () => deleteMessage(item.id) }
                ] : []),
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        }}
        activeOpacity={0.7}
      >
        {!isOwnMessage && (
          <Image
            source={{
              uri: item.user.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${  item.user.name}`,
            }}
            style={styles.avatar}
          />
        )}
        
        <View style={[styles.messageBubble, isOwnMessage && styles.ownBubble]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.user.name}</Text>
          )}
          
          {item.reply_to && (
            <View style={styles.replyContainer}>
              <View style={styles.replyBar} />
              <View>
                <Text style={styles.replyName}>{item.reply_to.user.name}</Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {item.reply_to.message}
                </Text>
              </View>
            </View>
          )}
          
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.message}
          </Text>
          
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatMessageTime(item.created_at)}
            {item.edited && ' • Edited'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Event Chat</Text>
            <Text style={styles.headerSubtitle}>{eventTitle}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Event Chat</Text>
          <Text style={styles.headerSubtitle}>{eventTitle}</Text>
        </View>
        {isHost ? (
          <TouchableOpacity onPress={sendAnnouncement}>
            <Ionicons name="megaphone-outline" size={24} color="#F59E0B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {replyingTo && (
        <View style={styles.replyingToContainer}>
          <View style={styles.replyingToContent}>
            <View style={styles.replyingToBar} />
            <View style={styles.replyingToText}>
              <Text style={styles.replyingToLabel}>Replying to {replyingTo.user.name}</Text>
              <Text style={styles.replyingToMessage} numberOfLines={1}>
                {replyingTo.message}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray['50'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
  },
  headerSubtitle: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: scaleHeight(16),
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    marginRight: scaleWidth(8),
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary.main,
  },
  senderName: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.primary.main,
    marginBottom: scaleHeight(4),
  },
  messageText: {
    fontSize: scaleFont(15),
    color: theme.colors.gray['900'],
    lineHeight: scaleFont(20),
  },
  ownMessageText: {
    color: theme.colors.white,
  },
  messageTime: {
    fontSize: scaleFont(11),
    color: theme.colors.gray['400'],
    marginTop: scaleHeight(4),
  },
  ownMessageTime: {
    color: theme.colors.overlay.white80,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: scaleHeight(8),
    padding: scaleWidth(8),
    backgroundColor: theme.colors.gray['100'],
    borderRadius: scaleWidth(8),
  },
  replyBar: {
    width: scaleWidth(3),
    backgroundColor: theme.colors.primary.main,
    marginRight: scaleWidth(8),
    borderRadius: scaleWidth(2),
  },
  replyName: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  replyText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: scaleHeight(16),
  },
  systemText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    fontStyle: 'italic',
    backgroundColor: theme.colors.gray['100'],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  announcement: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.yellowLight,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: theme.colors.ui.yellowBorder,
  },
  announcementContent: {
    flex: 1,
    marginLeft: scaleWidth(8),
  },
  announcementTitle: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: theme.colors.ui.yellowDark,
  },
  announcementText: {
    fontSize: scaleFont(14),
    color: theme.colors.ui.yellowDarker,
    marginTop: scaleHeight(4),
  },
  announcementTime: {
    fontSize: scaleFont(11),
    color: theme.colors.ui.yellowDark,
    marginTop: scaleHeight(4),
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  replyingToContent: {
    flex: 1,
    flexDirection: 'row',
  },
  replyingToBar: {
    width: scaleWidth(3),
    backgroundColor: theme.colors.primary.main,
    marginRight: scaleWidth(12),
    borderRadius: scaleWidth(2),
  },
  replyingToText: {
    flex: 1,
  },
  replyingToLabel: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  replyingToMessage: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray['300'],
    borderRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    marginRight: scaleWidth(12),
    maxHeight: scaleHeight(100),
    fontSize: scaleFont(15),
    color: theme.colors.gray['900'],
  },
  sendButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray['300'],
  },
});

export default EventChatScreen;