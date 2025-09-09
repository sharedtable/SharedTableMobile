import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface ReactionData {
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface PostCardProps {
  activity: {
    id: string;
    content?: string;
    image_url?: string;
    time: string;
    post?: {
      users?: {
        name: string;
        avatar_url?: string;
      };
    };
    reaction_counts?: {
      like?: number;
      comment?: number;
    };
    own_reactions?: {
      like?: ReactionData[];
    };
  };
  onLike: () => void;
  onComment: () => void;
}

const PostCard = memo<PostCardProps>(({ activity, onLike, onComment }) => {
  const likeScale = useSharedValue(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);
  
  const isLiked = activity.own_reactions?.like && activity.own_reactions.like.length > 0;
  const likeCount = activity.reaction_counts?.like || 0;
  const commentCount = activity.reaction_counts?.comment || 0;
  
  const userName = activity.post?.users?.name || 'Anonymous';
  const userAvatar = activity.post?.users?.avatar_url;
  const timeAgo = formatDistanceToNow(new Date(activity.time), { addSuffix: true });

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleLike = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    likeScale.value = withSequence(
      withSpring(0.8, { damping: 2, stiffness: 200 }),
      withSpring(1.2, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 2, stiffness: 200 })
    );
    
    onLike();
  }, [onLike, likeScale]);

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      handleLike();
    }
  }, [isLiked, handleLike]);

  const handleImagePress = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      handleDoubleTap();
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(400).springify()}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatar, styles.avatarPlaceholder]}
            >
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.userText}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Image */}
      {activity.image_url && (
        <Pressable onPress={handleImagePress}>
          <View style={styles.imageContainer}>
            {!imageError && (
              <Image
                source={{ uri: activity.image_url }}
                style={styles.postImage}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(e) => {
                  console.error('Image loading error:', e.nativeEvent.error);
                  setImageLoading(false);
                  setImageError(true);
                }}
                resizeMode="cover"
              />
            )}
            {imageLoading && !imageError && (
              <View style={[styles.postImage, styles.imagePlaceholder]}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}
            {imageError && (
              <View style={[styles.postImage, styles.errorContainer]}>
                <Ionicons name="image-outline" size={48} color="#ccc" />
                <Text style={styles.errorText}>Failed to load image</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.7}>
            <Animated.View style={likeAnimatedStyle}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isLiked ? '#FF3B30' : '#666666'}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={24} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      {likeCount > 0 && (
        <Text style={styles.likesCount}>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Content */}
      {activity.content && (
        <View style={styles.contentContainer}>
          <Text style={styles.content}>
            <Text style={styles.contentUser}>{userName} </Text>
            {activity.content}
          </Text>
        </View>
      )}

      {/* Comments Count */}
      {commentCount > 0 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>
            View all {commentCount} comments
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginBottom: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userText: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: Colors.gray50,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 12,
  },
  likesCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  contentContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  content: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  contentUser: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

PostCard.displayName = 'PostCard';

export default PostCard;