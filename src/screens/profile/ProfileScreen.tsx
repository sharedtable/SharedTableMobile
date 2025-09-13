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
  Image 
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

interface DinnerSignup {
  id: string;
  dinner_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'grouped' | 'cancelled';
  dietary_restrictions?: string;
  preferences?: string;
  signed_up_at: string;
  created_at?: string;
  updated_at?: string;
  dinner?: {
    id: string;
    datetime: string; // ISO string with date and time
    max_signups: number;
    current_signups: number;
    status: string;
    dinner_type?: 'regular' | 'singles';
    created_at?: string;
    updated_at?: string;
  };
  dinner_group?: {
    id: string;
    dinner_id: string;
    group_name: string;
    restaurant_name: string;
    restaurant_address: string;
    member_count: number;
    max_members: number;
    status: 'confirmed' | 'cancelled' | 'completed';
    created_at?: string;
    updated_at?: string;
  };
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user } = usePrivyAuth();
  const { userData } = useUserData();
  const [reservations, setReservations] = useState<DinnerSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'connections'>('reservations');
  const [connections] = useState(0);
  const [topRestaurants, setTopRestaurants] = useState<RestaurantItem[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [reservationFilter, setReservationFilter] = useState<'upcoming' | 'past'>('upcoming');
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useGamificationStats();

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
    try {
      setRestaurantsLoading(true);
      const response = await api.getTopRatedRestaurants(5);
      if (response.success && response.data) {
        setTopRestaurants(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch top restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await api.getMySignups();
      if (response.success && response.data) {
        console.log('Signups data:', response.data); // Debug log
        
        // Filter upcoming signups (not cancelled) and sort by date
        const upcoming = response.data
          .filter((signup: DinnerSignup) => {
            if (signup.status === 'cancelled' || !signup.dinner) return false;
            // Compare datetime to filter out past slots
            const now = new Date();
            const dinnerDate = new Date(signup.dinner.datetime);
            return dinnerDate >= now;
          })
          .sort((a: DinnerSignup, b: DinnerSignup) => {
            if (!a.dinner || !b.dinner) return 0;
            // Sort by datetime
            const dateA = new Date(a.dinner.datetime);
            const dateB = new Date(b.dinner.datetime);
            return dateA.getTime() - dateB.getTime();
          });
        
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


  const handleCancelReservation = async (signupId: string) => {
    try {
      const response = await api.cancelSignup(signupId);
      if (response.success) {
        // Refresh the reservations list after cancellation
        await fetchReservations();
      } else {
        console.error('Failed to cancel reservation:', response.error);
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
    }
  };

  const _formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const _formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const _getStatusLabel = (signup: DinnerSignup) => {
    if (signup.status === 'grouped' && signup.dinner_group) {
      return 'MATCHED';
    }
    switch (signup.status) {
      case 'pending':
        return 'AWAITING MATCH';
      case 'confirmed':
        return 'CONFIRMED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return signup.status.toUpperCase();
    }
  };

  const _getStatusStyle = (status: string) => {
    switch (status) {
      case 'MATCHED':
      case 'grouped':
        return styles.statusConfirmed;
      case 'AWAITING MATCH':
      case 'pending':
        return styles.statusPending;
      case 'CONFIRMED':
      case 'confirmed':
        return styles.statusConfirmed;
      case 'CANCELLED':
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
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
          {/* Up Next Section */}
          {reservations.length > 0 && reservations[0].status !== 'cancelled' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <View style={styles.upNextCard}>
                <Pressable 
                  style={styles.upNextCardContent}
                  onPress={() => reservations[0].dinner_group && navigation.navigate('DinnerDetails', { reservation: reservations[0] })}
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
                      {reservations[0].dinner_group?.restaurant_name || 'Sotto Mare'}
                    </Text>
                    <View style={styles.upNextDateRow}>
                      <Ionicons name="calendar-outline" size={12} color={theme.colors.white} style={{ opacity: 0.8 }} />
                      <Text style={styles.upNextDateText}>
                        {reservations[0].dinner?.datetime ? 
                          `${new Date(reservations[0].dinner.datetime).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })} at ${new Date(reservations[0].dinner.datetime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`
                          : '2024-02-15 at 7:00 PM'
                        }
                      </Text>
                    </View>
                  </View>
                  <View style={styles.upNextRight}>
                    <Pressable 
                      style={styles.upNextDetailsButton}
                      onPress={() => navigation.navigate('DinnerDetails', { reservation: reservations[0] })}
                    >
                      <Text style={styles.upNextDetailsText}>See details</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.upNextCancelButton}
                      onPress={() => handleCancelReservation(reservations[0].id)}
                    >
                      <Text style={styles.upNextCancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

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
                if (!reservation.dinner?.datetime) return false;
                const dinnerDate = new Date(reservation.dinner.datetime);
                const now = new Date();
                return reservationFilter === 'upcoming' ? dinnerDate >= now : dinnerDate < now;
              })
              .map((reservation) => {
              const formatReservationDate = () => {
                if (!reservation.dinner?.datetime) return '';
                const dateTime = new Date(reservation.dinner.datetime);
                if (isNaN(dateTime.getTime())) return '';
                
                // Extract date parts for display
                const _year = dateTime.getFullYear().toString();
                const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
                const day = dateTime.getDate().toString().padStart(2, '0');
                
                const hours = dateTime.getHours();
                const minutes = dateTime.getMinutes();
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                const displayMinute = minutes.toString().padStart(2, '0');
                const time = `${displayHour}:${displayMinute} ${period}`;
                
                return `${_year}-${month}-${day} at ${time}`;
              };

              const handleSeeDetails = () => {
                navigation.navigate('DinnerDetails', { reservation });
              };

              return (
                <Pressable 
                  key={reservation.id} 
                  style={styles.reservationCard}
                  onPress={reservation.dinner_group ? handleSeeDetails : undefined}
                >
                  <View style={styles.cardContent}>
                    {/* Left: Restaurant image or SharedTable logo */}
                    {reservation.dinner_group?.restaurant_name ? (
                      <Image 
                        source={{ 
                          uri: getRestaurantImage(reservation.dinner_group.restaurant_name)
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
                        {reservation.dinner_group?.restaurant_name || 'Awaiting Restaurant'}
                      </Text>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.dateText}>
                          {formatReservationDate()}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Right: Actions */}
                    <View style={styles.cardActions}>
                      {reservation.dinner_group && (
                        <Pressable 
                          style={styles.detailsButton}
                          onPress={handleSeeDetails}
                        >
                          <Text style={styles.detailsText}>See details</Text>
                        </Pressable>
                      )}
                      {reservation.status !== 'grouped' && reservation.status !== 'cancelled' && (
                        <Pressable 
                          style={styles.cancelTextButton}
                          onPress={() => handleCancelReservation(reservation.id)}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
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
          <Text style={styles.sectionTitle}>Quick Action</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  upNextCard: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: scaleWidth(16),
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
    marginHorizontal: scaleWidth(16),
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
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
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
  },
  dateText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    marginLeft: scaleWidth(4),
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    marginRight: scaleWidth(12),
  },
  detailsText: {
    fontSize: scaleFont(13),
    color: theme.colors.ui.cyan,
    fontWeight: '500',
  },
  cancelTextButton: {
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(8),
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
  statusCancelled: {
    color: theme.colors.gray['3'],
  },
  statusConfirmed: {
    color: theme.colors.success?.main || '#4CAF50',
  },
  statusPending: {
    color: theme.colors.warning?.main || '#FF9800',
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
});