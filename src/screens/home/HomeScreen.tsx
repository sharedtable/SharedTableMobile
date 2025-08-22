import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { EventCard } from '@/components/home/EventCard';
import { InviteFriendsSection } from '@/components/home/InviteFriendsSection';
// Removed BottomTabBar - now using React Navigation's tab bar
import { useEvents } from '@/hooks/useEvents';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface HomeScreenProps {
  navigation?: any;
  route?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation: _navigation,
  route: _route,
  onNavigate: _onNavigate,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Use events hook for real data
  const { regularDinners, singlesDinners, loading, error, refreshing, refreshEvents, bookEvent } =
    useEvents();

  // Select first available event by default
  React.useEffect(() => {
    if (!selectedEvent && regularDinners.length > 0) {
      setSelectedEvent(regularDinners[0].id);
    } else if (!selectedEvent && singlesDinners.length > 0) {
      setSelectedEvent(singlesDinners[0].id);
    }
  }, [regularDinners, singlesDinners, selectedEvent]);

  const handleGrabSpot = async () => {
    if (!selectedEvent) {
      Alert.alert('No Event Selected', 'Please select an event first.');
      return;
    }

    // Find the selected event to check if it's bookable
    const event = [...regularDinners, ...singlesDinners].find((e) => e.id === selectedEvent);

    if (!event) {
      Alert.alert('Error', 'Selected event not found.');
      return;
    }

    if (!event.canBook) {
      let message = 'This event is not available for booking.';
      if (event.isFullyBooked) {
        message = 'This event is fully booked.';
      } else if (event.status !== 'published') {
        message = 'This event is not yet open for booking.';
      }

      Alert.alert('Cannot Book Event', message);
      return;
    }

    try {
      setBookingLoading(true);
      const result = await bookEvent(selectedEvent);

      if (result.success) {
        Alert.alert('Booking Successful! 🎉', result.message, [{ text: 'OK', style: 'default' }]);
      } else {
        Alert.alert('Booking Failed', result.message, [
          { text: 'OK', style: 'default' },
          ...(result.waitlisted
            ? [
                {
                  text: 'Join Waitlist',
                  style: 'default' as const,
                  onPress: () => console.log('Join waitlist'),
                },
              ]
            : []),
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('❌ [HomeScreen] Booking error:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleInviteFriend = (email: string) => {
    console.log('Inviting friend:', email);
  };

  // Navigation is now handled by React Navigation's tab bar

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

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
              source={require('@/assets/images/backgrounds/background.jpg')}
              style={styles.heroImage}
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
                <Text style={styles.loadingText}>Loading events...</Text>
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

            {/* Events Section */}
            {!loading && !error && (
              <View style={styles.eventsSection}>
                {/* Regular Dinners */}
                {regularDinners.length > 0 && (
                  <View style={styles.eventCategory}>
                    <Text style={styles.categoryTitle}>Regular Dinners</Text>
                    {regularDinners.map((event) => {
                      return (
                        <EventCard
                          key={event.id}
                          date={event.formattedDate}
                          time={event.formattedTime}
                          isSelected={selectedEvent === event.id}
                          onPress={() => {
                            console.log(
                              '🔸 [HomeScreen] Selecting regular dinner:',
                              event.title,
                              event.id
                            );
                            setSelectedEvent(event.id);
                          }}
                          disabled={false}
                        />
                      );
                    })}
                  </View>
                )}

                {/* Singles Dinners */}
                {singlesDinners.length > 0 && (
                  <View style={styles.eventCategory}>
                    <Text style={styles.categoryTitle}>Singles Dinners</Text>
                    {singlesDinners.map((event) => {
                      return (
                        <EventCard
                          key={event.id}
                          date={event.formattedDate}
                          time={event.formattedTime}
                          isSelected={selectedEvent === event.id}
                          onPress={() => {
                            console.log(
                              '🔸 [HomeScreen] Selecting singles dinner:',
                              event.title,
                              event.id
                            );
                            setSelectedEvent(event.id);
                          }}
                          disabled={false}
                        />
                      );
                    })}
                  </View>
                )}

                {/* No Events State */}
                {regularDinners.length === 0 && singlesDinners.length === 0 && (
                  <View style={styles.noEventsContainer}>
                    <Text style={styles.noEventsText}>No events available</Text>
                    <Text style={styles.noEventsSubtext}>
                      Check back later for new dining experiences!
                    </Text>
                  </View>
                )}

                {/* Grab a Spot Button */}
                {(regularDinners.length > 0 || singlesDinners.length > 0) && (
                  <Pressable
                    style={[
                      styles.grabSpotButton,
                      (!selectedEvent || bookingLoading) && styles.grabSpotButtonDisabled,
                    ]}
                    onPress={handleGrabSpot}
                    disabled={!selectedEvent || bookingLoading}
                  >
                    {bookingLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <>
                        {selectedEvent ? (
                          (() => {
                            const event = [...regularDinners, ...singlesDinners].find(
                              (e) => e.id === selectedEvent
                            );
                            return (
                              <Text style={styles.grabSpotText}>
                                {event?.canBook ? 'Grab a Spot' : 'View Event Details'}
                              </Text>
                            );
                          })()
                        ) : (
                          <Text style={styles.grabSpotText}>Select an Event</Text>
                        )}
                        <Icon name="chevron-right" size={20} color={theme.colors.white} />
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            {/* Invite Friends Section */}
            <InviteFriendsSection onInvite={handleInviteFriend} />

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <Pressable style={styles.footerLink} onPress={() => onNavigate?.('how-it-works')}>
                <Text style={styles.footerLinkText}>How it works</Text>
              </Pressable>
              <Pressable style={styles.footerLink} onPress={() => onNavigate?.('faqs')}>
                <Text style={styles.footerLinkText}>FAQs</Text>
              </Pressable>
            </View>

            {/* Bottom Padding */}
            <View style={{ height: scaleHeight(20) }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar removed - using React Navigation's tab bar */}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryTitle: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(16),
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
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
    fontWeight: '600' as any,
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  eventCategory: {
    marginBottom: scaleHeight(24),
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
    fontWeight: '500' as any,
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
    fontWeight: '600' as any,
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
    fontWeight: '700' as any,
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
    fontWeight: '600' as any,
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
    fontWeight: '600' as any,
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
});
