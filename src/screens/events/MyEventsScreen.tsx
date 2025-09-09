import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isFuture } from 'date-fns';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface MyEvent {
  id: string;
  title: string;
  restaurant_name: string;
  address: string;
  event_date: string;
  start_time: string;
  host_name: string;
  host_avatar?: string;
  attendees_count: number;
  max_guests: number;
  price_per_person: number;
  status: 'confirmed' | 'pending' | 'waitlisted' | 'cancelled' | 'completed';
  role: 'host' | 'attendee';
  cover_image_url?: string;
  rating?: number; // For completed events
  needs_review?: boolean; // For completed events
}

const MyEventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'hosting' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const mockEvents: MyEvent[] = [
    {
      id: '1',
      title: 'Authentic Sichuan Dinner',
      restaurant_name: 'Chengdu Taste',
      address: '828 W Valley Blvd, Alhambra',
      event_date: new Date(Date.now() + 86400000).toISOString(),
      start_time: '19:00',
      host_name: 'Sarah Chen',
      attendees_count: 5,
      max_guests: 6,
      price_per_person: 35,
      status: 'confirmed',
      role: 'attendee',
    },
    {
      id: '2',
      title: 'Korean BBQ Night',
      restaurant_name: 'Quarters Korean BBQ',
      address: '3465 W 6th St, Los Angeles',
      event_date: new Date(Date.now() + 172800000).toISOString(),
      start_time: '18:30',
      host_name: 'You',
      attendees_count: 3,
      max_guests: 8,
      price_per_person: 45,
      status: 'confirmed',
      role: 'host',
    },
    {
      id: '3',
      title: 'Sushi Omakase Experience',
      restaurant_name: 'Sushi Gen',
      address: '422 E 2nd St, Los Angeles',
      event_date: new Date(Date.now() - 604800000).toISOString(),
      start_time: '20:00',
      host_name: 'Ken Yamamoto',
      attendees_count: 4,
      max_guests: 4,
      price_per_person: 120,
      status: 'completed',
      role: 'attendee',
      needs_review: true,
    },
  ];

  const upcomingEvents = mockEvents.filter(
    e => e.role === 'attendee' && isFuture(new Date(e.event_date)) && e.status !== 'cancelled'
  );
  
  const hostingEvents = mockEvents.filter(
    e => e.role === 'host' && isFuture(new Date(e.event_date))
  );
  
  const pastEvents = mockEvents.filter(
    e => isPast(new Date(e.event_date)) || e.status === 'completed'
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refresh events from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleEventPress = (event: MyEvent) => {
    if (event.status === 'completed' && event.needs_review) {
      Alert.alert(
        'Rate Your Experience',
        `How was "${event.title}"?`,
        [
          { text: 'Review Later', style: 'cancel' },
          {
            text: 'Write Review',
            onPress: () => (navigation as any).navigate('EventReview', { eventId: event.id }),
          },
        ]
      );
    } else {
      (navigation as any).navigate('EventDetails', { eventId: event.id });
    }
  };

  const handleCancelBooking = (event: MyEvent) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your spot for "${event.title}"?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            // TODO: Cancel booking API call
            Alert.alert('Booking Cancelled', 'Your spot has been released.');
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Confirmed', color: theme.colors.success['500'] };
      case 'pending':
        return { text: 'Pending', color: theme.colors.ui.yellowOrange };
      case 'waitlisted':
        return { text: 'Waitlisted', color: theme.colors.gray['500'] };
      case 'cancelled':
        return { text: 'Cancelled', color: theme.colors.error['500'] };
      case 'completed':
        return { text: 'Completed', color: theme.colors.ui.blueLight };
      default:
        return { text: status, color: theme.colors.gray['500'] };
    }
  };

  const renderEventCard = (event: MyEvent) => {
    const statusBadge = getStatusBadge(event.status);
    const eventDate = new Date(event.event_date);
    
    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.9}
      >
        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{format(eventDate, 'MMM').toUpperCase()}</Text>
          <Text style={styles.dateDay}>{format(eventDate, 'd')}</Text>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}>
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{event.start_time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="restaurant-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.restaurant_name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {event.attendees_count}/{event.max_guests} attending
              </Text>
            </View>
          </View>

          {/* Host/Action Row */}
          <View style={styles.eventFooter}>
            {event.role === 'host' ? (
              <View style={styles.hostBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.hostText}>You&apos;re hosting</Text>
              </View>
            ) : (
              <View style={styles.hostInfo}>
                <Text style={styles.hostLabel}>Hosted by {event.host_name}</Text>
              </View>
            )}

            {event.status === 'confirmed' && isFuture(eventDate) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (event.role === 'host') {
                    (navigation as any).navigate('ManageEvent', { eventId: event.id });
                  } else {
                    handleCancelBooking(event);
                  }
                }}
              >
                <Text style={styles.actionButtonText}>
                  {event.role === 'host' ? 'Manage' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            )}

            {event.needs_review && (
              <TouchableOpacity style={styles.reviewButton}>
                <Ionicons name="star-outline" size={16} color={theme.colors.primary.main} />
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'upcoming' ? 'calendar-outline' : type === 'hosting' ? 'restaurant-outline' : 'time-outline'} 
        size={64} 
        color="#D1D5DB" 
      />
      <Text style={styles.emptyTitle}>
        {type === 'upcoming' 
          ? 'No upcoming events' 
          : type === 'hosting'
          ? 'Not hosting any events'
          : 'No past events'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'upcoming'
          ? 'Browse and book dining experiences'
          : type === 'hosting'
          ? 'Create your first dining event'
          : 'Your past events will appear here'}
      </Text>
      {(type === 'upcoming' || type === 'hosting') && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => (navigation as any).navigate(type === 'hosting' ? 'CreateEvent' : 'Events')}
        >
          <Text style={styles.emptyButtonText}>
            {type === 'hosting' ? 'Host an Event' : 'Browse Events'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getTabEvents = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingEvents;
      case 'hosting':
        return hostingEvents;
      case 'past':
        return pastEvents;
      default:
        return [];
    }
  };

  const tabEvents = getTabEvents();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('EventsCalendar')}>
          <Ionicons name="calendar" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'upcoming', label: 'Upcoming', count: upcomingEvents.length },
          { key: 'hosting', label: 'Hosting', count: hostingEvents.length },
          { key: 'past', label: 'Past', count: pastEvents.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {tabEvents.length > 0 ? (
          tabEvents.map(renderEventCard)
        ) : (
          renderEmptyState(activeTab)
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: theme.colors.gray['900'],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleHeight(14),
    gap: scaleWidth(6),
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.transparent,
  },
  tabActive: {
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.gray['500'],
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: theme.colors.gray['100'],
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(10),
    minWidth: scaleWidth(20),
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary.light,
  },
  tabBadgeText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: theme.colors.gray['500'],
  },
  tabBadgeTextActive: {
    color: theme.colors.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleWidth(20),
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(12),
    padding: scaleWidth(16),
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateBadge: {
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: scaleWidth(8),
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  dateMonth: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  dateDay: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  eventInfo: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  eventTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.gray['900'],
    flex: 1,
    marginRight: scaleWidth(8),
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  statusText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  eventDetails: {
    gap: scaleHeight(4),
    marginBottom: scaleHeight(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  detailText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    flex: 1,
  },
  hostText: {
    fontSize: scaleFont(12),
    color: theme.colors.ui.yellowOrange,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(6),
    backgroundColor: theme.colors.error['100'],
  },
  actionButtonText: {
    fontSize: scaleFont(12),
    color: theme.colors.error['600'],
    fontWeight: '500',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(6),
    backgroundColor: theme.colors.primary.light,
  },
  reviewButtonText: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(80),
  },
  emptyTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
    marginTop: scaleHeight(16),
  },
  emptyText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(8),
    textAlign: 'center',
    paddingHorizontal: scaleWidth(40),
  },
  emptyButton: {
    marginTop: scaleHeight(24),
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(24),
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
});

export default MyEventsScreen;