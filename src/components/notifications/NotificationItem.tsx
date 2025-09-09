import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { NotificationData, NotificationType } from '@/types/notification.types';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { safeFormatDate } from '@/utils/dateHelpers';

interface NotificationItemProps {
  notification: NotificationData;
  onPress: (notification: NotificationData) => void;
  onDelete?: (notificationId: string) => void;
}

export const NotificationItem = memo<NotificationItemProps>(({
  notification,
  onPress,
  onDelete,
}) => {
  // Format date safely
  const formatDate = () => {
    return safeFormatDate(
      notification.createdAt,
      (date) => formatDistanceToNow(date, { addSuffix: true }),
      'Recently'
    );
  };
  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.DINNER_REMINDER:
      case NotificationType.DINNER_CONFIRMATION:
        return 'restaurant';
      case NotificationType.DINNER_CANCELLATION:
        return 'close-circle';
      case NotificationType.DINNER_STATUS_CHANGE:
      case NotificationType.DINNER_WAITLIST_UPDATE:
        return 'time';
      case NotificationType.CHAT_MESSAGE:
      case NotificationType.CHAT_MENTION:
        return 'chatbubble';
      case NotificationType.CHAT_ANNOUNCEMENT:
        return 'megaphone';
      case NotificationType.FEED_POST:
      case NotificationType.FEED_COMMENT:
        return 'newspaper';
      case NotificationType.FEED_MENTION:
        return 'at';
      case NotificationType.FEED_REACTION:
        return 'heart';
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.BOOKING_APPROVED:
      case NotificationType.BOOKING_REJECTED:
        return 'calendar';
      case NotificationType.PAYMENT_UPDATE:
        return 'card';
      case NotificationType.SYSTEM_UPDATE:
      case NotificationType.PROFILE_UPDATE:
      default:
        return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case NotificationType.DINNER_CANCELLATION:
      case NotificationType.BOOKING_REJECTED:
        return theme.colors.error.main;
      case NotificationType.DINNER_CONFIRMATION:
      case NotificationType.BOOKING_APPROVED:
        return theme.colors.success.main;
      case NotificationType.CHAT_MENTION:
      case NotificationType.FEED_MENTION:
      case NotificationType.CHAT_ANNOUNCEMENT:
        return theme.colors.primary.main;
      default:
        return theme.colors.text.secondary;
    }
  };

  const handlePress = () => {
    onPress(notification);
  };

  const handleDelete = () => {
    onDelete?.(notification.id);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        !notification.read && styles.unread,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIcon() as React.ComponentProps<typeof Ionicons>['name']}
          size={24}
          color={getIconColor()}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !notification.read && styles.unreadText]}>
            {notification.title}
          </Text>
          <Text style={styles.time}>
            {formatDate()}
          </Text>
        </View>

        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>

        {notification.imageUrl && (
          <Image
            source={{ uri: notification.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      </View>

      {onDelete && (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
        </Pressable>
      )}
    </Pressable>
  );
});

NotificationItem.displayName = 'NotificationItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray['100'],
    minHeight: scaleHeight(80),
  },
  unread: {
    backgroundColor: theme.colors.primary['50'],
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.gray['100'],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  title: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: scaleWidth(8),
  },
  unreadText: {
    fontWeight: '600',
  },
  time: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  body: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(20),
  },
  image: {
    width: '100%',
    height: scaleHeight(120),
    borderRadius: scaleWidth(8),
    marginTop: scaleHeight(8),
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: scaleWidth(12),
  },
});