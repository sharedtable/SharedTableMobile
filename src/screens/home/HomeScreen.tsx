import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageStyle,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { Icon } from '@/components/base/Icon';
import { InviteFriendsSection } from '@/components/home/InviteFriendsSection';
import { TopBar } from '@/components/navigation/TopBar';
import { OptionalOnboardingPrompt } from '@/components/OptionalOnboardingPrompt';
// Removed BottomTabBar - now using React Navigation's tab bar
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useNotificationStore } from '@/store/notificationStore';
import { usePaymentStore } from '@/store/paymentStore';
import { CheckoutModal } from '@/components/payment/CheckoutModal';

// Images
// eslint-disable-next-line @typescript-eslint/no-require-imports
const backgroundImage = require('@/assets/images/backgrounds/background.jpg');

interface TimeSlot {
  id: string;
  datetime: string; // ISO string with date and time
  max_signups: number;
  current_signups: number;
  status: string;
  dinner_type?: 'regular' | 'singles';
  created_at?: string;
  updated_at?: string;
}

interface Signup {
  id: string;
  dinner_id: string;
  status: string;
  dinner?: TimeSlot;
}

// Define proper navigation types
type RootStackParamList = {
  Home: undefined;
  EventDetails: { eventId: string };
  Profile: undefined;
  NotificationsList: undefined;
  // Add other screens as needed
};

