import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Pressable, 
  ScrollView,
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';
import { api } from '@/services/api';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface RestaurantItem {
  id: string;
  name: string;
  rating: number;
  image?: string;
}

interface BookingItem {
  id: string;
  status?: string;
  event_id?: string;
  event_date?: string;
  date?: string;
  event?: {
    id?: string;
    restaurant_name?: string;
    name?: string;
    title?: string;
    event_date?: string;
    date?: string;
    start_time?: string;
    time?: string;
    status?: string;
  };
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user } = usePrivyAuth();
  const [reservations, setReservations] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connections] = useState(0);

  const fetchReservations = async () => {
    try {
      const response = await api.getMyBookings();
      if (response.success && response.data) {
        console.log('Bookings data:', response.data); // Debug log
        
        // Filter upcoming bookings (not cancelled) and sort by date
        const upcoming = response.data
          .filter((booking: BookingItem) => {
            // Check various possible date fields
            const eventDate = booking.event?.event_date || 
                            booking.event?.date || 
                            booking.event_date || 
                            booking.date;
            
            return booking.status !== 'cancelled' && 
                   eventDate && 
                   new Date(eventDate) > new Date();
          })
          .sort((a: BookingItem, b: BookingItem) => {
            const aDate = a.event?.event_date || a.event?.date || a.event_date || a.date || '';
            const bDate = b.event?.event_date || b.event?.date || b.event_date || b.date || '';
            return new Date(aDate).getTime() - new Date(bDate).getTime();
          })
          .slice(0, 2); // Show only next 2 reservations
        
        setReservations(upcoming);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleCancelReservation = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      // Refresh the reservations list after cancellation
      fetchReservations();
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | undefined, timeString: string | undefined) => {
    if (!dateString || !timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date(dateString);
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Mock data for top rated restaurants
  const topRatedRestaurants: RestaurantItem[] = [
    { id: '1', name: 'Sotto Mare', rating: 4.8 },
    { id: '2', name: 'Sotto Mare', rating: 4.6 },
    { id: '3', name: 'Sotto Mare', rating: 4.5 },
    { id: '4', name: 'Sotto Mare', rating: 4.8 },
    { id: '5', name: 'Sotto Mare', rating: 4.9 },
  ];

  const userTier = 'Gourmand'; // TODO: Get from user metadata
  const dinnerCount = 45; // TODO: Get from user metadata

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerButtons}>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color={theme.colors.primary.main} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}</Text>
            <View style={styles.userStats}>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>Tier 4</Text>
              </View>
              <Text style={styles.tierName}>{userTier}</Text>
              <Text style={styles.statsText}>Dinners</Text>
              <Text style={styles.statsNumber}>{dinnerCount}</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Reservations</Text>
          </Pressable>
          <Pressable style={styles.tab}>
            <Text style={[styles.tabText, styles.connectionTabText]}>
              Connections
              {connections > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{connections}</Text>
                </View>
              )}
            </Text>
          </Pressable>
        </View>

        {/* Next Reservations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Reservation</Text>
            <Pressable>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : reservations.length > 0 ? (
            reservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationImage} />
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationName}>
                    {reservation.event?.restaurant_name || 
                     reservation.event?.name || 
                     reservation.event?.title || 
                     'Event'}
                  </Text>
                  <Text style={styles.reservationDate}>
                    {formatDate(reservation.event?.event_date || reservation.event?.date)} at {formatTime(reservation.event?.event_date || reservation.event?.date, reservation.event?.start_time || reservation.event?.time)}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={[
                      styles.statusText,
                      reservation.status === 'confirmed' && styles.statusConfirmed,
                      reservation.status === 'pending' && styles.statusPending,
                      reservation.status === 'cancelled' && styles.statusCancelled,
                    ]}>
                      {reservation.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <View style={styles.reservationActions}>
                  <Text style={styles.seeDetailsText}>See details</Text>
                  {reservation.status === 'confirmed' && (
                    <Pressable onPress={() => handleCancelReservation(reservation.id)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noReservationsText}>No upcoming reservations</Text>
          )}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={[styles.actionButton, styles.refineButton]}>
            <Text style={styles.refineButtonText}>Refine</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.grabButton]}>
            <Text style={styles.grabButtonText}>Grab a Spot</Text>
          </Pressable>
        </View>

        {/* Top Rated Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Restaurants</Text>
            <Pressable>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantList}
          >
            {topRatedRestaurants.map((restaurant) => (
              <Pressable key={restaurant.id} style={styles.restaurantCard}>
                <View style={styles.restaurantImage}>
                  <Ionicons name="restaurant" size={30} color={theme.colors.primary.main} />
                </View>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantRating}>★ {restaurant.rating}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: scaleHeight(20) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: scaleWidth(25),
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
  },
  activeTab: {
    borderBottomColor: theme.colors.primary.main,
    borderBottomWidth: 2,
  },
  activeTabText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  avatarContainer: {
    marginRight: scaleWidth(12),
  },
  badge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 10,
    marginLeft: 4,
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: scaleFont(10),
    fontWeight: '600',
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
  },
  connectionTabText: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  grabButton: {
    backgroundColor: theme.colors.primary.main,
  },
  grabButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
  },
  headerButtons: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(24),
    fontWeight: '700',
  },
  iconButton: {
    padding: scaleWidth(8),
  },
  noReservationsText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    paddingVertical: scaleHeight(20),
    textAlign: 'center',
  },
  refineButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderWidth: 1,
  },
  refineButtonText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  reservationActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  reservationCard: {
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: scaleHeight(12),
  },
  reservationDate: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
  },
  reservationImage: {
    backgroundColor: theme.colors.gray['2'],
    borderRadius: scaleWidth(8),
    height: scaleWidth(50),
    marginRight: scaleWidth(12),
    width: scaleWidth(50),
  },
  reservationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reservationName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  restaurantCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(12),
    marginRight: scaleWidth(12),
    padding: scaleWidth(12),
    width: scaleWidth(100),
  },
  restaurantImage: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(35),
    height: scaleWidth(70),
    justifyContent: 'center',
    marginBottom: scaleHeight(8),
    width: scaleWidth(70),
  },
  restaurantList: {
    paddingTop: scaleHeight(12),
  },
  restaurantName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(12),
    fontWeight: '500',
    marginBottom: scaleHeight(2),
  },
  restaurantRating: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(11),
  },
  section: {
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  seeDetailsText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(4),
  },
  statusBadge: {
    marginTop: scaleHeight(4),
  },
  statusCancelled: {
    color: theme.colors.gray['3'],
  },
  statusConfirmed: {
    color: theme.colors.success?.main || '#4CAF50',
  },
  statusPending: {
    color: theme.colors.warning?.main || '#FF9800',
  },
  statusText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsNumber: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginLeft: scaleWidth(8),
  },
  statsText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginLeft: scaleWidth(12),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  tabContainer: {
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(24),
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  tierBadge: {
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
  },
  tierName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginLeft: scaleWidth(6),
  },
  tierText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(6),
  },
  userSection: {
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: scaleHeight(0),
    paddingBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(24),
  },
  userStats: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});