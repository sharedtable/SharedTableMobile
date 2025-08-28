import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationData, NotificationType } from '@/types/notification.types';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

export const NotificationsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = useCallback((notification: NotificationData) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data;
    switch (notification.type) {
      case NotificationType.DINNER_REMINDER:
      case NotificationType.DINNER_CONFIRMATION:
      case NotificationType.DINNER_CANCELLATION:
      case NotificationType.DINNER_STATUS_CHANGE:
        if (data?.eventId) {
          navigation.navigate('EventDetails', { eventId: data.eventId });
        }
        break;
      case NotificationType.CHAT_MESSAGE:
      case NotificationType.CHAT_MENTION:
        if (data?.eventId) {
          navigation.navigate('EventChat', { eventId: data.eventId });
        }
        break;
      case NotificationType.FEED_POST:
      case NotificationType.FEED_MENTION:
      case NotificationType.FEED_REACTION:
      case NotificationType.FEED_COMMENT:
        navigation.navigate('Feed');
        break;
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.BOOKING_APPROVED:
      case NotificationType.BOOKING_REJECTED:
        navigation.navigate('Bookings');
        break;
    }
  }, [markAsRead, navigation]);

  const handleMarkAllAsRead = useCallback(() => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: markAllAsRead },
      ]
    );
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  }, [clearAll]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderNotification = useCallback(({ item }: { item: NotificationData }) => {
    return (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        onDelete={deleteNotification}
      />
    );
  }, [handleNotificationPress, deleteNotification]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={theme.colors.text.secondary}
        />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  const renderHeader = () => {
    return (
      <>
        {/* Main Title Header */}
        <View style={[styles.titleHeader, { paddingTop: insets.top + scaleHeight(12) }]}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.titleText}>Notifications</Text>
          <View style={styles.titleSpacer} />
        </View>
        
        {/* Notification Actions Header */}
        {notifications.length > 0 && (
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All notifications'}
            </Text>
            <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable
              style={styles.headerButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons
                name="checkmark-done"
                size={20}
                color={theme.colors.primary.main}
              />
              <Text style={styles.headerButtonText}>Mark All</Text>
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.error.main}
              />
              <Text style={[styles.headerButtonText, { color: theme.colors.error.main }]}>
                Clear
              </Text>
            </Pressable>
            )}
          </View>
        </View>
      )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(16),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: scaleWidth(8),
    marginRight: scaleWidth(8),
  },
  titleText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  titleSpacer: {
    width: scaleWidth(40), // Balance the back button width
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleWidth(16),
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  headerButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(40),
    paddingVertical: scaleHeight(100),
  },
  emptyIcon: {
    marginBottom: scaleHeight(24),
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(24),
  },
});