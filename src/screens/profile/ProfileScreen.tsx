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
  ActivityIndicator,
  Image,
  Modal 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useUserData } from '@/hooks/useUserData';
import { getUserDisplayName } from '@/utils/getUserDisplayName';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';
import { api } from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';
import { useGamificationStats } from '@/hooks/useGamification';
import { TIER_CONFIG } from '@/types/gamification';
import { ConnectionsView } from '@/components/profile/ConnectionsView';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface RestaurantItem {
  id: string;
  name: string;
  address?: string;
  cuisine?: string;
  priceRange?: string;
  imageUrl?: string;
  rating: number;
  visitCount?: number;
}

interface DinnerBooking {
  id: string;
  dinner_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'waitlisted' | 'declined' | 'cancelled' | 'attended' | 'completed';
  dietary_restrictions?: string;
  preferences?: string;
  plus_one?: boolean;
  created_at?: string;
  updated_at?: string;
  dinners?: {
    id: string;
    datetime: string; // ISO string with date and time
    status: string;
    restaurant_name?: string;
    restaurant_address?: string;
  };
  dinner?: {
    id: string;
    datetime: string;
    status: string;
    restaurant_name?: string;
    restaurant_address?: string;
  };
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user } = usePrivyAuth();
  const { userData } = useUserData();
  const [reservations, setReservations] = useState<DinnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'connections'>('reservations');
  const [connections] = useState(0);
  const [topRestaurants, setTopRestaurants] = useState<RestaurantItem[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [reservationFilter, setReservationFilter] = useState<'upcoming' | 'past'>('upcoming');
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useGamificationStats();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Helper function to get consistent restaurant images
  const getRestaurantImage = (restaurantName: string): string => {
    const restaurantImages: Record<string, string> = {
      'Evvia Estiatorio': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200',
      'Nobu Palo Alto': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200',
      'Tamarine Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200',
      'Protégé': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=200',
      'Sundance The Steakhouse': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200',
      'Oren\'s Hummus': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=200',
    };
    
    // Default restaurant images if not in the map
    const defaultImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
    ];
    
    return restaurantImages[restaurantName] || 
           defaultImages[Math.abs(restaurantName.charCodeAt(0)) % defaultImages.length];
  };

  const fetchTopRestaurants = async () => {
    // Restaurant service has been removed - this feature is temporarily disabled
    setRestaurantsLoading(false);
    setTopRestaurants([]);
  };

  const fetchReservations = async () => {
    try {
      const response = await api.getMyBookings();
      if (response.success && response.data) {
        console.log('Bookings data:', JSON.stringify(response.data, null, 2)); // Enhanced debug log
        
        // Filter all bookings and sort by date
        const allBookings = response.data
          .filter((booking: any) => {
            // Include all non-cancelled bookings
            return booking.status !== 'cancelled';
          })
          .sort((a: any, b: any) => {
            // Sort by dinner datetime
            const dateA = a.dinners?.datetime || a.dinner?.datetime || 0;
            const dateB = b.dinners?.datetime || b.dinner?.datetime || 0;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
        
        setReservations(allBookings as DinnerBooking[]);
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
    fetchTopRestaurants();
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchReservations(),
      fetchTopRestaurants(),
      refetchStats(),
      loadNotifications()
    ]);
    setRefreshing(false);
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('NotificationsList' as any);
  };

  const handleRefineExperience = () => {
    navigation.navigate('RefineExperience' as any);
  };


  const handleCancelPress = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelModalVisible(true);
  };

  const handleCancelReservation = async () => {
    if (!bookingToCancel) return;
    
    setCancelling(true);
    try {
      const response = await api.cancelBooking(bookingToCancel);
      if (response.success) {
        // Refresh the reservations list after cancellation
        await fetchReservations();
        setCancelModalVisible(false);
        setBookingToCancel(null);
      } else {
        console.error('Failed to cancel reservation:', response.error);
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
    } finally {
      setCancelling(false);
    }
  };


  // Get current tier info from stats
  const currentTier = stats ? TIER_CONFIG.find(t => t.tier === Math.min(stats.currentTier, 5)) : TIER_CONFIG[0];
  const userTierName = currentTier?.name || 'Newcomer';
  const dinnerCount = stats?.dinnersAttended || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Always visible */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.iconButton} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* User Info - Always visible */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={60} color={theme.colors.primary.main} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            Welcome back, {getUserDisplayName({
              ...userData,
              nickname: userData?.displayName,
              name: userData?.name || user?.name,
              email: userData?.email || user?.email,
              phoneNumber: user?.phoneNumber
            }, 'User')}
          </Text>
          <View style={styles.userStats}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary.main} />
            ) : (
              <>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>Tier {stats?.currentTier || 1}</Text>
                </View>
                <Text style={styles.tierName}>{userTierName}</Text>
                <Text style={styles.statsText}>Dinners</Text>
                <Text style={styles.statsNumber}>{dinnerCount}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Tab Switcher - Always visible */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'reservations' && styles.activeTab]}
          onPress={() => setActiveTab('reservations')}
        >
          <Text style={[styles.tabText, activeTab === 'reservations' && styles.activeTabText]}>
            Reservations
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
            Connections
            {connections > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{connections}</Text>
              </View>
            )}
          </Text>
        </Pressable>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'connections' ? (
        // Connections tab - no ScrollView wrapper since ConnectionsView has its own FlatList
        <ConnectionsView 
          userId={user?.id} 
          onAddFriend={() => navigation.navigate('FindFriends')}
        />
      ) : (
        // Reservations tab - use ScrollView
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Up Next Section - Show the closest upcoming reservation */}
          {(() => {
            const now = new Date();
            const upcomingReservations = reservations.filter(reservation => {
              const dinnerDate = reservation.dinners?.datetime || reservation.dinner?.datetime;
              if (!dinnerDate) return false;
              return new Date(dinnerDate) >= now && reservation.status !== 'cancelled';
            });
            
            if (upcomingReservations.length === 0) return null;
            
            const nextReservation = upcomingReservations[0]; // Already sorted by date
            const dinnerDateTime = nextReservation.dinners?.datetime || nextReservation.dinner?.datetime;
            const restaurantName = nextReservation.dinners?.restaurant_name || 
                                   nextReservation.dinner?.restaurant_name || 
                                   'Restaurant TBD';
            
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Up Next</Text>
                </View>
                <View style={styles.upNextCard}>
                  <Pressable 
                    style={styles.upNextCardContent}
                    onPress={() => navigation.navigate('DinnerDetails', { 
                      bookingId: nextReservation.id,
                      dinnerId: nextReservation.dinner_id || nextReservation.dinners?.id,
                      reservation: nextReservation // Pass as fallback data
                    })}
                  >
                    <View style={styles.upNextLeft}>
                      <View style={styles.upNextIconContainer}>
                        <View style={styles.upNextIconBg}>
                          <Ionicons name="restaurant" size={24} color={theme.colors.white} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.upNextCenter}>
                      <Text style={styles.upNextTitle}>
                        {restaurantName}
                      </Text>
                      <View style={styles.upNextDateRow}>
                        <Ionicons name="calendar-outline" size={12} color={theme.colors.white} style={{ opacity: 0.8 }} />
                        <Text style={styles.upNextDateText}>
                          {dinnerDateTime ? (
                            `${new Date(dinnerDateTime).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })} at ${new Date(dinnerDateTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}`
                          ) : (
                            'Date TBD'
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.upNextRight}>
                      <Pressable 
                        style={styles.upNextDetailsButton}
                        onPress={() => navigation.navigate('DinnerDetails', { 
                          bookingId: nextReservation.id,
                          dinnerId: nextReservation.dinner_id || nextReservation.dinners?.id
                        })}
                      >
                        <Text style={styles.upNextDetailsText}>See details</Text>
                      </Pressable>
                      {nextReservation.status !== 'assigned' && nextReservation.status !== 'attended' && (
                        <Pressable 
                          style={styles.upNextCancelButton}
                          onPress={() => handleCancelPress(nextReservation.id)}
                        >
                          <Text style={styles.upNextCancelText}>Cancel</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })()}

          {/* My Reservation Section */}
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Reservation</Text>
            <Pressable 
              style={styles.filterDropdown}
              onPress={() => setReservationFilter(reservationFilter === 'upcoming' ? 'past' : 'upcoming')}
            >
              <Text style={styles.filterText}>{reservationFilter === 'upcoming' ? 'Upcoming' : 'Past'}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={styles.container}>
              <ActivityIndicator size="small" color={theme.colors.primary.main} />
            </View>
          ) : reservations.length > 0 ? (
            reservations
              .filter((reservation) => {
                const dinnerDate = reservation.dinners?.datetime || reservation.dinner?.datetime;
                if (!dinnerDate) return false;
                const date = new Date(dinnerDate);
                const now = new Date();
                return reservationFilter === 'upcoming' ? date >= now : date < now;
              })
              .map((reservation) => {
              const formatReservationDate = () => {
                const dinnerDateTime = reservation.dinners?.datetime || reservation.dinner?.datetime;
                if (!dinnerDateTime) return '';
                const dateTime = new Date(dinnerDateTime);
                if (isNaN(dateTime.getTime())) return '';
                
                // Extract date parts for display (US format MM/DD/YYYY)
                const year = dateTime.getFullYear().toString();
                const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
                const day = dateTime.getDate().toString().padStart(2, '0');
                
                const hours = dateTime.getHours();
                const minutes = dateTime.getMinutes();
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                const displayMinute = minutes.toString().padStart(2, '0');
                const time = `${displayHour}:${displayMinute} ${period}`;
                
                return `${month}/${day}/${year} at ${time}`;
              };

              const handleSeeDetails = () => {
                // Pass the entire reservation object as fallback
                navigation.navigate('DinnerDetails', { 
                  bookingId: reservation.id,
                  dinnerId: reservation.dinner_id || reservation.dinners?.id,
                  reservation // Pass as fallback data
                });
              };

              const restaurantName = reservation.dinners?.restaurant_name || 
                                     reservation.dinner?.restaurant_name || 
                                     'Restaurant TBD';

              return (
                <Pressable 
                  key={reservation.id} 
                  style={styles.reservationCard}
                  onPress={reservation.status !== 'cancelled' ? handleSeeDetails : undefined}
                >
                  <View style={styles.cardContent}>
                    {/* Left: Restaurant image or SharedTable logo */}
                    {restaurantName !== 'Restaurant TBD' ? (
                      <Image 
                        source={{ 
                          uri: getRestaurantImage(restaurantName)
                        }}
                        style={styles.imageSquare}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image 
                        source={require('@/assets/icon.png')}
                        style={styles.imageSquare}
                        resizeMode="cover"
                      />
                    )}
                    
                    {/* Center: Restaurant info */}
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantTitle}>
                        {restaurantName}
                      </Text>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color={theme.colors.text.secondary} style={{ opacity: 0.8 }} />
                        <Text style={styles.dateText}>
                          {formatReservationDate()}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Right: Actions */}
                    <View style={styles.cardActions}>
                      {/* Show appropriate buttons based on status */}
                      {reservation.status === 'completed' ? (
                        // Completed: Show Review button
                        <Pressable 
                          style={styles.reviewButton}
                          onPress={() => navigation.navigate('PostDinnerSurvey' as any, {
                            bookingId: reservation.id,
                            dinnerId: reservation.dinner_id || reservation.dinners?.id
                          })}
                        >
                          <Text style={styles.reviewText}>Review</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.actionButtonsColumn}>
                          {/* Show See details for all non-completed bookings */}
                          <Pressable 
                            style={styles.seeDetailsButton}
                            onPress={handleSeeDetails}
                          >
                            <Text style={styles.seeDetailsText}>See details</Text>
                          </Pressable>
                          
                          {/* Show Cancel button for bookings that haven't been attended yet */}
                          {reservation.status !== 'attended' && reservation.status !== 'cancelled' && (
                            <Pressable 
                              style={styles.cancelButton}
                              onPress={() => handleCancelPress(reservation.id)}
                            >
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.container}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.noReservationsText}>No upcoming dinner reservations</Text>
              <Text style={styles.noReservationsText}>Book a dinner to get started!</Text>
            </View>
          )}
        </View>

        {/* Quick Action Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Action</Text>
          </View>
          <Pressable style={styles.quickActionButton} onPress={handleRefineExperience}>
            <Text style={styles.quickActionText}>Refine your experience</Text>
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
            {restaurantsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary.main} />
              </View>
            ) : topRestaurants.length > 0 ? (
              topRestaurants.map((restaurant) => (
                <Pressable key={restaurant.id} style={styles.restaurantCard}>
                  {restaurant.imageUrl ? (
                    <Image 
                      source={{ uri: restaurant.imageUrl }}
                      style={styles.restaurantImagePhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.restaurantImage}>
                      <Ionicons name="restaurant" size={30} color={theme.colors.primary.main} />
                    </View>
                  )}
                  <Text style={styles.reservationName} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <Text style={styles.restaurantRating}>★ {restaurant.rating}</Text>
                  {restaurant.visitCount && restaurant.visitCount > 0 && (
                    <Text style={styles.restaurantVisits}>
                      {restaurant.visitCount} {restaurant.visitCount === 1 ? 'visit' : 'visits'}
                    </Text>
                  )}
                </Pressable>
              ))
            ) : (
              <Text style={styles.noRestaurantsText}>No restaurants visited yet</Text>
            )}
          </ScrollView>
        </View>

          <View style={{ height: scaleHeight(20) }} />
        </ScrollView>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={48} color={theme.colors.error.main} />
            </View>
            
            <Text style={styles.modalTitle}>Cancel Reservation?</Text>
            
            <Text style={styles.modalDescription}>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setBookingToCancel(null);
                }}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelButtonText}>Keep Reservation</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelReservation}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Yes, Cancel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  upNextCard: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  upNextCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(16),
  },
  upNextLeft: {
    marginRight: scaleWidth(12),
  },
  upNextIconContainer: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  upNextIconBg: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: scaleWidth(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upNextCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  upNextTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: scaleHeight(4),
  },
  upNextDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  upNextDateText: {
    fontSize: scaleFont(12),
    color: theme.colors.white,
    opacity: 0.9,
  },
  upNextRight: {
    alignItems: 'flex-end',
    gap: scaleHeight(8),
  },
  upNextDetailsButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
  },
  upNextDetailsText: {
    fontSize: scaleFont(13),
    color: theme.colors.white,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  upNextCancelButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  upNextCancelText: {
    fontSize: scaleFont(12),
    color: theme.colors.white,
    opacity: 0.8,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(4),
  },
  filterText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  quickActionButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderWidth: 1,
    borderRadius: scaleWidth(25),
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
  },
  quickActionText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(14),
    fontWeight: '600',
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
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error.main,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  noReservationsText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    paddingVertical: scaleHeight(20),
    textAlign: 'center',
  },
  reservationCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(20),
    marginBottom: scaleHeight(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.paleGray,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
  },
  imageSquare: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(8),
    marginRight: scaleWidth(12),
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  dateText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    opacity: 0.9,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  actionButtonsColumn: {
    alignItems: 'flex-end',
    gap: scaleHeight(8),
  },
  seeDetailsButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
  },
  seeDetailsText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  cancelButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  cancelButtonText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  reviewButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
  },
  reviewText: {
    fontSize: scaleFont(13),
    color: theme.colors.primary.main,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  restaurantImagePhoto: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
    marginBottom: scaleHeight(8),
    backgroundColor: theme.colors.ui.lighterGray,
  },
  restaurantList: {
    paddingTop: scaleHeight(12),
  },
  restaurantRating: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(11),
  },
  restaurantVisits: {
    color: theme.colors.text.tertiary,
    fontSize: scaleFont(10),
    marginTop: scaleHeight(2),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(40),
  },
  noRestaurantsText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    textAlign: 'center',
    paddingVertical: scaleHeight(20),
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
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
  },
  tierName: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginLeft: scaleWidth(6),
  },
  tierText: {
    color: theme.colors.white,
    fontSize: scaleFont(12),
    fontWeight: '700',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(24),
    width: '100%',
    maxWidth: scaleWidth(320),
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: scaleHeight(16),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: scaleHeight(24),
    lineHeight: scaleFont(20),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: scaleWidth(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleHeight(44),
  },
  modalCancelButton: {
    backgroundColor: theme.colors.gray[100],
  },
  modalCancelButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.error.main,
  },
  modalConfirmButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.white,
  },
});