interface HomeScreenProps {
  navigation?: NavigationProp<RootStackParamList>;
  route?: RouteProp<RootStackParamList, 'Home'>;
  onNavigate?: (screen: string, data?: unknown) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = React.memo(({
  navigation: _navigation,
  route: _route,
  onNavigate: _onNavigate,
}) => {
  const { user } = usePrivyAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { 
    initializePayments
  } = usePaymentStore();
  const [selectedDinner, setSelectedDinner] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [mySignups, setMySignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const hasInitialLoadRef = useRef(false);
  
  const handleNotificationPress = () => {
    navigation.navigate('NotificationsList');
  };

  // Fetch available time slots and user's signups with debouncing and retry logic
  const fetchData = useCallback(async (isRefreshing = false, retryCount = 0) => {
    // Implement rate limiting protection
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const MIN_FETCH_INTERVAL = 2000; // Minimum 2 seconds between fetches
    
    if (!isRefreshing && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log('⏳ [HomeScreen] Throttling request, too soon since last fetch');
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('⚠️ [HomeScreen] Already fetching, skipping...');
      return;
    }
    
    if (__DEV__) {
      console.log('🔄 [HomeScreen] fetchData called, isRefreshing:', isRefreshing, 'retryCount:', retryCount);
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (retryCount === 0) {
        setLoading(true);
      }
      setError(null);

      // Fetch available time slots
      if (__DEV__) {
        console.log('📍 [HomeScreen] Fetching time slots...');
      }
      const slotsResponse = await api.getAvailableDinners();
      if (__DEV__) {
        console.log('✅ [HomeScreen] Time slots response:', slotsResponse.success, slotsResponse.data?.length);
      }
      
      if (slotsResponse.success && slotsResponse.data) {
        setTimeSlots(slotsResponse.data);
        retryCountRef.current = 0; // Reset retry count on success
        
        // Select first available slot by default
        if (!selectedDinner && slotsResponse.data.length > 0) {
          setSelectedDinner(slotsResponse.data[0].id);
        }
      }

      // Fetch user's signups - don't let this fail the whole request
      if (user) {
        try {
          const signupsResponse = await api.getMySignups();
          if (signupsResponse.success && signupsResponse.data) {
            setMySignups(signupsResponse.data);
          }
        } catch (signupErr) {
          if (__DEV__) {
            console.warn('Failed to fetch user signups:', signupErr);
          }
          // Don't fail the whole request, just set empty signups
          setMySignups([]);
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.error('Error fetching data:', err);
      }
      
      // Handle rate limiting with exponential backoff
      if ((err as any)?.response?.status === 429 && retryCount < 3) {
        const retryDelay = Math.min(Math.pow(2, retryCount) * 3000, 30000); // Max 30s
        if (__DEV__) {
          console.log(`⏰ [HomeScreen] Rate limited, retrying in ${retryDelay}ms...`);
        }
        
        retryCountRef.current = retryCount + 1;
        const timeoutId = setTimeout(() => {
          fetchData(false, retryCount + 1);
        }, retryDelay);
        
        // Store timeout ID for cleanup
        return () => clearTimeout(timeoutId);
      } else {
        // Provide user-friendly error messages
        let errorMessage = 'Failed to load available times';
        if ((err as any)?.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if ((err as any)?.response?.status === 404) {
          errorMessage = 'Service not found. Please contact support.';
        } else if ((err as any)?.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        setError(errorMessage);
        setTimeSlots([]); // Set empty array on error
        retryCountRef.current = 0;
      }
    } finally {
      if (__DEV__) {
        console.log('🏁 [HomeScreen] fetchData complete');
      }
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Only fetch data once on mount
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      fetchData();
      loadNotifications();
      // Initialize payment methods if user is logged in
      if (user) {
        initializePayments();
      }
    }
  }, [fetchData, user, initializePayments, loadNotifications]);

  const refreshEvents = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const isSignedUp = useCallback((dinnerId: string) => {
    return mySignups.some(
      signup => signup.dinner_id === dinnerId && signup.status !== 'cancelled'
    );
  }, [mySignups]);

  const formatDateTime = useCallback((isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        console.error('Invalid datetime string:', isoString);
        return { date: 'Invalid date', time: 'Invalid time', dayOfWeek: '' };
      }
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}`;
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      let displayHour = hours;
      if (hours > 12) {
        displayHour = hours - 12;
      } else if (hours === 0) {
        displayHour = 12;
      }
      const displayMinute = minutes.toString().padStart(2, '0');
      const timeStr = `${displayHour}:${displayMinute} ${period}`;
      
      return { date: dateStr, time: timeStr, dayOfWeek };
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return { date: 'Invalid date', time: 'Invalid time', dayOfWeek: '' };
    }
  }, []);

  // Keep the old functions for backward compatibility if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Invalid date';
    try {
      // Try to handle both old format (YYYY-MM-DD) and new format (ISO datetime)
      if (dateString.includes('T')) {
        // ISO datetime format
        const { date } = formatDateTime(dateString);
        return date;
      } else {
        // Old YYYY-MM-DD format
        const [_year, month, day] = dateString.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, [formatDateTime]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTime = useCallback((timeString: string) => {
    if (!timeString) return 'Invalid time';
    try {
      // Try to handle both old format (HH:MM:SS) and new format (ISO datetime)
      if (timeString.includes('T')) {
        // ISO datetime format
        const { time } = formatDateTime(timeString);
        return time;
      } else {
        // Old HH:MM:SS format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (isNaN(hour) || isNaN(minute)) {
          console.error('Invalid time string:', timeString);
          return 'Invalid time';
        }
        
        const period = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour;
        if (hour > 12) {
          displayHour = hour - 12;
        } else if (hour === 0) {
          displayHour = 12;
        }
        const displayMinute = minute.toString().padStart(2, '0');
        
        return `${displayHour}:${displayMinute} ${period}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  }, [formatDateTime]);

  const handleGrabSpot = async () => {
    if (!selectedDinner) {
      Alert.alert('No Time Selected', 'Please select a time slot first.');
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please log in to sign up for dinner times.');
      return;
    }

    // Check if already signed up
    if (isSignedUp(selectedDinner)) {
      Alert.alert('Already Signed Up', 'You have already signed up for this time slot.');
      return;
    }

    // Find the selected time slot
    const dinner = timeSlots.find((slot) => slot.id === selectedDinner);
    if (!dinner) {
      Alert.alert('Error', 'Selected dinner not found.');
      return;
    }

    // Open checkout modal for payment and booking
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = useCallback(async (paymentMethodId: string, shouldSave: boolean) => {
    if (!selectedDinner) return;
    
    try {
      setBookingLoading(true);
      setShowCheckoutModal(false);
      
      // Get dinner details for display
      const dinner = timeSlots.find((slot) => slot.id === selectedDinner);
      if (!dinner) {
        Alert.alert('Error', 'Selected dinner not found.');
        return;
      }
      
      // Call the new unified booking endpoint
      const response = await api.createBookingWithPayment({
        dinnerId: selectedDinner,
        paymentMethodId,
        savePaymentMethod: shouldSave,
      });

      if (response.success) {
        const { dayOfWeek, date, time } = formatDateTime(dinner.datetime);
        Alert.alert(
          'Success! 🎉',
          `You're confirmed for ${dayOfWeek}, ${date} at ${time}.\n\nA $30 hold has been placed on your card and will be released after you attend.`
        );
        
        // Refresh payment methods if a new card was saved
        if (shouldSave) {
          await initializePayments();
        }
        
        // Add a small delay before refreshing to avoid rate limiting
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        Alert.alert('Booking Failed', response.error || 'Failed to complete booking. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      if (__DEV__) {
        console.error('❌ [HomeScreen] Booking error:', error);
      }
    } finally {
      setBookingLoading(false);
    }
  }, [selectedDinner, timeSlots, formatDateTime, fetchData, initializePayments]);

  const handleCheckoutCancel = useCallback(() => {
    setShowCheckoutModal(false);
  }, []);

  const handleInviteFriend = useCallback((email: string) => {
    // TODO: Implement invite friend functionality
    if (__DEV__) {
      console.log('Inviting friend:', email);
    }
  }, []);

  // Navigation is now handled by React Navigation's tab bar

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Optional Onboarding Prompt */}
      <OptionalOnboardingPrompt />
      
      {/* Top Bar with Notifications */}
      <TopBar
        title="Home"
        showNotification
        notificationCount={unreadCount}
        onNotification={handleNotificationPress}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshEvents} />}
        >
          {/* Hero Section with Background */}
          <View style={styles.heroSection}>
            <Image
              source={backgroundImage}
              style={styles.heroImage as ImageStyle}
            />
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.locationContainer}>
                <Icon name="map-pin" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.locationText}>SAN FRANCISCO</Text>
              </View>
              <Text style={styles.heroTitle}>BOOK YOUR NEXT CULINARY JOURNEY</Text>
              <Text style={styles.heroSubtitle}>MEET BETTER. EAT BETTER.</Text>
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
                <Text style={styles.loadingText}>Loading available times...</Text>
              </View>
            )}

            {/* Error State */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load events</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={refreshEvents}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            )}

            {/* Time Slots Section */}
            {!loading && !error && (
              <View style={styles.eventsSection}>
                {/* Group time slots by dinner type */}
                {(() => {
                  const regularSlots = timeSlots.filter(slot => slot.dinner_type !== 'singles');
                  const singlesSlots = timeSlots.filter(slot => slot.dinner_type === 'singles');
                  
                  return (
                    <>
                      {/* Regular Dinners Section */}
                      {regularSlots.length > 0 && (
                        <>
                          <Text style={styles.categoryTitle}>Regular Dinners</Text>
                          {regularSlots.map((slot) => {
                            const signedUp = isSignedUp(slot.id);
                            const isSelected = selectedDinner === slot.id;
                            return (
                              <Pressable
                                key={slot.id}
                                style={[
                                  styles.timeSlotCard,
                                  isSelected && styles.timeSlotCardSelected,
                                  signedUp && styles.timeSlotCardSignedUp,
                                ]}
                                onPress={() => !signedUp && setSelectedDinner(slot.id)}
                                disabled={signedUp}
                              >
                                <View style={styles.slotContent}>
                                  <Text style={[
                                    styles.slotMainText,
                                    isSelected && styles.slotMainTextSelected,
                                    signedUp && styles.slotTextSignedUp,
                                  ]}>
                                    {(() => {
                                      const { dayOfWeek, date, time } = formatDateTime(slot.datetime);
                                      return `${dayOfWeek}, ${date} ${time}`;
                                    })()}
                                  </Text>
                                </View>
                                
                                {signedUp ? (
                                  <View style={styles.checkmarkContainer}>
                                    <Ionicons 
                                      name="checkmark-circle" 
                                      size={24} 
                                      color={theme.colors.success?.main || '#4CAF50'} 
                                    />
                                  </View>
                                ) : (
                                  <View
                                    style={[
                                      styles.selectionCircle,
                                      isSelected && styles.selectionCircleSelected,
                                    ]}
                                  />
                                )}
                              </Pressable>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Singles Dinners Section */}
                      {singlesSlots.length > 0 && (
                        <>
                          <Text style={[styles.categoryTitle, regularSlots.length > 0 && styles.categoryTitleWithMargin]}>
                            Singles Dinners
                          </Text>
                          {singlesSlots.map((slot) => {
                            const signedUp = isSignedUp(slot.id);
                            const isSelected = selectedDinner === slot.id;
                            return (
                              <Pressable
                                key={slot.id}
                                style={[
                                  styles.timeSlotCard,
                                  isSelected && styles.timeSlotCardSelected,
                                  signedUp && styles.timeSlotCardSignedUp,
                                ]}
                                onPress={() => !signedUp && setSelectedDinner(slot.id)}
                                disabled={signedUp}
                              >
                                <View style={styles.slotContent}>
                                  <Text style={[
                                    styles.slotMainText,
                                    isSelected && styles.slotMainTextSelected,
                                    signedUp && styles.slotTextSignedUp,
                                  ]}>
                                    {(() => {
                                      const { dayOfWeek, date, time } = formatDateTime(slot.datetime);
                                      return `${dayOfWeek}, ${date} ${time}`;
                                    })()}
                                  </Text>
                                </View>
                                
                                {signedUp ? (
                                  <View style={styles.checkmarkContainer}>
                                    <Ionicons 
                                      name="checkmark-circle" 
                                      size={24} 
                                      color={theme.colors.success?.main || '#4CAF50'} 
                                    />
                                  </View>
                                ) : (
                                  <View
                                    style={[
                                      styles.selectionCircle,
                                      isSelected && styles.selectionCircleSelected,
                                    ]}
                                  />
                                )}
                              </Pressable>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
                
                {/* Available Time Slots */}
                {timeSlots.length > 0 ? (
                  <>
                    {/* Sign Up Button */}
                    <Pressable
                      style={[
                        styles.grabSpotButton,
                        (!selectedDinner || bookingLoading || !user) && styles.grabSpotButtonDisabled,
                      ]}
                      onPress={handleGrabSpot}
                      disabled={!selectedDinner || bookingLoading || !user}
                    >
                      {bookingLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                      ) : (
                        <>
                          <Text style={styles.grabSpotText}>
                            {(() => {
                              if (!user) return 'Login to Sign Up';
                              if (selectedDinner && isSignedUp(selectedDinner)) return 'Already Signed Up';
                              return 'Sign Up for Dinner';
                            })()}
                          </Text>
                          <Icon name="chevron-right" size={20} color={theme.colors.white} />
                        </>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.noEventsContainer}>
                    <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.noEventsText}>No dinner times available</Text>
                    <Text style={styles.noEventsSubtext}>
                      Check back later for new dinner times!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Invite Friends Section */}
            <InviteFriendsSection onInvite={handleInviteFriend} />

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <Pressable 
                style={styles.footerLink} 
                onPress={() => _onNavigate?.('how-it-works')}
                accessible={true}
                accessibilityRole="link"
                accessibilityLabel="Learn how SharedTable works"
              >
                <Text style={styles.footerLinkText}>How it works</Text>
              </Pressable>
              <Pressable 
                style={styles.footerLink} 
                onPress={() => _onNavigate?.('faqs')}
                accessible={true}
                accessibilityRole="link"
                accessibilityLabel="Frequently asked questions"
              >
                <Text style={styles.footerLinkText}>FAQs</Text>
              </Pressable>
            </View>

            {/* Bottom Padding */}
            <View style={{ height: scaleHeight(20) }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar removed - using React Navigation's tab bar */}
      
      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckoutModal}
        amount={3000} // Fixed $30 hold amount
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        loading={bookingLoading}
      />
    </View>
  );
});

HomeScreen.displayName = 'HomeScreen';

const styles = StyleSheet.create({
  categoryTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scaleHeight(16),
    letterSpacing: 0.5,
  },
  categoryTitleWithMargin: {
    marginTop: scaleHeight(24),
  },
  container: {
    backgroundColor: theme.colors.background?.paper || '#F9F9F9',
    flex: 1,
  },
  contentCard: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    marginTop: -scaleHeight(30),
    minHeight: scaleHeight(600),
    paddingTop: scaleHeight(24),
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(40),
  },
  errorSubtext: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(24),
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  eventsSection: {
    paddingHorizontal: scaleWidth(24),
  },
  footerLink: {
    paddingVertical: scaleHeight(4),
  },
  footerLinkText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: scaleWidth(80),
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(32),
  },
  grabSpotButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(24),
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(14),
  },
  grabSpotButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
    opacity: 0.6,
  },
  grabSpotText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginRight: scaleWidth(8),
  },
  heroImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  heroSection: {
    height: scaleHeight(240),
    position: 'relative',
  },
  heroSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  // Loading & Error States
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(60),
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginTop: scaleHeight(16),
  },
  locationContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  locationText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    letterSpacing: 0.5,
    marginLeft: scaleWidth(4),
    textDecorationLine: 'underline',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(60),
  },
  noEventsSubtext: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
  noEventsText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(12),
  },
  retryButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(24),
  },
  // Time slot styles
  timeSlotCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(30),
    marginBottom: scaleHeight(12),
    paddingVertical: scaleHeight(20),
    paddingHorizontal: scaleWidth(20),
    borderTopWidth: 1,
    borderBottomWidth: 3,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: theme.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotCardSelected: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.primary.main,
  },
  timeSlotCardSignedUp: {
    opacity: 0.7,
    backgroundColor: theme.colors.background?.paper || '#F9F9F9',
    borderColor: theme.colors.gray[200],
  },
  slotContent: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  slotMainText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  slotMainTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  slotTextSignedUp: {
    color: theme.colors.text.secondary,
  },
  checkmarkContainer: {
    marginLeft: scaleWidth(8),
  },
  selectionCircle: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  selectionCircleSelected: {
    backgroundColor: theme.colors.text.secondary,
    borderColor: theme.colors.text.secondary,
  },
});
