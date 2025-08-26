import React, { memo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';

import { theme } from '@/theme';
import { Colors } from '@/constants/colors';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface PostData {
  id: string;
  type: 'text' | 'image' | 'video' | 'recipe' | 'event' | 'poll' | 'restaurant_review';
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    verified?: boolean;
    badge?: 'foodie' | 'chef' | 'critic';
  };
  content?: string;
  media?: PostMedia[];
  location?: {
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  tags?: string[];
  mentions?: { id: string; username: string }[];
  recipe?: {
    title: string;
    prep_time: string;
    cook_time: string;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: string[];
    steps: string[];
  };
  event?: {
    title: string;
    date: string;
    time: string;
    location: string;
    spots_available: number;
    price?: number;
  };
  poll?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: number;
      voters?: string[];
    }[];
    ends_at: string;
    total_votes: number;
  };
  restaurant_review?: {
    name: string;
    rating: number;
    cuisine: string;
    price_range: '$' | '$$' | '$$$' | '$$$$';
    recommended_dishes?: string[];
  };
  reactions: {
    like: number;
    love: number;
    fire: number;
    yum: number;
    clap: number;
  };
  user_reaction?: 'like' | 'love' | 'fire' | 'yum' | 'clap';
  comments_count: number;
  first_comment?: {
    id: string;
    user: {
      username: string;
      name: string;
    };
    text: string;
    created_at: string;
  };
  shares_count: number;
  saves_count: number;
  is_saved?: boolean;
  created_at: string;
  updated_at?: string;
}

interface EnhancedPostCardProps {
  post: PostData;
  onLike: (reaction: string) => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onProfile: (userId: string) => void;
  onImagePress?: (images: PostMedia[], index: number) => void;
}

const REACTIONS = [
  { type: 'like', icon: 'heart' as const, color: '#FF3B30', emoji: '❤️' },
  { type: 'love', icon: 'heart-circle' as const, color: '#FF2D55', emoji: '😍' },
  { type: 'fire', icon: 'flame' as const, color: '#FF9500', emoji: '🔥' },
  { type: 'yum', icon: 'happy' as const, color: '#FFCC00', emoji: '😋' },
  { type: 'clap', icon: 'hand-right' as const, color: '#5856D6', emoji: '👏' },
];

