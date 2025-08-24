import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  StatusBar,
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
import PostCard from '../../components/feed/PostCard';
import PostCardSkeleton from '../../components/feed/PostCardSkeleton';
import feedApi from '../../services/feedApi';

interface FeedActivity {
  id: string;
  actor: string;
  verb: string;
  object: string;
  time: string;
  content?: string;
  image_url?: string;
  user_data?: any;
  post?: any;
  reaction_counts?: {
    like?: number;
    comment?: number;
  };
  own_reactions?: {
    like?: any[];
  };
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const scrollY = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const loadFeed = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }
      
      console.log('Starting to load feed...');
      const data = await feedApi.getTimeline(20, 0);
      console.log('Feed data received:', data);
      setActivities(data);
      setHasMore(data.length === 20);
    } catch (error: any) {
      console.error('Error loading feed:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
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
  }, [loadFeed]);
  
  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeed(true);
    });
    return unsubscribe;
  }, [navigation, loadFeed]);

  const handleLike = useCallback(async (activityId: string) => {
    try {
      // Optimistic update
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityId) {
          const isLiked = activity.own_reactions?.like && activity.own_reactions.like.length > 0;
          return {
            ...activity,
            reaction_counts: {
              ...activity.reaction_counts,
              like: (activity.reaction_counts?.like || 0) + (isLiked ? -1 : 1),
            },
            own_reactions: {
              ...activity.own_reactions,
              like: isLiked ? [] : [{ id: 'temp' }],
            },
          };
        }
        return activity;
      }));
      
      // Make API call
      const activity = activities.find(a => a.id === activityId);
      const isLiked = activity?.own_reactions?.like && activity.own_reactions.like.length > 0;
      
      if (isLiked) {
        await feedApi.unlikePost(activityId);
      } else {
        await feedApi.likePost(activityId);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      loadFeed();
    }
  }, [activities]);

  const handleComment = useCallback((activityId: string) => {
    // Navigate to comment screen or show comment modal
    console.log('Comment on:', activityId);
  }, []);

  const handleCreatePost = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    fabScale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    (navigation as any).navigate('CreatePost');
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: FeedActivity }) => {
    return (
      <PostCard
        activity={item}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
      />
    );
  }, [handleLike, handleComment]);

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
        <Ionicons name="camera-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Follow some foodies to see their posts!</Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => (navigation as any).navigate('CreatePost')}
        >
          <Text style={styles.emptyButtonText}>Create your first post</Text>
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

  const handleScroll = useCallback((event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <Animated.View style={[styles.header, { paddingTop: insets.top }, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>SharedTable</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color="#262626" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color="#262626" />
              <View style={styles.notificationDot} />
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
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: '#E1E1E1',
    shadowColor: '#000',
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
    color: '#262626',
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: 'white',
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
    shadowColor: '#000',
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
});

export default FeedScreen;