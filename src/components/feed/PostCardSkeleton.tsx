import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

import { Colors } from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const PostCardSkeleton: React.FC = () => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-screenWidth, screenWidth]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarSkeleton}>
            <Animated.View style={[styles.shimmer, animatedStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
          <View>
            <View style={styles.userNameSkeleton}>
              <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
            <View style={styles.timeSkeleton}>
              <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </View>

      {/* Image Skeleton */}
      <View style={styles.imageSkeleton}>
        <Animated.View style={[styles.shimmer, animatedStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* Actions Skeleton */}
      <View style={styles.actions}>
        <View style={styles.actionButtonsSkeleton}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.actionSkeleton}>
              <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
          ))}
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.contentContainer}>
        <View style={styles.contentLine}>
          <Animated.View style={[styles.shimmer, animatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>
        <View style={[styles.contentLine, styles.shortLine]}>
          <Animated.View style={[styles.shimmer, animatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

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
  avatarSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    marginRight: 12,
    overflow: 'hidden',
  },
  userNameSkeleton: {
    width: 100,
    height: 12,
    backgroundColor: Colors.gray200,
    borderRadius: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  timeSkeleton: {
    width: 60,
    height: 10,
    backgroundColor: Colors.gray200,
    borderRadius: 5,
    overflow: 'hidden',
  },
  imageSkeleton: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  actions: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonsSkeleton: {
    flexDirection: 'row',
  },
  actionSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    marginRight: 16,
    overflow: 'hidden',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  contentLine: {
    width: '100%',
    height: 12,
    backgroundColor: Colors.gray200,
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  shortLine: {
    width: '60%',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PostCardSkeleton;