const EnhancedPostCard = memo<EnhancedPostCardProps>(({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onProfile,
  onImagePress,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  
  const likeScale = useSharedValue(1);
  const reactionScale = useSharedValue(0);
  const videoRef = useRef<Video>(null);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const totalReactions = Object.values(post.reactions).reduce((sum, count) => sum + count, 0);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const reactionContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reactionScale.value }],
    opacity: reactionScale.value,
  }));

  const handleReaction = useCallback((reaction: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    likeScale.value = withSequence(
      withSpring(0.8, { damping: 2, stiffness: 200 }),
      withSpring(1.2, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 2, stiffness: 200 })
    );
    
    onLike(reaction);
    setShowReactions(false);
  }, [onLike, likeScale]);

  const handleLongPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowReactions(true);
    reactionScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [reactionScale]);

  const handleShare = useCallback(async () => {
    try {
      const message = `Check out this post by @${post.author.username} on SharedTable!`;
      const url = `https://sharedtable.app/post/${post.id}`;
      
      await Share.share({
        message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
      });
      
      onShare();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [post, onShare]);

  const handleVote = useCallback((optionId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setVotedOption(optionId);
    // TODO: Send vote to backend
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => onProfile(post.author.id)}
        activeOpacity={0.7}
      >
        {post.author.avatar_url ? (
          <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[theme.colors.primary.main, theme.colors.primary.light]}
            style={[styles.avatar, styles.avatarPlaceholder]}
          >
            <Text style={styles.avatarText}>
              {post.author.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        <View style={styles.userText}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{post.author.name}</Text>
            {post.author.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#007AFF" />
            )}
            {post.author.badge && (
              <View style={[styles.badge, { backgroundColor: getBadgeColor(post.author.badge) }]}>
                <Text style={styles.badgeText}>{post.author.badge}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
            {post.location && (
              <>
                <Text style={styles.separator}>•</Text>
                <Ionicons name="location-sharp" size={12} color="#8E8E93" />
                <Text style={styles.location}>{post.location.name}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <View style={styles.mediaContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentMediaIndex(index);
          }}
        >
          {post.media.map((media, index) => (
            <Pressable
              key={index}
              onPress={() => post.media && onImagePress?.(post.media, index)}
              style={styles.mediaItem}
            >
              {media.type === 'image' ? (
                <Image
                  source={{ uri: media.url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : (
                <Video
                  ref={videoRef}
                  source={{ uri: media.url }}
                  style={styles.postImage}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  isMuted
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
        {post.media.length > 1 && (
          <View style={styles.mediaIndicator}>
            {post.media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.mediaDot,
                  index === currentMediaIndex && styles.mediaDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRecipe = () => {
    if (!post.recipe) return null;

    return (
      <View style={styles.recipeCard}>
        <LinearGradient
          colors={['#FFE5B4', '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recipeHeader}
        >
          <Ionicons name="restaurant" size={20} color="#8B4513" />
          <Text style={styles.recipeTitle}>{post.recipe.title}</Text>
        </LinearGradient>
        <View style={styles.recipeInfo}>
          <View style={styles.recipeInfoItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.recipeInfoText}>
              {post.recipe.prep_time} prep + {post.recipe.cook_time} cook
            </Text>
          </View>
          <View style={styles.recipeInfoItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.recipeInfoText}>{post.recipe.servings} servings</Text>
          </View>
          <View style={styles.recipeInfoItem}>
            <Ionicons name="speedometer-outline" size={16} color="#666" />
            <Text style={styles.recipeInfoText}>{post.recipe.difficulty}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewRecipeButton}>
          <Text style={styles.viewRecipeText}>View Full Recipe</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEvent = () => {
    if (!post.event) return null;

    return (
      <View style={styles.eventCard}>
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.eventGradient}
        >
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{post.event.title}</Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetail}>
                <Ionicons name="calendar" size={14} color="white" />
                <Text style={styles.eventDetailText}>{post.event.date}</Text>
              </View>
              <View style={styles.eventDetail}>
                <Ionicons name="time" size={14} color="white" />
                <Text style={styles.eventDetailText}>{post.event.time}</Text>
              </View>
              <View style={styles.eventDetail}>
                <Ionicons name="location" size={14} color="white" />
                <Text style={styles.eventDetailText}>{post.event.location}</Text>
              </View>
            </View>
            <View style={styles.eventFooter}>
              <Text style={styles.eventSpots}>
                {post.event.spots_available} spots left
              </Text>
              {post.event.price && (
                <Text style={styles.eventPrice}>${post.event.price}/person</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPoll = () => {
    if (!post.poll) return null;

    return (
      <View style={styles.pollCard}>
        <Text style={styles.pollQuestion}>{post.poll.question}</Text>
        {post.poll.options.map((option) => {
          const percentage = post.poll && post.poll.total_votes > 0 
            ? (option.votes / post.poll.total_votes) * 100 
            : 0;
          const isVoted = votedOption === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
              onPress={() => !votedOption && handleVote(option.id)}
              disabled={!!votedOption}
            >
              <View style={styles.pollOptionContent}>
                <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>
                  {option.text}
                </Text>
                {votedOption && (
                  <Text style={styles.pollPercentage}>{percentage.toFixed(0)}%</Text>
                )}
              </View>
              {votedOption && (
                <View style={[styles.pollBar, { width: `${percentage}%` }]} />
              )}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.pollFooter}>
          {post.poll.total_votes} votes • Ends {formatDistanceToNow(new Date(post.poll.ends_at), { addSuffix: true })}
        </Text>
      </View>
    );
  };

  const renderRestaurantReview = () => {
    if (!post.restaurant_review) return null;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewName}>{post.restaurant_review.name}</Text>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={post.restaurant_review && i < post.restaurant_review.rating ? 'star' : 'star-outline'}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewCuisine}>{post.restaurant_review.cuisine}</Text>
          <Text style={styles.reviewPrice}>{post.restaurant_review.price_range}</Text>
        </View>
        {post.restaurant_review.recommended_dishes && (
          <View style={styles.reviewDishes}>
            <Text style={styles.reviewDishesTitle}>Must Try:</Text>
            <Text style={styles.reviewDishesText}>
              {post.restaurant_review.recommended_dishes.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (!post.content) return null;

    const shouldTruncate = post.content.length > 150 && !showFullContent;
    const displayContent = shouldTruncate 
      ? `${post.content.substring(0, 150)  }...` 
      : post.content;

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.content}>
          <Text style={styles.contentUser}>{post.author.username} </Text>
          {displayContent}
        </Text>
        {shouldTruncate && (
          <TouchableOpacity onPress={() => setShowFullContent(true)}>
            <Text style={styles.readMore}>more</Text>
          </TouchableOpacity>
        )}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          onPress={() => handleReaction(post.user_reaction || 'like')}
          onLongPress={handleLongPress}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Animated.View style={likeAnimatedStyle}>
            <Ionicons
              name={post.user_reaction ? getReactionIcon(post.user_reaction) : 'heart-outline'}
              size={26}
              color={post.user_reaction ? getReactionColor(post.user_reaction) : '#262626'}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.actionButton} activeOpacity={0.7}>
          <View style={styles.actionButtonWithCount}>
            <Ionicons name="chatbubble-outline" size={24} color="#262626" />
            {post.comments_count > 0 && (
              <Text style={styles.actionCount}>{post.comments_count}</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSave} style={styles.actionButton} activeOpacity={0.7}>
        <Ionicons
          name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={post.is_saved ? '#262626' : '#262626'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.stats}>
      {totalReactions > 0 && (
        <Text style={styles.likesCount}>
          {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
        </Text>
      )}
      
      {/* Show first comment preview */}
      {post.first_comment && (
        <TouchableOpacity onPress={onComment} style={styles.commentPreview}>
          <Text style={styles.commentPreviewText}>
            <Text style={styles.commentPreviewUsername}>{post.first_comment.user.username}</Text>
            {' '}
            <Text style={styles.commentPreviewContent}>
              {post.first_comment.text.length > 100 
                ? `${post.first_comment.text.substring(0, 100)  }...` 
                : post.first_comment.text}
            </Text>
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Show view all comments if more than 1 */}
      {post.comments_count > 1 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>
            View all {post.comments_count} comments
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Show empty state for comments */}
      {post.comments_count === 0 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>Add a comment...</Text>
        </TouchableOpacity>
      )}
      
      {post.shares_count > 0 && (
        <Text style={styles.statText}>{post.shares_count} shares</Text>
      )}
    </View>
  );

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'chef': return '#FF6B6B';
      case 'foodie': return '#4ECDC4';
      case 'critic': return '#5856D6';
      default: return '#8E8E93';
    }
  };

  const getReactionIcon = (reaction: string) => {
    const found = REACTIONS.find(r => r.type === reaction);
    return found ? found.icon : 'heart';
  };

  const getReactionColor = (reaction: string) => {
    const found = REACTIONS.find(r => r.type === reaction);
    return found ? found.color : '#FF3B30';
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={styles.container}
      >
        {renderHeader()}
        {renderMedia()}
        {renderRecipe()}
        {renderEvent()}
        {renderPoll()}
        {renderRestaurantReview()}
        {renderContent()}
        {renderActions()}
        {renderStats()}
      </Animated.View>

      {/* Reaction Selector Modal */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => setShowReactions(false)}
        >
          <Animated.View style={[styles.reactionContainer, reactionContainerStyle]}>
            <BlurView intensity={95} tint="light" style={styles.reactionBlur}>
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.type}
                  style={styles.reactionButton}
                  onPress={() => handleReaction(reaction.type)}
                >
                  <Ionicons
                    name={reaction.icon as any}
                    size={32}
                    color={reaction.color}
                  />
                </TouchableOpacity>
              ))}
            </BlurView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
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
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    marginRight: scaleWidth(12),
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: scaleFont(16),
    fontWeight: 'bold',
  },
  userText: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  userName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(4),
  },
  badgeText: {
    fontSize: scaleFont(10),
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(2),
  },
  timeAgo: {
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
  },
  separator: {
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
    marginHorizontal: scaleWidth(4),
  },
  location: {
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
    marginLeft: scaleWidth(2),
  },
  moreButton: {
    padding: scaleWidth(4),
  },
  mediaContainer: {
    position: 'relative',
  },
  mediaItem: {
    width: screenWidth,
    height: screenWidth,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  mediaIndicator: {
    position: 'absolute',
    bottom: scaleHeight(12),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(4),
  },
  mediaDot: {
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
    backgroundColor: Colors.whiteOverlayMedium,
  },
  mediaDotActive: {
    backgroundColor: Colors.white,
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
  recipeCard: {
    margin: scaleWidth(12),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    backgroundColor: Colors.backgroundYellow,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(12),
    gap: scaleWidth(8),
  },
  recipeTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: scaleWidth(12),
  },
  recipeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  recipeInfoText: {
    fontSize: scaleFont(12),
    color: Colors.gray600,
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleWidth(12),
    borderTopWidth: 1,
    borderTopColor: Colors.borderYellow,
    gap: scaleWidth(4),
  },
  viewRecipeText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  eventCard: {
    margin: scaleWidth(12),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  eventGradient: {
    padding: scaleWidth(16),
  },
  eventContent: {
    gap: scaleHeight(8),
  },
  eventTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: Colors.white,
  },
  eventDetails: {
    gap: scaleHeight(6),
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  eventDetailText: {
    fontSize: scaleFont(13),
    color: Colors.whiteOverlayLight,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(8),
  },
  eventSpots: {
    fontSize: scaleFont(14),
    color: Colors.white,
    fontWeight: '600',
  },
  eventPrice: {
    fontSize: scaleFont(14),
    color: Colors.white,
    fontWeight: '700',
  },
  pollCard: {
    margin: scaleWidth(12),
    padding: scaleWidth(16),
    backgroundColor: Colors.backgroundGray,
    borderRadius: scaleWidth(12),
  },
  pollQuestion: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scaleHeight(12),
  },
  pollOption: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  pollOptionVoted: {
    borderColor: theme.colors.primary.main,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scaleWidth(12),
  },
  pollOptionText: {
    fontSize: scaleFont(14),
    color: Colors.textPrimary,
  },
  pollOptionTextVoted: {
    fontWeight: '600',
  },
  pollPercentage: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  pollBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: `${theme.colors.primary.main}20`,
  },
  pollFooter: {
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
    marginTop: scaleHeight(8),
  },
  reviewCard: {
    margin: scaleWidth(12),
    padding: scaleWidth(16),
    backgroundColor: Colors.gray100,
    borderRadius: scaleWidth(12),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  reviewName: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: scaleWidth(2),
  },
  reviewMeta: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  reviewCuisine: {
    fontSize: scaleFont(13),
    color: Colors.gray600,
  },
  reviewPrice: {
    fontSize: scaleFont(13),
    color: Colors.gray600,
    fontWeight: '600',
  },
  reviewDishes: {
    marginTop: scaleHeight(8),
    paddingTop: scaleHeight(8),
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  reviewDishesTitle: {
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
    marginBottom: scaleHeight(4),
  },
  reviewDishesText: {
    fontSize: scaleFont(13),
    color: Colors.textPrimary,
  },
  contentContainer: {
    paddingHorizontal: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  content: {
    fontSize: scaleFont(14),
    color: Colors.textPrimary,
    lineHeight: scaleFont(18),
  },
  contentUser: {
    fontWeight: '600',
  },
  readMore: {
    fontSize: scaleFont(14),
    color: Colors.textSecondary,
    marginTop: scaleHeight(2),
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(8),
    gap: scaleWidth(6),
  },
  tag: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    backgroundColor: Colors.gray200,
    borderRadius: scaleWidth(4),
  },
  tagText: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: scaleWidth(8),
    marginRight: scaleWidth(12),
  },
  actionButtonWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  actionCount: {
    fontSize: scaleFont(13),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  stats: {
    paddingHorizontal: scaleWidth(12),
    paddingBottom: scaleHeight(12),
  },
  likesCount: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scaleHeight(4),
  },
  viewComments: {
    fontSize: scaleFont(13),
    color: Colors.textSecondary,
  },
  commentPreview: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(4),
  },
  commentPreviewText: {
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
  },
  commentPreviewUsername: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  commentPreviewContent: {
    color: Colors.textPrimary,
  },
  statText: {
    fontSize: scaleFont(13),
    color: Colors.textSecondary,
  },
  reactionOverlay: {
    flex: 1,
    backgroundColor: Colors.blackOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionContainer: {
    borderRadius: scaleWidth(16),
    overflow: 'hidden',
  },
  reactionBlur: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    gap: scaleWidth(20),
  },
  reactionButton: {
    padding: scaleWidth(8),
  },
});

EnhancedPostCard.displayName = 'EnhancedPostCard';

export default EnhancedPostCard;