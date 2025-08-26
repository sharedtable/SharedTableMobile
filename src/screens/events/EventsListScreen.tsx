import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isTomorrow, isThisWeek } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface DiningEvent {
  id: string;
  host_id: string;
  host_name: string;
  host_avatar?: string;
  title: string;
  description: string;
  cuisine_type: string;
  restaurant_name: string;
  address: string;
  city: string;
  event_date: string;
  start_time: string;
  max_guests: number;
  current_guests: number;
  price_per_person: number;
  cover_image_url?: string;
  dietary_accommodations: string[];
  status: 'published' | 'full' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
}

const EventsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState<DiningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'my'>('all');

  // Mock data for demonstration
  const mockEvents: DiningEvent[] = [
    {
      id: '1',
      host_id: 'host1',
      host_name: 'Sarah Chen',
      host_avatar: 'https://i.pravatar.cc/150?img=1',
      title: 'Authentic Sichuan Dinner',
      description: 'Join us for a spicy adventure through Sichuan cuisine',
      cuisine_type: 'Chinese',
      restaurant_name: 'Chengdu Taste',
      address: '828 W Valley Blvd',
      city: 'Alhambra',
      event_date: new Date().toISOString(),
      start_time: '19:00',
      max_guests: 6,
      current_guests: 4,
      price_per_person: 35,
      cover_image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246',
      dietary_accommodations: ['vegetarian-friendly'],
      status: 'published',
      tags: ['spicy', 'authentic', 'group-dining'],
    },
    {
      id: '2',
      host_id: 'host2',
      host_name: 'Michael Park',
      title: 'Korean BBQ Night',
      description: 'All-you-can-eat KBBQ with great company',
      cuisine_type: 'Korean',
      restaurant_name: 'Quarters Korean BBQ',
      address: '3465 W 6th St',
      city: 'Los Angeles',
      event_date: new Date(Date.now() + 86400000).toISOString(),
      start_time: '18:30',
      max_guests: 8,
      current_guests: 3,
      price_per_person: 45,
      dietary_accommodations: [],
      status: 'published',
      tags: ['bbq', 'social', 'all-you-can-eat'],
    },
    {
      id: '3',
      host_id: 'host3',
      host_name: 'Emma Wilson',
      title: 'Brunch & Mimosas',
      description: 'Sunday brunch with bottomless mimosas',
      cuisine_type: 'American',
      restaurant_name: 'The Ivy',
      address: '113 N Robertson Blvd',
      city: 'Beverly Hills',
      event_date: new Date(Date.now() + 172800000).toISOString(),
      start_time: '11:00',
      max_guests: 4,
      current_guests: 4,
      price_per_person: 55,
      dietary_accommodations: ['gluten-free-options'],
      status: 'full',
      tags: ['brunch', 'drinks', 'weekend'],
    },
  ];

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvents(mockEvents);
    } catch {
      // Error loading events - fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: DiningEvent) => {
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate('CreateEvent');
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    // if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getSpotsLeftColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return '#DC2626'; // full
    if (percentage >= 75) return '#F59E0B'; // almost full
    return '#10B981'; // plenty of space
  };

  const renderEventCard = (event: DiningEvent) => {
    const spotsLeft = event.max_guests - event.current_guests;
    const isFull = spotsLeft === 0;
    
    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.9}
      >
        <View style={styles.eventHeader}>
          <View style={styles.hostInfo}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostInitial}>
                {event.host_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.hostName}>{event.host_name}</Text>
              <Text style={styles.hostLabel}>Host</Text>
            </View>
          </View>
          <View style={styles.dateTag}>
            <Text style={styles.dateTagText}>{getDateLabel(event.event_date)}</Text>
            <Text style={styles.timeText}>{event.start_time}</Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="restaurant" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{event.restaurant_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{event.city}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="pricetag" size={14} color="#6B7280" />
              <Text style={styles.detailText}>${event.price_per_person}/person</Text>
            </View>
          </View>

          {event.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {event.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.spotsContainer}>
            <View 
              style={[
                styles.spotsIndicator,
                { backgroundColor: getSpotsLeftColor(event.current_guests, event.max_guests) }
              ]}
            />
            <Text style={[
              styles.spotsText,
              isFull && styles.spotsTextFull
            ]}>
              {isFull ? 'Full' : `${spotsLeft} spots left`}
            </Text>
          </View>
          <View style={styles.attendeesContainer}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.attendeesText}>
              {event.current_guests}/{event.max_guests}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dining Events</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('EventsMap')}>
          <Ionicons name="map" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All Events', icon: 'calendar' },
          { key: 'today', label: 'Today', icon: 'today' },
          { key: 'week', label: 'This Week', icon: 'calendar-outline' },
          { key: 'my', label: 'My Events', icon: 'person' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterChip,
              filter === item.key && styles.filterChipActive
            ]}
            onPress={() => setFilter(item.key as any)}
          >
            <Ionicons 
              name={item.icon as any} 
              size={16} 
              color={filter === item.key ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.filterText,
              filter === item.key && styles.filterTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.eventsContainer}
        contentContainerStyle={styles.eventsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyText}>
              Be the first to host a dining experience!
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateEvent}>
              <Text style={styles.createFirstText}>Host an Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map(renderEventCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEvent}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#E24849', '#F5A5A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: '#111827',
  },
  filterContainer: {
    backgroundColor: 'white',
    maxHeight: scaleHeight(60),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(10),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F3F4F6',
    marginRight: scaleWidth(8),
    gap: scaleWidth(6),
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  eventsContainer: {
    flex: 1,
  },
  eventsContent: {
    padding: scaleWidth(20),
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: scaleWidth(16),
    marginBottom: scaleHeight(16),
    padding: scaleWidth(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  hostAvatar: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostInitial: {
    color: 'white',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  hostName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#111827',
  },
  hostLabel: {
    fontSize: scaleFont(11),
    color: '#6B7280',
  },
  dateTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
  },
  dateTagText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#92400E',
  },
  timeText: {
    fontSize: scaleFont(11),
    color: '#92400E',
  },
  eventContent: {
    marginBottom: scaleHeight(12),
  },
  eventTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: scaleHeight(6),
  },
  eventDescription: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(12),
  },
  eventDetails: {
    gap: scaleHeight(6),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  detailText: {
    fontSize: scaleFont(13),
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(6),
    marginTop: scaleHeight(10),
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  tagText: {
    fontSize: scaleFont(11),
    color: '#3B82F6',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  spotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  spotsIndicator: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
  spotsText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#111827',
  },
  spotsTextFull: {
    color: '#DC2626',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  attendeesText: {
    fontSize: scaleFont(13),
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(100),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(80),
  },
  emptyTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
    marginTop: scaleHeight(16),
  },
  emptyText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(24),
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(24),
  },
  createFirstText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: scaleHeight(90),
    right: scaleWidth(20),
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(28),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EventsListScreen;