import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';
import { ActivityIndicator } from 'react-native';

type DinnerDetailsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'DinnerDetails'>;
type DinnerDetailsRouteProp = RouteProp<ProfileStackParamList, 'DinnerDetails'>;

interface GroupMember {
  id: string;
  user_id: string;
  status: string;
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
  };
}

export function DinnerDetailsScreen() {
  const navigation = useNavigation<DinnerDetailsNavigationProp>();
  const route = useRoute<DinnerDetailsRouteProp>();
  const { reservation: initialReservation, bookingId, dinnerId: _dinnerId } = route.params;
  
  const [reservation, setReservation] = useState<any>(initialReservation || null);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'group'>('restaurant');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [_loading, setLoading] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [isCountdownCollapsed, setIsCountdownCollapsed] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);

  // Countdown state
  const [countdownTime, setCountdownTime] = useState({ 
    hours: 0, 
    minutes: 0, 
    seconds: 0,
    totalSeconds: 0,
    progress: 0 
  });

  // Fetch booking details if bookingId is provided and status is assigned
  useEffect(() => {
    const fetchBookingDetails = async () => {
      // If we have initial reservation data, check if it's assigned
      if (initialReservation) {
        const status = initialReservation.status;
        console.log('Reservation status:', status);
        
        // Only fetch details if status is assigned, attended, or completed
        if (!['assigned', 'attended', 'completed'].includes(status)) {
          console.log('Booking not yet assigned, skipping details fetch');
          setReservation(initialReservation);
          setIsLoadingBooking(false);
          return;
        }
      }
      
      if (!bookingId) return;
      
      setIsLoadingBooking(true);
      try {
        console.log('Fetching booking details for ID:', bookingId);
        const response = await api.getBookingDetails(bookingId);
        console.log('Booking details response:', response);
        
        if (response.success && response.data) {
          // Transform the booking data to match the expected reservation format
          const booking = response.data;
          const transformedReservation = {
            id: booking.id,
            dinner_id: booking.dinner_id,
            user_id: booking.user_id,
            status: booking.status,
            dietary_restrictions: (booking as any).dietary_restrictions,
            preferences: (booking as any).preferences,
            plus_one: (booking as any).plus_one,
            dinner: booking.dinner,
            // For backward compatibility with existing code
            dinner_group: booking.status === 'assigned' ? {
              id: booking.dinner_id,
              restaurant_name: booking.dinner?.restaurant_name,
              restaurant_address: (booking.dinner as any)?.restaurant_address,
            } : null
          };
          setReservation(transformedReservation);
        }
      } catch (error) {
        console.error('Failed to fetch booking details:', error);
        // Fall back to initial reservation if fetch fails
        if (initialReservation) {
          setReservation(initialReservation);
        }
      } finally {
        setIsLoadingBooking(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, initialReservation]);

  // Calculate countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      if (!reservation?.dinner?.datetime && !reservation?.dinners?.datetime) {
        return;
      }
      
      const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime;

      // Create date object for dinner time from ISO string
      const dinnerDate = new Date(dinnerDateTime);
      
      if (isNaN(dinnerDate.getTime())) {
        console.error('Invalid datetime:', dinnerDateTime);
        return;
      }

      const now = new Date();
      const diff = dinnerDate.getTime() - now.getTime();

      // Calculate progress for 24-hour window
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      const bookingTime = dinnerDate.getTime() - twentyFourHoursInMs;
      const elapsed = now.getTime() - bookingTime;
      const progress = Math.max(0, Math.min(1, elapsed / twentyFourHoursInMs));

      if (diff <= 0) {
        setCountdownTime({ 
          hours: 0, 
          minutes: 0, 
          seconds: 0,
          totalSeconds: 0,
          progress: 1
        });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownTime({ 
        hours, 
        minutes, 
        seconds,
        totalSeconds,
        progress
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  // Fetch group members
  const fetchGroupMembers = useCallback(async () => {
    if (!reservation?.dinner_group?.id) return;

    setLoading(true);
    try {
      const response = await api.getGroupMembers(reservation.dinner_group.id);
      if (response.success && response.data) {
        setGroupMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      // Handle auth expiry gracefully
      if ((error as { response?: { status?: number } })?.response?.status === 401) {
        console.log('Authentication expired - please log in again');
        // Don't show error to user, just use cached/mock data
      }
    } finally {
      setLoading(false);
    }
  }, [reservation?.dinner_group?.id]);

  useEffect(() => {
    if (activeTab === 'group') {
      fetchGroupMembers();
    }
  }, [activeTab, fetchGroupMembers]);

  const _handleOpenMaps = () => {
    if (!reservation?.dinner_group?.restaurant_address) return;
    
    const address = encodeURIComponent(reservation.dinner_group.restaurant_address);
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
      default: `https://maps.google.com/?q=${address}`,
    });
    
    Linking.openURL(url);
  };

  const _handleCall = () => {
    // In a real app, you'd have the restaurant phone number
    const phoneNumber = 'tel:+16505551234';
    Linking.openURL(phoneNumber);
  };

  const _formatDate = () => {
    if (!reservation?.dinner?.datetime && !reservation?.dinners?.datetime) return '';
    
    const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime;
    const date = new Date(dinnerDateTime);
    if (isNaN(date.getTime())) return '';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const _formatTime = () => {
    if (!reservation?.dinner?.datetime && !reservation?.dinners?.datetime) return '';
    
    const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime;
    const date = new Date(dinnerDateTime);
    if (isNaN(date.getTime())) return '';
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    let displayHour;
    if (hours > 12) {
      displayHour = hours - 12;
    } else if (hours === 0) {
      displayHour = 12;
    } else {
      displayHour = hours;
    }
    const displayMinute = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const _formatDayOfWeek = () => {
    if (!reservation?.dinner?.datetime && !reservation?.dinners?.datetime) return '';
    
    const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime;
    const date = new Date(dinnerDateTime);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const handleCheckIn = async () => {
    if (!reservation?.id || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await api.markBookingAsAttended(reservation.id);
      if (response.success && response.data) {
        setReservation({ ...reservation, status: 'attended' });
        Alert.alert(
          'Checked In!',
          'You\'ve been marked as attending. Enjoy your dinner!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Check-in Failed',
        'Unable to check in at this time. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Auto-completion happens after 1.5 hours from dinner start
  // No manual completion needed

  // Check if we should show status buttons
  const shouldShowStatusButtons = () => {
    if (!reservation?.dinner?.datetime && !reservation?.dinners?.datetime) return false;
    
    const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime;
    const dinnerDate = new Date(dinnerDateTime);
    const now = new Date();
    const hoursUntilDinner = (dinnerDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Show buttons if dinner is within 2 hours or has passed
    return hoursUntilDinner <= 2;
  };

  const getButtonState = () => {
    const currentStatus = reservation?.status || 'pending';
    const dinnerDateTime = reservation?.dinner?.datetime || reservation?.dinners?.datetime || '';
    const dinnerDate = new Date(dinnerDateTime);
    const now = new Date();
    const hoursAfterDinner = (now.getTime() - dinnerDate.getTime()) / (1000 * 60 * 60);
    
    return {
      isAssigned: currentStatus === 'assigned',
      canCheckIn: currentStatus === 'assigned' && hoursAfterDinner < 1.5,
      isAttended: currentStatus === 'attended',
      isCompleted: currentStatus === 'completed',
      autoCompletionPending: currentStatus === 'attended' && hoursAfterDinner < 1.5,
      hoursUntilAutoComplete: Math.max(0, 1.5 - hoursAfterDinner)
    };
  };

  // Show loading state while fetching booking details
  if (isLoadingBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading dinner details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no reservation data
  if (!reservation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dinner details available</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show "Details coming soon" for unassigned bookings
  if (reservation && !['assigned', 'attended', 'completed'].includes(reservation.status)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Dinner Reservation</Text>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
        
        <ScrollView contentContainerStyle={styles.comingSoonContainer}>
          {/* Countdown Timer Card */}
          <View style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <Ionicons name="time-outline" size={32} color={theme.colors.primary.main} />
              <Text style={styles.countdownTitle}>Matching in Progress</Text>
            </View>
            
            <Text style={styles.countdownSubtitle}>
              We're finding the perfect dinner group for you!
            </Text>
            
            {/* Countdown Display */}
            <View style={styles.countdownDisplay}>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{countdownTime.hours.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>Hours</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{countdownTime.minutes.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>Minutes</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{countdownTime.seconds.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>Seconds</Text>
              </View>
            </View>
            
            <Text style={styles.countdownInfo}>
              Until dinner on {_formatDate()} at {_formatTime()}
            </Text>
          </View>
          
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.main} />
              <Text style={styles.statusTitle}>Reservation Confirmed</Text>
            </View>
            <Text style={styles.statusDescription}>
              Your spot is secured! Restaurant and group details will be revealed soon.
            </Text>
          </View>
          
          {/* What to Expect Card */}
          <View style={styles.expectCard}>
            <Text style={styles.expectTitle}>What Happens Next?</Text>
            <View style={styles.expectItem}>
              <Ionicons name="people" size={20} color={theme.colors.primary.main} />
              <Text style={styles.expectText}>
                We'll match you with 3-5 other diners who share similar interests
              </Text>
            </View>
            <View style={styles.expectItem}>
              <Ionicons name="restaurant" size={20} color={theme.colors.primary.main} />
              <Text style={styles.expectText}>
                You'll receive the restaurant details 24 hours before dinner
              </Text>
            </View>
            <View style={styles.expectItem}>
              <Ionicons name="chatbubbles" size={20} color={theme.colors.primary.main} />
              <Text style={styles.expectText}>
                Get access to your group chat to connect before meeting
              </Text>
            </View>
          </View>
          
          {/* Fun Fact */}
          <View style={styles.funFactCard}>
            <Ionicons name="bulb-outline" size={24} color={theme.colors.warning.main} />
            <Text style={styles.funFactText}>
              Did you know? Our matching algorithm considers over 20 factors to create the perfect dinner group!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Get Ready for Dinner!</Text>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'restaurant' && styles.activeTab]}
          onPress={() => setActiveTab('restaurant')}
        >
          <Text style={[styles.tabText, activeTab === 'restaurant' && styles.activeTabText]}>
            The Restaurant
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'group' && styles.activeTab]}
          onPress={() => setActiveTab('group')}
        >
          <Text style={[styles.tabText, activeTab === 'group' && styles.activeTabText]}>
            Your Dining Group
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView 
        style={[
          styles.content,
          isCountdownCollapsed && styles.contentCollapsed
        ]} 
        showsVerticalScrollIndicator={false}>
        {activeTab === 'restaurant' ? (
          <View style={styles.tabContent}>
            {/* Restaurant Card */}
            <Pressable style={styles.restaurantCard}>
              <View style={styles.restaurantCardContent}>
                <View style={styles.restaurantImageSmall}>
                  {reservation.dinner_group?.restaurant_name === 'Evvia Estiatorio' ? (
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1544124094-5cfa1d4b6dcf?w=200' }}
                      style={styles.restaurantThumbnail}
                    />
                  ) : (
                    <Ionicons name="restaurant" size={32} color={theme.colors.text.secondary} />
                  )}
                </View>
                <View style={styles.restaurantDetails}>
                  <Text style={styles.restaurantCardName}>
                    {reservation.dinner_group?.restaurant_name || 'Restaurant TBD'}
                  </Text>
                  <Text style={styles.restaurantRating}>4.8</Text>
                  <Text style={styles.restaurantTagline}>
                    {reservation.dinner_group?.restaurant_name === 'Evvia Estiatorio' 
                      ? 'Authentic Greek cuisine with a modern twist'
                      : 'We provide ...[signature touch?]'}
                  </Text>
                  <Text style={styles.restaurantDescription}>
                    {reservation.dinner_group?.restaurant_name === 'Evvia Estiatorio'
                      ? 'Evvia has been Palo Alto\'s premier Greek restaurant since 1995. Our chef brings authentic flavors from the Mediterranean, using only the freshest ingredients. Known for our warm hospitality and rustic-elegant atmosphere, we create memorable dining experiences that transport you to the Greek islands.'
                      : `At ${reservation.dinner_group?.restaurant_name || 'this restaurant'}, we believe that dining is not just about food, but also about the overall experience. Our staff, renowned for their warmth and dedication, strives to make every visit an unforgettable event.`}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* History and Recommendations */}
            <View style={styles.sectionsContainer}>
              <View style={styles.historyColumn}>
                <Text style={styles.sectionHeader}>History</Text>
                <View style={styles.historyList}>
                  {reservation.dinner_group?.restaurant_name === 'Evvia Estiatorio' ? (
                    <>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyItemTitle}>Founded in 1995</Text>
                        <Text style={styles.historyItemText}>
                          Opened by the Koliopoulos family
                        </Text>
                      </View>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyItemTitle}>Award Winner</Text>
                        <Text style={styles.historyItemText}>
                          Best Mediterranean Restaurant 2020
                        </Text>
                      </View>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyItemTitle}>Chef Stavros</Text>
                        <Text style={styles.historyItemText}>
                          30 years of culinary expertise
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.emptyHistoryItem} />
                      <View style={styles.emptyHistoryItem} />
                      <View style={styles.emptyHistoryItem} />
                    </>
                  )}
                </View>
              </View>

              <View style={styles.recommendationColumn}>
                <Text style={styles.sectionHeader}>Recommendation for You</Text>
                <View style={styles.recommendationGrid}>
                  {reservation.dinner_group?.restaurant_name === 'Evvia Estiatorio' ? (
                    <>
                      <Pressable style={styles.recommendationItem}>
                        <Image 
                          source={{ uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200' }}
                          style={styles.recommendationImage}
                        />
                        <Text style={styles.recommendationText}>Moussaka</Text>
                      </Pressable>
                      <Pressable style={styles.recommendationItem}>
                        <Image 
                          source={{ uri: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200' }}
                          style={styles.recommendationImage}
                        />
                        <Text style={styles.recommendationText}>Lamb Souvlaki</Text>
                      </Pressable>
                      <Pressable style={styles.recommendationItem}>
                        <Image 
                          source={{ uri: 'https://images.unsplash.com/photo-1623855244183-52fd8d3ce2f7?w=200' }}
                          style={styles.recommendationImage}
                        />
                        <Text style={styles.recommendationText}>Greek Salad</Text>
                      </Pressable>
                      <Pressable style={styles.recommendationItem}>
                        <Image 
                          source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200' }}
                          style={styles.recommendationImage}
                        />
                        <Text style={styles.recommendationText}>Baklava</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={styles.recommendationItem} />
                      <View style={styles.recommendationItem} />
                      <View style={styles.recommendationItem} />
                      <View style={styles.recommendationItem} />
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Side-by-side sections container */}
            <View style={styles.sideBySideContainer}>
              {/* Why We Matched You Section */}
              <View style={[styles.halfSection, styles.matchedSection]}>
                <Text style={styles.matchedTitle}>Why We Matched You</Text>
                <View style={styles.insightsList}>
                  <View style={styles.insightItem}>
                    <Text style={styles.matchedIcon}>✽</Text>
                    <Text style={styles.matchedText}>Culinary Interests</Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.matchedIcon}>✽</Text>
                    <Text style={styles.matchedText}>Startup Ambitions</Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.matchedIcon}>✽</Text>
                    <Text style={styles.matchedText}>Conversation Style</Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.matchedIcon}>✽</Text>
                    <Text style={styles.matchedText}>Rare Experience</Text>
                  </View>
                </View>
              </View>

              {/* Fun Facts Section */}
              <View style={styles.halfSection}>
                <Text style={styles.funFactsTitle}>Fun Facts</Text>
                <View style={styles.funFactsList}>
                  <View style={styles.funFactItem}>
                    <Text style={styles.funFactIcon}>🎯</Text>
                    <Text style={styles.funFactText}>Stanford students meet an average of 3 lifelong friends at SharedTable dinners</Text>
                  </View>
                  <View style={styles.funFactItem}>
                    <Text style={styles.funFactIcon}>🌍</Text>
                    <Text style={styles.funFactText}>Our groups speak 12+ languages collectively</Text>
                  </View>
                  <View style={styles.funFactItem}>
                    <Text style={styles.funFactIcon}>🚀</Text>
                    <Text style={styles.funFactText}>42% of our diners are founders or work at startups</Text>
                  </View>
                  <View style={styles.funFactItem}>
                    <Text style={styles.funFactIcon}>💡</Text>
                    <Text style={styles.funFactText}>Best conversations happen over dessert!</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Detailed Members List (Always Visible) */}
            <View style={styles.groupMembersSection}>
              <Text style={styles.groupMembersTitle}>
                Your Dinner Party ({reservation.dinner_group?.group_size || groupMembers.length || 4} members)
              </Text>
              <View style={styles.membersList}>
                {groupMembers.length > 0 ? (
                  groupMembers.map((member, index) => {
                    let displayName = member.user?.display_name;
                    if (!displayName) {
                      if (member.user?.first_name && member.user?.last_name) {
                        displayName = `${member.user.first_name} ${member.user.last_name}`;
                      } else {
                        displayName = member.user?.email?.split('@')[0] || 'Member';
                      }
                    }
                    const isExpanded = expandedMemberId === member.id;
                    const isCurrentUser = member.user?.email === 'garyxuejingzhou@gmail.com'; // You can get this from auth context
                    
                    // Mock additional info - in real app, this would come from the user profile
                    const memberDetails = {
                      major: ['Computer Science', 'Business', 'Engineering', 'Design'][index % 4],
                      year: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'][index % 5],
                      interests: ['AI/ML', 'Startups', 'Coffee', 'Running', 'Photography', 'Travel'].slice(index % 3, (index % 3) + 3),
                      favoriteFood: ['Italian', 'Japanese', 'Mediterranean', 'Mexican'][index % 4],
                      funFact: [
                        'Built 3 apps last quarter',
                        'Speaks 4 languages',
                        'Former national chess player',
                        'Published ML researcher'
                      ][index % 4]
                    };
                    
                    return (
                      <Pressable 
                        key={member.id} 
                        style={[
                          styles.memberCard,
                          isExpanded && styles.memberCardExpanded,
                          isCurrentUser && styles.currentUserCard
                        ]}
                        onPress={() => setExpandedMemberId(isExpanded ? null : member.id)}
                      >
                        <View style={styles.memberCardHeader}>
                          <View style={styles.memberAvatar}>
                            <Ionicons 
                              name="person-circle" 
                              size={isExpanded ? 50 : 40} 
                              color={isCurrentUser ? theme.colors.primary.main : theme.colors.text.tertiary} 
                            />
                          </View>
                          <View style={styles.memberInfo}>
                            <View style={styles.memberNameRow}>
                              <Text style={[
                                styles.memberName,
                                isCurrentUser && styles.currentUserName
                              ]}>
                                {displayName}
                              </Text>
                              {isCurrentUser && (
                                <View style={styles.youBadge}>
                                  <Text style={styles.youBadgeText}>You</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.memberStatus}>
                              {memberDetails.major} • {memberDetails.year}
                            </Text>
                          </View>
                          <Ionicons 
                            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                            size={20} 
                            color={theme.colors.text.tertiary} 
                          />
                        </View>
                        
                        {isExpanded && (
                          <View style={styles.memberExpandedContent}>
                            <View style={styles.memberDetailSection}>
                              <Text style={styles.memberDetailLabel}>Interests</Text>
                              <View style={styles.tagContainer}>
                                {memberDetails.interests.map((interest, i) => (
                                  <View key={i} style={styles.interestTag}>
                                    <Text style={styles.interestTagText}>{interest}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                            
                            <View style={styles.memberDetailSection}>
                              <Text style={styles.memberDetailLabel}>Favorite Cuisine</Text>
                              <Text style={styles.memberDetailText}>{memberDetails.favoriteFood}</Text>
                            </View>
                            
                            <View style={styles.memberDetailSection}>
                              <Text style={styles.memberDetailLabel}>Fun Fact</Text>
                              <Text style={styles.memberDetailText}>{memberDetails.funFact}</Text>
                            </View>
                            
                            {/* Action Buttons */}
                            {!isCurrentUser && (
                              <View style={styles.memberActionButtons}>
                                <Pressable 
                                  style={[styles.memberActionButton, styles.messageButton]}
                                  onPress={() => {
                                    // Navigate to chat with this user
                                    // Create or open a direct message channel
                                    // Using type assertion for navigation until proper typing is established
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (navigation as any).navigate('Chat', {
                                      userId: member.user?.id,
                                      userName: displayName,
                                    });
                                  }}
                                >
                                  <Ionicons name="chatbubble-outline" size={16} color={theme.colors.white} />
                                  <Text style={styles.messageButtonText}>Message</Text>
                                </Pressable>
                                
                                <Pressable 
                                  style={[styles.memberActionButton]}
                                  onPress={() => {
                                    // Navigate to user profile
                                    Alert.alert('View Profile', `Opening ${displayName}'s profile...`);
                                  }}
                                >
                                  <Ionicons name="person-outline" size={16} color={theme.colors.primary.main} />
                                  <Text style={styles.viewProfileButtonText}>Profile</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                ) : (
                  (() => {
                    if (reservation.dinner_group?.group_size) {
                      return <Text style={styles.emptyText}>Loading group members...</Text>;
                    } else {
                      return <Text style={styles.emptyText}>Group members will appear here once confirmed</Text>;
                    }
                  })()
                )}
              </View>
            </View>

            {/* Group Chat Button */}
            <Pressable 
              style={styles.chatButton}
              onPress={() => {
                // Navigate to chat or open external chat
                Alert.alert(
                  'Group Chat',
                  `Opening chat for ${reservation.dinner_group?.restaurant_name || 'your dinner group'}...`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Open Chat', 
                      onPress: () => {
                        // In a real app, navigate to chat screen
                        // navigation.navigate('GroupChat', { groupId: reservation.dinner_group?.id });
                        console.log('Opening group chat for dinner group:', reservation.dinner_group?.id);
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.white} />
              <Text style={styles.chatButtonText}>Open Group Chat</Text>
            </Pressable>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>Tips for a Great Dinner</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>🍝</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipTextBold}>Sharing is the norm here!</Text> We encourage family-style dining—it&apos;s the best way to try more flavors and spark conversation
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>⏰</Text>
                <Text style={styles.tipText}>Arrive 5 minutes early to meet everyone and get comfortable</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>💬</Text>
                <Text style={styles.tipText}>Share dietary restrictions in the group chat ahead of time</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>🎯</Text>
                <Text style={styles.tipText}>Be open to trying new dishes and making new connections</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>📱</Text>
                <Text style={styles.tipText}>Put phones away during dinner for deeper conversations</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>💳</Text>
                <Text style={styles.tipText}>Split the bill equally - it&apos;s simpler and keeps things social</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status Action Buttons */}
      {shouldShowStatusButtons() && (
        <View style={styles.statusButtonsContainer}>
          {(() => {
            const buttonState = getButtonState();
            
            if (buttonState.isCompleted) {
              return (
                <View style={styles.statusCompletedContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.main} />
                  <Text style={styles.statusCompletedText}>Dinner Completed</Text>
                </View>
              );
            }
            
            if (buttonState.isAssigned && !buttonState.canCheckIn) {
              return (
                <View style={styles.statusAssignedContainer}>
                  <Ionicons name="people-circle" size={24} color={theme.colors.primary.main} />
                  <Text style={styles.statusAssignedText}>You've been assigned to a group! Check in when you arrive</Text>
                </View>
              );
            }
            
            if (buttonState.isAttended) {
              const hoursRemaining = buttonState.hoursUntilAutoComplete;
              const minutesRemaining = Math.floor(hoursRemaining * 60);
              return (
                <View style={styles.statusAttendedContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.main} />
                  <Text style={styles.statusAttendedText}>Checked In</Text>
                  {buttonState.autoCompletionPending && (
                    <Text style={styles.autoCompleteText}>
                      Auto-completes in {minutesRemaining > 60 ? `${Math.floor(minutesRemaining/60)}h ${minutesRemaining%60}m` : `${minutesRemaining}m`}
                    </Text>
                  )}
                </View>
              );
            }
            
            return (
              <View style={styles.statusButtonsRow}>
                {buttonState.canCheckIn && (
                  <Pressable 
                    style={[styles.statusButton, styles.checkInButton]}
                    onPress={handleCheckIn}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <>
                        <Ionicons name="location" size={20} color={theme.colors.white} />
                        <Text style={styles.statusButtonText}>Check In at Restaurant</Text>
                      </>
                    )}
                  </Pressable>
                )}
                
                {buttonState.isAssigned && (
                  <View style={styles.assignedBadge}>
                    <Ionicons name="people" size={20} color={theme.colors.primary.main} />
                    <Text style={styles.assignedText}>Assigned - Ready to check in</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}

      {/* Countdown Timer - Fixed at Bottom for Both Tabs */}
      <Pressable 
        style={[
          styles.countdownContainer,
          isCountdownCollapsed && styles.countdownContainerCollapsed
        ]}
        onPress={() => setIsCountdownCollapsed(!isCountdownCollapsed)}
      >
        {isCountdownCollapsed ? (
          // Collapsed State - Minimal
          <View style={styles.countdownCollapsedContent}>
            <View style={styles.countdownCollapsedLeft}>
              <Ionicons name="time-outline" size={18} color={theme.colors.primary.main} />
              <Text style={styles.countdownCollapsedText}>
                {countdownTime.hours > 0
                  ? `${countdownTime.hours}h ${countdownTime.minutes}m`
                  : `${countdownTime.minutes}m ${countdownTime.seconds}s`
                } until dinner
              </Text>
            </View>
            <View style={styles.countdownCollapsedRight}>
              <View style={styles.miniProgressBar}>
                <View 
                  style={[
                    styles.miniProgressFill,
                    { width: `${countdownTime.progress * 100}%` }
                  ]} 
                />
              </View>
              <Ionicons name="chevron-up" size={20} color={theme.colors.text.secondary} />
            </View>
          </View>
        ) : (
          // Expanded State - Full Details
          <>
            <View style={styles.countdownTopRow}>
              <View style={styles.countdownEventInfo}>
                <Text style={styles.countdownEventLabel}>Dinner at</Text>
                <Text style={styles.countdownEventName}>
                  {reservation.dinner_group?.restaurant_name || 'Restaurant'}
                </Text>
                <Text style={styles.countdownEventTime}>
                  {_formatDayOfWeek()}, {_formatTime()}
                </Text>
              </View>
              <View style={styles.countdownTimeContainer}>
                <View style={styles.countdownTimeBox}>
                  <Text style={styles.countdownTimeNumber}>
                    {countdownTime.hours.toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownTimeLabel}>HR</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={styles.countdownTimeBox}>
                  <Text style={styles.countdownTimeNumber}>
                    {countdownTime.minutes.toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownTimeLabel}>MIN</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={styles.countdownTimeBox}>
                  <Text style={styles.countdownTimeNumber}>
                    {countdownTime.seconds.toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownTimeLabel}>SEC</Text>
                </View>
              </View>
              <Pressable style={styles.collapseButton}>
                <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>
            {/* Progress Bar */}
            <View style={styles.countdownProgress}>
              <View style={styles.countdownProgressBar}>
                <View 
                  style={[
                    styles.countdownProgressFill,
                    { width: `${countdownTime.progress * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.countdownProgressText}>
                {(() => {
                  if (countdownTime.totalSeconds > 0 && countdownTime.totalSeconds < 3600) {
                    return '🎉 Almost time!';
                  } else if (countdownTime.totalSeconds > 0) {
                    return `${Math.round((1 - countdownTime.progress) * 100)}% time remaining`;
                  } else {
                    return 'Time to dine!';
                  }
                })()}
              </Text>
            </View>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(20),
  },
  backButton: {
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(8),
  },
  backButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    backgroundColor: theme.colors.white,
    position: 'relative',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  closeButton: {
    position: 'absolute',
    right: scaleWidth(20),
    padding: scaleWidth(4),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gray[100],
  },
  activeTab: {
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary.main,
  },
  content: {
    flex: 1,
    paddingBottom: scaleHeight(140), // Space for expanded countdown timer
  },
  contentCollapsed: {
    paddingBottom: scaleHeight(60), // Less space for collapsed countdown
  },
  tabContent: {
    padding: scaleWidth(20),
    paddingBottom: scaleHeight(20),
  },
  restaurantCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(20),
    shadowColor: theme.colors.black[1],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  restaurantCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  restaurantImageSmall: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(12),
    backgroundColor: theme.colors.state.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
    overflow: 'hidden',
  },
  restaurantThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(12),
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantCardName: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(4),
  },
  restaurantRating: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.warning.main,
    marginBottom: scaleHeight(8),
  },
  restaurantTagline: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(6),
  },
  restaurantDescription: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(18),
  },
  sectionsContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
    marginBottom: scaleHeight(80), // Add space for countdown
  },
  historyColumn: {
    flex: 0.4, // Narrower history column
  },
  recommendationColumn: {
    flex: 0.6, // Wider recommendation column
  },
  sectionHeader: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(12),
  },
  historyList: {
    gap: scaleHeight(8),
  },
  emptyHistoryItem: {
    height: scaleHeight(60),
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginBottom: scaleHeight(8),
  },
  historyItem: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(10),
    marginBottom: scaleHeight(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  historyItemTitle: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(2),
  },
  historyItemText: {
    fontSize: scaleFont(10),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(14),
  },
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recommendationItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    overflow: 'hidden',
    marginBottom: scaleHeight(8),
  },
  recommendationImage: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  recommendationText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    paddingVertical: scaleHeight(6),
    backgroundColor: theme.colors.white,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
  },
  countdownContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    padding: scaleWidth(20),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(34) : scaleHeight(20),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    shadowColor: theme.colors.black[1],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  countdownContainerCollapsed: {
    paddingVertical: scaleHeight(12),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(28) : scaleHeight(12),
  },
  countdownCollapsedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownCollapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  countdownCollapsedText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  countdownCollapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  miniProgressBar: {
    width: scaleWidth(60),
    height: scaleHeight(4),
    backgroundColor: theme.colors.gray[100],
    borderRadius: scaleWidth(2),
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(2),
  },
  collapseButton: {
    padding: scaleWidth(4),
  },
  countdownTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
  },
  countdownEventInfo: {
    flex: 1,
  },
  countdownEventLabel: {
    fontSize: scaleFont(12),
    color: theme.colors.text.tertiary,
    marginBottom: scaleHeight(4),
  },
  countdownEventName: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(2),
  },
  countdownEventTime: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
  },
  countdownTimeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.gray[50],
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  countdownTimeBox: {
    alignItems: 'center',
  },
  countdownTimeNumber: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: theme.colors.primary.main,
    lineHeight: scaleFont(28),
  },
  countdownTimeLabel: {
    fontSize: scaleFont(10),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(2),
  },
  countdownSeparator: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.primary.main,
    marginHorizontal: scaleWidth(8),
  },
  countdownProgress: {
    width: '100%',
  },
  countdownProgressBar: {
    height: scaleHeight(4),
    backgroundColor: theme.colors.gray[100],
    borderRadius: scaleWidth(2),
    overflow: 'hidden',
    marginBottom: scaleHeight(8),
  },
  countdownProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(2),
  },
  countdownProgressText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: scaleWidth(16),
    marginBottom: scaleHeight(24),
  },
  halfSection: {
    flex: 1,
  },
  matchedSection: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
  },
  matchedTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: scaleHeight(12),
  },
  matchedIcon: {
    fontSize: scaleFont(16),
    color: theme.colors.white,
  },
  matchedText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    fontWeight: '500',
  },
  insightsList: {
    gap: scaleHeight(10),
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  funFactsTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.primary.main,
    marginBottom: scaleHeight(12),
  },
  funFactsList: {
    gap: scaleHeight(10),
  },
  funFactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(10),
  },
  funFactIcon: {
    fontSize: scaleFont(16),
  },
  funFactText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(18),
  },
  groupMembersSection: {
    marginBottom: scaleHeight(24),
  },
  groupMembersTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: theme.colors.primary.main,
    marginBottom: scaleHeight(16),
  },
  membersList: {
    gap: scaleHeight(12),
  },
  memberCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(12),
    shadowColor: theme.colors.black[1],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserCard: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary.light,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    marginRight: scaleWidth(12),
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  memberName: {
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  currentUserName: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  memberStatus: {
    fontSize: scaleFont(12),
    color: theme.colors.text.tertiary,
    marginTop: scaleHeight(2),
  },
  youBadge: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(8),
  },
  youBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    color: theme.colors.white,
  },
  memberExpandedContent: {
    marginTop: scaleHeight(16),
    paddingTop: scaleHeight(16),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  memberDetailSection: {
    marginBottom: scaleHeight(12),
  },
  memberDetailLabel: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: scaleHeight(6),
  },
  memberDetailText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(6),
  },
  interestTag: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
  },
  interestTagText: {
    fontSize: scaleFont(12),
    color: theme.colors.primary.main,
  },
  memberActionButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginTop: scaleHeight(16),
    paddingTop: scaleHeight(16),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  memberActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(10),
    gap: scaleWidth(6),
  },
  messageButton: {
    backgroundColor: theme.colors.primary.main,
  },
  messageButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: theme.colors.white,
  },
  viewProfileButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
    gap: scaleWidth(8),
    marginBottom: scaleHeight(24),
  },
  chatButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.white,
  },
  tipsSection: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
  },
  tipItem: {
    flexDirection: 'row',
    marginTop: scaleHeight(8),
  },
  tipBullet: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginRight: scaleWidth(8),
  },
  tipText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(20),
  },
  tipTextBold: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusButtonsContainer: {
    position: 'absolute',
    bottom: scaleHeight(140), // Above countdown timer
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    padding: scaleWidth(16),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    shadowColor: theme.colors.black[1],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    justifyContent: 'center',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(8),
    minHeight: scaleHeight(48),
  },
  checkInButton: {
    backgroundColor: theme.colors.primary.main,
  },
  statusButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.white,
  },
  statusCompletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(12),
  },
  statusCompletedText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.success.main,
  },
  statusAttendedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(12),
  },
  statusAttendedText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.success.main,
  },
  statusAssignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(12),
  },
  statusAssignedText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(20),
    backgroundColor: theme.colors.primary[50],
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  assignedText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  autoCompleteText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(4),
  },
  // Details coming soon styles
  comingSoonContainer: {
    padding: scaleWidth(20),
  },
  countdownCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(20),
    marginBottom: scaleHeight(16),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  countdownTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  countdownSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: scaleHeight(24),
  },
  countdownDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  countdownBox: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: scaleFont(36),
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  countdownLabel: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(4),
  },
  countdownInfo: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(8),
  },
  statusTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#2E7D32',
  },
  statusDescription: {
    fontSize: scaleFont(14),
    color: '#2E7D32',
    opacity: 0.8,
  },
  expectCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
  },
  expectTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(16),
  },
  expectItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  expectText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    lineHeight: scaleFont(20),
  },
  funFactCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
});