import { theme } from "@/theme";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import EnhancedPostCard, { PostData } from '../../components/feed/EnhancedPostCard';
import PostCardSkeleton from '../../components/feed/PostCardSkeleton';
import feedApi from '../../services/feedApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '@/store/notificationStore';

interface ReactionData {
  id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface FeedActivity {
  id: string;
  actor: string;
  verb: string;
  object: string;
  time: string;
  content?: string;
  image_url?: string;
  user_data?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content?: string;
    users?: {
      name: string;
      avatar_url?: string;
    };
  };
  reaction_counts?: {
    like?: number;
    love?: number;
    fire?: number;
    yum?: number;
    clap?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: ReactionData[];
    love?: ReactionData[];
    fire?: ReactionData[];
    yum?: ReactionData[];
    clap?: ReactionData[];
  };
  user_reaction_type?: 'like' | 'love' | 'fire' | 'yum' | 'clap';
  first_comment?: {
    id: string;
    user: {
      username: string;
      name: string;
    };
    text: string;
    created_at: string;
  };
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const { unreadCount, loadNotifications } = useNotificationStore();
  
  const scrollY = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const loadFeed = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }
      
      console.log('Starting to load feed...');
      let data = await feedApi.getTimeline(20, 0);
      console.log('Feed data received:', data);
      
      // If no data from API, use mock data for demo
      if (data.length === 0) {
        console.log('No feed data from API, using mock data');
        data = [
          {
            id: 'mock-1',
            actor: 'user-1',
            verb: 'post',
            object: 'post-1',
            time: new Date().toISOString(),
            content: '🍕 Just discovered the most amazing pizza place in Palo Alto! The truffle mushroom pizza is to die for. Who wants to join me there next week?',
            image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
            user_data: {
              id: 'user-1',
              name: 'Sarah Chen',
              avatar_url: 'https://i.pravatar.cc/150?img=1'
            },
            reaction_counts: {
              like: 12,
              love: 3,
              fire: 5,
              yum: 8,
              comment: 4
            },
            own_reactions: {},
            first_comment: {
              id: 'comment-1',
              user: {
                username: 'alexkim',
                name: 'Alex Kim'
              },
              text: 'Count me in! I love truffle anything 😍',
              created_at: new Date().toISOString()
            }
          },
          {
            id: 'mock-2',
            actor: 'user-2',
            verb: 'post',
            object: 'post-2',
            time: new Date(Date.now() - 3600000).toISOString(),
            content: 'Looking for dinner buddies tonight! Thinking of trying that new Korean BBQ place on University Ave. 6:30pm, max 4 people. Who\'s interested? 🥩🔥',
            user_data: {
              id: 'user-2',
              name: 'Marcus Johnson',
              avatar_url: 'https://i.pravatar.cc/150?img=3'
            },
            reaction_counts: {
              like: 8,
              fire: 4,
              clap: 2,
              comment: 6
            },
            own_reactions: {}
          },
          {
            id: 'mock-3',
            actor: 'user-3',
            verb: 'post',
            object: 'post-3',
            time: new Date(Date.now() - 7200000).toISOString(),
            content: 'Pro tip: The Stanford Shopping Center farmers market on Sunday mornings has the best organic strawberries! Perfect for weekend brunch prep 🍓',
            image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800',
            user_data: {
              id: 'user-3',
              name: 'Emily Rodriguez',
              avatar_url: 'https://i.pravatar.cc/150?img=5'
            },
            reaction_counts: {
              like: 15,
              love: 6,
              yum: 3,
              comment: 2
            },
            own_reactions: {}
          }
        ];
      }
      
      setActivities(data);
      setHasMore(data.length === 20);
    } catch (error: unknown) {
      console.error('Error loading feed:', error);
      const err = error as any; // Type assertion for error handling
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const data = await feedApi.getTimeline(20, activities.length);
      
      if (data.length > 0) {
        setActivities(prev => [...prev, ...data]);
        setHasMore(data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [activities.length, hasMore, loadingMore]);

  useEffect(() => {
    loadFeed();
    loadNotifications();
    // Load saved posts
    AsyncStorage.getItem('saved_posts').then(saved => {
      if (saved) {
        setSavedPosts(new Set(JSON.parse(saved)));
      }
    }).catch(console.error);
  }, [loadFeed]);
  
  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeed(true);
    });
    return unsubscribe;
  }, [navigation, loadFeed]);

  const handleReaction = useCallback(async (activityId: string, reactionType: string) => {
    try {
      const validReactions = ['like', 'love', 'fire', 'yum', 'clap'] as const;
      const reaction = reactionType as typeof validReactions[number];
      
      // Optimistic update for all reaction types
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityId) {
          const currentReaction = activity.user_reaction_type;
          const isRemoving = currentReaction === reaction;
          
          // Update reaction counts
          const newCounts = { ...activity.reaction_counts };
          
          // Remove old reaction count if switching reactions
          if (currentReaction && currentReaction !== reaction) {
            newCounts[currentReaction] = (newCounts[currentReaction] || 1) - 1;
          }
          
          // Update new reaction count
          if (isRemoving) {
            newCounts[reaction] = (newCounts[reaction] || 1) - 1;
          } else {
            newCounts[reaction] = (newCounts[reaction] || 0) + 1;
          }
          
          // Update own reactions
          const newOwnReactions = { ...activity.own_reactions };
          
          // Clear all reactions first if switching
          if (currentReaction && currentReaction !== reaction) {
            validReactions.forEach(r => {
              newOwnReactions[r] = [];
            });
          }
          
          // Set the new reaction
          if (isRemoving) {
            newOwnReactions[reaction] = [];
          } else {
            newOwnReactions[reaction] = [{
              id: 'temp',
              user_id: 'current-user', // TODO: Get from auth
              reaction_type: reaction,
              created_at: new Date().toISOString(),
            }];
          }
          
          return {
            ...activity,
            reaction_counts: newCounts,
            own_reactions: newOwnReactions,
            user_reaction_type: isRemoving ? undefined : reaction,
          };
        }
        return activity;
      }));
      
      // Make API call - for now using like/unlike API
      // In production, you'd have specific endpoints for each reaction type
      const activity = activities.find(a => a.id === activityId);
      const hasReaction = activity?.user_reaction_type;
      
      if (hasReaction === reaction) {
        // Remove reaction
        await feedApi.unlikePost(activityId);
      } else {
        // Add/change reaction
        await feedApi.likePost(activityId);
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
      // Revert optimistic update on error
      loadFeed();
    }
  }, [activities]);

  const handleComment = useCallback((activityId: string) => {
    // Navigate to comment screen
    navigation.navigate('Comments', {
      postId: activityId,
      postAuthor: 'Author', // Get from activity data
    });
  }, [navigation]);

  const handleShare = useCallback(async (activityId: string) => {
    try {
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Get post details
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return;

      // Create share message
      const shareMessage = `Check out this delicious post on SharedTable! 🍽️\n\n${activity.content || 'Amazing food experience!'}\n\n#SharedTable #Foodie`;

      // Share using native share
      if (Platform.OS === 'ios') {
        // iOS share
        Alert.alert(
          '📤 Share Post',
          shareMessage,
          [
            { text: 'Copy Link', onPress: () => {
              // TODO: Copy deep link to clipboard
              Alert.alert('Success', 'Link copied! 📋');
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // Android share
        Alert.alert('Share', shareMessage);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [activities]);

  const handleSave = useCallback(async (activityId: string) => {
    try {
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Toggle save state
      setSavedPosts(prev => {
        const newSaved = new Set(prev);
        if (newSaved.has(activityId)) {
          newSaved.delete(activityId);
          // Save to AsyncStorage
          AsyncStorage.setItem('saved_posts', JSON.stringify(Array.from(newSaved))).catch(console.error);
          return newSaved;
        } else {
          newSaved.add(activityId);
          // Save to AsyncStorage
          AsyncStorage.setItem('saved_posts', JSON.stringify(Array.from(newSaved))).catch(console.error);
          return newSaved;
        }
      });

      // TODO: When backend is ready, save to API
      // TODO: await feedApi.savePost(activityId);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  }, []);

  const handleCreatePost = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    fabScale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    navigation.navigate('CreatePost');
  }, [navigation, fabScale]);

  const handleNotificationPress = useCallback(() => {
    navigation.navigate('NotificationsList');
  }, [navigation]);

  // Load first comment and count for posts
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Load first comment and count for each activity
    activities.forEach(async (activity) => {
      try {
        const storedComments = await AsyncStorage.getItem(`comments_${activity.id}`);
        if (storedComments) {
          const comments = JSON.parse(storedComments);
          if (comments.length > 0) {
            setPostComments(prev => ({
              ...prev,
              [activity.id]: comments[0]
            }));
            setCommentCounts(prev => ({
              ...prev,
              [activity.id]: comments.length
            }));
          }
        }
      } catch (error) {
        console.log('Error loading comment preview:', error);
      }
    });
  }, [activities]);
  
  // Refresh comment data when returning from comments screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload comment data when screen comes back into focus
      activities.forEach(async (activity) => {
        try {
          const storedComments = await AsyncStorage.getItem(`comments_${activity.id}`);
          if (storedComments) {
            const comments = JSON.parse(storedComments);
            setPostComments(prev => ({
              ...prev,
              [activity.id]: comments.length > 0 ? comments[0] : null
            }));
            setCommentCounts(prev => ({
              ...prev,
              [activity.id]: comments.length
            }));
          }
        } catch (error) {
          console.log('Error reloading comment preview:', error);
        }
      });
    });
    return unsubscribe;
  }, [navigation, activities]);

  const renderItem = useCallback(({ item }: { item: FeedActivity }) => {
    // Determine user's current reaction type
    let userReaction: 'like' | 'love' | 'fire' | 'yum' | 'clap' | undefined = undefined;
    
    if (item.user_reaction_type) {
      userReaction = item.user_reaction_type;
    } else {
      // Fallback to checking individual reactions for backward compatibility
      if (item.own_reactions?.like && item.own_reactions.like.length > 0) userReaction = 'like';
      else if (item.own_reactions?.love && item.own_reactions.love.length > 0) userReaction = 'love';
      else if (item.own_reactions?.fire && item.own_reactions.fire.length > 0) userReaction = 'fire';
      else if (item.own_reactions?.yum && item.own_reactions.yum.length > 0) userReaction = 'yum';
      else if (item.own_reactions?.clap && item.own_reactions.clap.length > 0) userReaction = 'clap';
    }
    
    // Convert FeedActivity to PostData format
    const postData: PostData = {
      id: item.id,
      type: 'text',
      author: {
        id: item.actor,
        name: item.post?.users?.name || 'Anonymous',
        username: item.post?.users?.name?.toLowerCase().replace(/\s/g, '') || 'anonymous',
        avatar_url: item.user_data?.avatar_url,
        verified: false,
      },
      content: item.content,
      media: item.image_url ? [{
        type: 'image',
        url: item.image_url,
      }] : undefined,
      reactions: {
        like: item.reaction_counts?.like || 0,
        love: item.reaction_counts?.love || 0,
        fire: item.reaction_counts?.fire || 0,
        yum: item.reaction_counts?.yum || 0,
        clap: item.reaction_counts?.clap || 0,
      },
      user_reaction: userReaction,
      comments_count: commentCounts[item.id] || item.reaction_counts?.comment || 0,
      first_comment: postComments[item.id]?.[0] ? {
        id: postComments[item.id][0].id,
        user: {
          username: postComments[item.id][0].user?.name || 'Unknown',
          name: postComments[item.id][0].user?.name || 'Unknown',
        },
        text: postComments[item.id][0].text,
        created_at: postComments[item.id][0].created_at,
      } : item.first_comment,
      shares_count: 0,
      saves_count: 0,
      is_saved: savedPosts.has(item.id),
      created_at: item.time,
    };

    return (
      <EnhancedPostCard
        post={postData}
        onLike={(reaction) => handleReaction(item.id, reaction)}
        onComment={() => handleComment(item.id)}
        onShare={() => handleShare(item.id)}
        onSave={() => handleSave(item.id)}
        onProfile={(userId) => console.log('Profile:', userId)}
      />
    );
  }, [handleReaction, handleComment, handleShare, handleSave, postComments, commentCounts, savedPosts]);

  const keyExtractor = useCallback((item: FeedActivity) => item.id, []);

  const ListEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View>
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🍕🍔🍣</Text>
        <Text style={styles.emptyText}>No foodie posts yet</Text>
        <Text style={styles.emptySubtext}>Share your culinary adventures! 🌮</Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.emptyButtonText}>📸 Share Your First Dish</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, navigation]);

  const ListFooterComponent = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [loadingMore]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, 100],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      scrollY.value,
      [0, 50],
      [0, 0.1],
      Extrapolate.CLAMP
    ),
    borderBottomWidth: interpolate(
      scrollY.value,
      [0, 50],
      [0, StyleSheet.hairlineWidth],
      Extrapolate.CLAMP
    ),
  }));

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🍽️ SharedTable</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#262626" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={24} color="#262626" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
      <FlashList
        data={loading ? [] : activities}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            tintColor="#007AFF"
            colors={['#007AFF']}
            progressBackgroundColor="white"
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      <AnimatedTouchableOpacity
        style={[styles.fab, fabAnimatedStyle]}
        onPress={handleCreatePost}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabEmoji}>🍳</Text>
        </LinearGradient>
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray['50'],
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: theme.colors.ui.borderLight,
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.ui.darkGray,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.ios.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.ui.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.ios.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabEmoji: {
    fontSize: 28,
  },
});

export default FeedScreen;