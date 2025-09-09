import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NotificationData } from '@/types/notification.types';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface InAppNotificationProps {
  notification: NotificationData | null;
  onPress?: () => void;
  onDismiss?: () => void;
  duration?: number;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onPress,
  onDismiss,
  duration = 5000,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  }, [onDismiss, translateY, opacity]);

  const show = useCallback(() => {
    setIsVisible(true);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (duration > 0) {
      dismissTimer.current = setTimeout(() => {
        hide();
      }, duration);
    }
  }, [duration, hide, translateY, opacity]);

  useEffect(() => {
    if (notification) {
      show();
    } else {
      hide();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [notification, show, hide]);

  const handlePress = () => {
    hide();
    onPress?.();
  };

  const handleDismiss = () => {
    hide();
  };

  if (!isVisible || !notification) {
    return null;
  }

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topOffset = insets.top || statusBarHeight;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset + scaleHeight(10),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.notification,
          pressed && styles.pressed,
        ]}
        onPress={handlePress}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="notifications"
                size={20}
                color={theme.colors.white}
              />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={theme.colors.white} />
            </Pressable>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: scaleWidth(16),
    right: scaleWidth(16),
    zIndex: 9999,
    elevation: 999,
  },
  notification: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black['1'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  iconContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: theme.colors.overlay.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(10),
  },
  title: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
  },
  closeButton: {
    marginLeft: scaleWidth(8),
  },
  body: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    color: theme.colors.overlay.whiteLight,
    lineHeight: scaleFont(20),
    marginLeft: scaleWidth(38),
  },
});