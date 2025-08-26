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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useAuthStore } from '@/store/authStore';
import feedApi from '@/services/feedApi';
// import { streamService } from '@/services/streamService'; // Commented out - not used yet

type RouteParams = {
  Comments: {
    postId: string;
    postAuthor: string;
  };
};

interface Comment {
  id: string;
  post_id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    verified?: boolean;
  };
  text: string;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
  replying_to?: string;
  created_at: string;
}

const CommentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'Comments'>>();
  const _insets = useSafeAreaInsets();
  const { postId } = route.params;
  const { privyUser: user } = useAuthStore();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const inputHeight = useSharedValue(44);

  useEffect(() => {
    loadComments();
    // TODO: Set up real-time subscription
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Try to load from API when endpoint is available
      // For now, we'll use local storage as a temporary solution
      try {
        // Try to load from API first
        const commentsData = await feedApi.getPostComments(postId);
        if (commentsData && commentsData.length > 0) {
          // Map API comments to local Comment format
          const mappedComments: Comment[] = commentsData.map(c => ({
            id: c.id,
            post_id: c.post_id,
            user: {
              id: c.user?.id || 'unknown',
              name: c.user?.name || 'Anonymous',
              username: c.user?.name?.toLowerCase().replace(/\s/g, '') || 'anonymous',
              avatar_url: c.user?.avatar_url,
              verified: false,
            },
            text: c.text,
            likes_count: 0,
            is_liked: false,
            created_at: c.created_at,
          }));
          setComments(mappedComments);
          // Also save to local storage for offline support
          await AsyncStorage.setItem(`comments_${postId}`, JSON.stringify(mappedComments));
        } else {
          // If no API data, load from local storage
          const storedComments = await AsyncStorage.getItem(`comments_${postId}`);
          if (storedComments) {
            setComments(JSON.parse(storedComments));
          } else {
            setComments([]);
          }
        }
      } catch {
        // Comments API not available, using local storage only
        const storedComments = await AsyncStorage.getItem(`comments_${postId}`);
        if (storedComments) {
          setComments(JSON.parse(storedComments));
        } else {
          setComments([]);
        }
      }
    } catch (_error) {
      console.error('Error loading comments:', _error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!user) {
      Alert.alert('Error', 'Please sign in to comment');
      return;
    }
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSending(true);
    try {
      // Optimistically add the comment
      const tempId = `temp-${Date.now()}`;
      const newComment: Comment = {
        id: tempId,
        post_id: postId,
        user: {
          id: user.id,
          name: user.name || 'Anonymous',
          username: user.name?.toLowerCase().replace(/\s/g, '') || 'user',
          avatar_url: user.avatar,
        },
        text: inputText.trim(),
        likes_count: 0,
        is_liked: false,
        replying_to: replyingTo?.user.username,
        created_at: new Date().toISOString(),
      };

      // Add optimistically
      setComments(prev => {
        const newComments = [...prev, newComment];
        // Save to local storage
        AsyncStorage.setItem(`comments_${postId}`, JSON.stringify(newComments)).catch(console.error);
        return newComments;
      });
      setInputText('');
      setReplyingTo(null);
      
      // Try to send to API when available
      try {
        const response = await feedApi.commentOnPost(postId, inputText.trim());
        if (response.success && response.data) {
          // Replace temp comment with real one from server
          setComments(prev => prev.map(c => 
            c.id === tempId ? {
              ...newComment,
              id: response.data?.id || tempId,
            } : c
          ));
        }
      } catch {
        // Comment posted locally, will sync when API is available
        console.log('Comment saved locally, will sync when online');
      }
      
      // Scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (_error) {
      console.error('Error posting comment:', _error);
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => !c.id.startsWith('temp-')));
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Optimistic update
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          is_liked: !comment.is_liked,
          likes_count: comment.is_liked 
            ? comment.likes_count - 1 
            : comment.likes_count + 1,
        };
      }
      return comment;
    }));

    // TODO: Send like to API
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Remove from local state and storage
            setComments(prev => {
              const newComments = prev.filter(c => c.id !== commentId);
              // Save to local storage
              AsyncStorage.setItem(`comments_${postId}`, JSON.stringify(newComments)).catch(console.error);
              return newComments;
            });
            
            // TODO: When API is ready, also delete from backend
            await feedApi.deleteComment(commentId);
          },
        },
      ]
    );
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(300)}
        style={styles.commentContainer}
      >
        <TouchableOpacity style={styles.commentHeader}>
          {item.user.avatar_url ? (
            <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary.main, theme.colors.primary.light]}
              style={[styles.avatar, styles.avatarPlaceholder]}
            >
              <Text style={styles.avatarText}>
                {item.user.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.commentContent}>
            <View style={styles.commentMeta}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.user.username}</Text>
                {item.user.verified && (
                  <Ionicons name="checkmark-circle" size={12} color="#007AFF" />
                )}
              </View>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
            {item.replying_to && (
              <Text style={styles.replyingTo}>@{item.replying_to}</Text>
            )}
            <Text style={styles.commentText}>{item.text}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleLikeComment(item.id)}
              >
                <Ionicons
                  name={item.is_liked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={item.is_liked ? '#FF3B30' : '#8E8E93'}
                />
                {item.likes_count > 0 && (
                  <Text style={[styles.actionText, item.is_liked && styles.likedText]}>
                    {item.likes_count}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleReply(item)}
              >
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
              {item.user.id === user?.id && (
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={() => handleDeleteComment(item.id)}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
  }));

  if (loading) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <SafeAreaView style={styles.safeContainer} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <SafeAreaView style={styles.safeContainer} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <FlatList
        ref={listRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No comments yet 💬</Text>
            <Text style={styles.emptySubtext}>Be the first to share your thoughts! 🍴</Text>
          </View>
        }
      />

      {replyingTo && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={styles.replyingBar}
        >
          <Text style={styles.replyingText}>
            Replying to @{replyingTo.user.username}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.inputContainer}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
        ) : (
          <LinearGradient
            colors={[theme.colors.primary.main, theme.colors.primary.light]}
            style={styles.inputAvatar}
          >
            <Text style={styles.inputAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
        )}
        <Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyingTo ? `Reply to @${replyingTo.user.username}...` : 'Add a comment...'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending}
            onContentSizeChange={(e) => {
              const height = Math.min(Math.max(44, e.nativeEvent.contentSize.height), 120);
              inputHeight.value = withSpring(height, { damping: 15 });
            }}
          />
        </Animated.View>
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeContainer: {
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: scaleHeight(16),
    paddingBottom: scaleHeight(80), // Add extra padding to ensure last comment is visible
    flexGrow: 1,
  },
  commentContainer: {
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(20),
  },
  commentHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    marginRight: scaleWidth(12),
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  username: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#111827',
  },
  timeAgo: {
    fontSize: scaleFont(12),
    color: '#8E8E93',
  },
  replyingTo: {
    fontSize: scaleFont(13),
    color: theme.colors.primary.main,
    marginBottom: scaleHeight(2),
  },
  commentText: {
    fontSize: scaleFont(14),
    color: '#374151',
    lineHeight: scaleFont(18),
  },
  commentActions: {
    flexDirection: 'row',
    gap: scaleWidth(16),
    marginTop: scaleHeight(8),
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  actionText: {
    fontSize: scaleFont(13),
    color: '#8E8E93',
  },
  likedText: {
    color: '#FF3B30',
  },
  deleteText: {
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(100),
  },
  emptyText: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
    marginTop: scaleHeight(16),
  },
  emptySubtext: {
    fontSize: scaleFont(14),
    color: '#8E8E93',
    marginTop: scaleHeight(4),
  },
  replyingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyingText: {
    fontSize: scaleFont(13),
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  inputAvatar: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
    marginBottom: scaleHeight(6),
  },
  inputAvatarText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(16),
    marginRight: scaleWidth(12),
    justifyContent: 'center',
  },
  input: {
    fontSize: scaleFont(14),
    color: '#111827',
    maxHeight: scaleHeight(120),
    paddingVertical: scaleHeight(10),
  },
  sendButton: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default CommentsScreen;