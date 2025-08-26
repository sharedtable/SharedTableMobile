import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface EventDetails {
  id: string;
  host_id: string;
  host: {
    name: string;
    avatar?: string;
    bio?: string;
    events_hosted: number;
    rating: number;
  };
  title: string;
  description: string;
  cuisine_type: string;
  dining_style: string;
  restaurant_name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  event_date: string;
  start_time: string;
  end_time?: string;
  min_guests: number;
  max_guests: number;
  current_guests: number;
  price_per_person: number;
  price_includes?: string;
  payment_method: string;
  dietary_accommodations: string[];
  age_restriction?: string;
  dress_code?: string;
  languages_spoken: string[];
  cover_image_url?: string;
  gallery_urls?: string[];
  tags: string[];
  attendees: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  my_status?: 'not_joined' | 'pending' | 'confirmed' | 'waitlisted';
}

const EventDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params as { eventId: string };
  
  const [_loading, _setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Mock event details
  const event: EventDetails = {
    id: eventId,
    host_id: 'host1',
    host: {
      name: 'Sarah Chen',
      bio: 'Food enthusiast and Sichuan cuisine expert. Love bringing people together over authentic Chinese food!',
      events_hosted: 24,
      rating: 4.8,
    },
    title: 'Authentic Sichuan Dinner',
    description: 'Join us for an unforgettable journey through the bold and spicy flavors of Sichuan cuisine! We\'ll be exploring authentic dishes including mapo tofu, twice-cooked pork, and the famous Sichuan fish. Perfect for spice lovers and those curious about real Chinese regional cuisine.',
    cuisine_type: 'Chinese',
    dining_style: 'Group Dining',
    restaurant_name: 'Chengdu Taste',
    address: '828 W Valley Blvd, Alhambra, CA 91801',
    city: 'Alhambra',
    lat: 34.0925,
    lng: -118.1270,
    event_date: new Date().toISOString(),
    start_time: '19:00',
    end_time: '21:30',
    min_guests: 4,
    max_guests: 6,
    current_guests: 4,
    price_per_person: 35,
    price_includes: 'Family-style shared dishes, tea',
    payment_method: 'Split bill at restaurant',
    dietary_accommodations: ['Vegetarian options available', 'Can adjust spice level'],
    age_restriction: '18+',
    dress_code: 'Casual',
    languages_spoken: ['English', 'Mandarin'],
    cover_image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246',
    tags: ['spicy', 'authentic', 'group-dining', 'foodie'],
    attendees: [
      { id: '1', name: 'Michael P.', avatar: 'https://i.pravatar.cc/150?img=3' },
      { id: '2', name: 'Jessica L.', avatar: 'https://i.pravatar.cc/150?img=5' },
      { id: '3', name: 'David W.', avatar: 'https://i.pravatar.cc/150?img=8' },
      { id: '4', name: 'Amy K.', avatar: 'https://i.pravatar.cc/150?img=9' },
    ],
    my_status: 'not_joined',
  };

  const spotsLeft = event.max_guests - event.current_guests;
  const isFull = spotsLeft === 0;
  const isHost = false; // TODO: Check if current user is host

  const handleBook = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setBooking(true);
    try {
      // TODO: Implement actual booking API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Booking Confirmed!',
        'You\'ve successfully joined this dining event. The host will be notified.',
        [
          {
            text: 'View My Events',
            onPress: () => (navigation as any).navigate('MyEvents'),
          },
          { text: 'OK', style: 'default' },
        ]
      );
    } catch {
      Alert.alert('Booking Failed', 'Unable to book this event. Please try again.');
    } finally {
      setBooking(false);
    }
  }, [navigation]);

  const handleJoinWaitlist = useCallback(async () => {
    Alert.alert(
      'Join Waitlist',
      'You\'ll be notified if a spot opens up for this event.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            // TODO: Implement waitlist API
            Alert.alert('Added to Waitlist', 'We\'ll notify you if a spot becomes available.');
          },
        },
      ]
    );
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Join me for "${event.title}" on ${format(new Date(event.event_date), 'MMM d')} at ${event.start_time}!\n\nCheck it out on SharedTable!`,
        url: `https://sharedtable.app/events/${event.id}`,
      });
    } catch {
      // Sharing cancelled or failed silently
    }
  }, [event]);

  const handleOpenMaps = useCallback(() => {
    const address = encodeURIComponent(event.address);
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });
    
    if (url) {
      Linking.openURL(url);
    }
  }, [event.address]);

  const handleMessageHost = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleViewHost = useCallback(() => {
    (navigation as any).navigate('UserProfile', { userId: event.host_id });
  }, [navigation, event.host_id]);

  const renderAttendee = (attendee: any, index: number) => (
    <TouchableOpacity key={attendee.id} style={styles.attendeeItem}>
      <View style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -10 : 0 }]}>
        {attendee.avatar ? (
          <Image source={{ uri: attendee.avatar }} style={styles.attendeeImage} />
        ) : (
          <View style={styles.attendeePlaceholder}>
            <Text style={styles.attendeeInitial}>
              {attendee.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Image */}
        {event.cover_image_url && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: event.cover_image_url }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
            />
            <View style={styles.imageHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Title and Status */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isFull ? '🔴 Full' : `🟢 ${spotsLeft} spots left`}
              </Text>
            </View>
          </View>

          {/* Host Info */}
          <TouchableOpacity style={styles.hostCard} onPress={handleViewHost}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostInitial}>
                {event.host.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{event.host.name}</Text>
              <View style={styles.hostStats}>
                <Text style={styles.hostStat}>
                  <Ionicons name="star" size={12} color="#F59E0B" /> {event.host.rating}
                </Text>
                <Text style={styles.hostStat}>• {event.host.events_hosted} events</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Key Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary.main} />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {format(new Date(event.event_date), 'EEE, MMM d')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color={theme.colors.primary.main} />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {event.start_time} - {event.end_time || '?'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color={theme.colors.primary.main} />
              <Text style={styles.detailLabel}>Group Size</Text>
              <Text style={styles.detailValue}>
                {event.current_guests}/{event.max_guests} people
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={20} color={theme.colors.primary.main} />
              <Text style={styles.detailLabel}>Cost</Text>
              <Text style={styles.detailValue}>${event.price_per_person}/person</Text>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locationCard} onPress={handleOpenMaps}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color={theme.colors.primary.main} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.restaurantName}>{event.restaurant_name}</Text>
              <Text style={styles.address}>{event.address}</Text>
            </View>
            <Ionicons name="navigate" size={20} color="#3B82F6" />
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Event Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Cuisine</Text>
                <Text style={styles.detailRowValue}>{event.cuisine_type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Dining Style</Text>
                <Text style={styles.detailRowValue}>{event.dining_style}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Price Includes</Text>
                <Text style={styles.detailRowValue}>{event.price_includes}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Payment</Text>
                <Text style={styles.detailRowValue}>{event.payment_method}</Text>
              </View>
              {event.dress_code && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Dress Code</Text>
                  <Text style={styles.detailRowValue}>{event.dress_code}</Text>
                </View>
              )}
              {event.age_restriction && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Age</Text>
                  <Text style={styles.detailRowValue}>{event.age_restriction}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Dietary & Languages */}
          {(event.dietary_accommodations.length > 0 || event.languages_spoken.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Good to Know</Text>
              {event.dietary_accommodations.length > 0 && (
                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Dietary Options</Text>
                  <View style={styles.tagsList}>
                    {event.dietary_accommodations.map((item, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {event.languages_spoken.length > 0 && (
                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Languages</Text>
                  <View style={styles.tagsList}>
                    {event.languages_spoken.map((lang, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Attendees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who's Going</Text>
            <View style={styles.attendeesList}>
              {event.attendees.map((attendee, index) => renderAttendee(attendee, index))}
              {spotsLeft > 0 && (
                <View style={styles.emptySpots}>
                  <Text style={styles.emptySpotsText}>+{spotsLeft}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags */}
          {event.tags.length > 0 && (
            <View style={styles.section}>
              <View style={styles.tagsList}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.hashTag}>
                    <Text style={styles.hashTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>${event.price_per_person}</Text>
        </View>
        
        {isHost ? (
          <TouchableOpacity style={styles.manageButton}>
            <Text style={styles.manageButtonText}>Manage Event</Text>
          </TouchableOpacity>
        ) : event.my_status === 'confirmed' ? (
          <View style={styles.confirmedContainer}>
            <Text style={styles.confirmedText}>✓ You're going!</Text>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : isFull ? (
          <TouchableOpacity 
            style={styles.waitlistButton}
            onPress={handleJoinWaitlist}
          >
            <Text style={styles.waitlistButtonText}>Join Waitlist</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={handleBook}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.bookButtonText}>Book Spot</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.messageButton} onPress={handleMessageHost}>
          <Ionicons name="chatbubble-outline" size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(100),
  },
  imageContainer: {
    height: scaleHeight(250),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scaleHeight(100),
  },
  imageHeader: {
    position: 'absolute',
    top: scaleHeight(20),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
  },
  backButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: scaleWidth(20),
  },
  titleSection: {
    marginBottom: scaleHeight(16),
  },
  title: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: '#111827',
    marginBottom: scaleHeight(8),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(12),
  },
  statusText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: scaleWidth(12),
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(20),
  },
  hostAvatar: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  hostInitial: {
    color: 'white',
    fontSize: scaleFont(20),
    fontWeight: '600',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#111827',
  },
  hostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(2),
  },
  hostStat: {
    fontSize: scaleFont(12),
    color: '#6B7280',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: scaleHeight(20),
    gap: scaleWidth(15),
  },
  detailItem: {
    width: (scaleWidth(335) - scaleWidth(15)) / 2,
    backgroundColor: '#F9FAFB',
    padding: scaleWidth(12),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: scaleFont(11),
    color: '#6B7280',
    marginTop: scaleHeight(4),
  },
  detailValue: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#111827',
    marginTop: scaleHeight(2),
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: scaleWidth(16),
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(20),
  },
  locationIcon: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  locationInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#111827',
  },
  address: {
    fontSize: scaleFont(13),
    color: '#6B7280',
    marginTop: scaleHeight(2),
  },
  section: {
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: scaleHeight(12),
  },
  description: {
    fontSize: scaleFont(14),
    color: '#4B5563',
    lineHeight: scaleFont(22),
  },
  detailsList: {
    gap: scaleHeight(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRowLabel: {
    fontSize: scaleFont(14),
    color: '#6B7280',
  },
  detailRowValue: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    marginLeft: scaleWidth(20),
  },
  infoGroup: {
    marginBottom: scaleHeight(16),
  },
  infoLabel: {
    fontSize: scaleFont(13),
    color: '#6B7280',
    marginBottom: scaleHeight(8),
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
  },
  tagText: {
    fontSize: scaleFont(12),
    color: '#4B5563',
  },
  hashTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
  },
  hashTagText: {
    fontSize: scaleFont(12),
    color: '#3B82F6',
  },
  attendeesList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeItem: {
    position: 'relative',
  },
  attendeeAvatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    borderWidth: 2,
    borderColor: 'white',
  },
  attendeeImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(20),
  },
  attendeePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(20),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeInitial: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySpots: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleWidth(8),
    borderWidth: 2,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  emptySpotsText: {
    fontSize: scaleFont(12),
    color: '#9CA3AF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    paddingBottom: scaleHeight(30),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  priceContainer: {
    marginRight: scaleWidth(16),
  },
  priceLabel: {
    fontSize: scaleFont(11),
    color: '#6B7280',
  },
  priceValue: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#111827',
  },
  bookButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  waitlistButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  waitlistButtonText: {
    color: 'white',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  manageButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  manageButtonText: {
    color: 'white',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  confirmedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmedText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#10B981',
  },
  cancelButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
  },
  cancelButtonText: {
    fontSize: scaleFont(14),
    color: '#DC2626',
    fontWeight: '600',
  },
  messageButton: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleWidth(12),
  },
});

export default EventDetailsScreen;