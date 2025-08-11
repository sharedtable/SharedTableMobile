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
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { EventCard } from '@/components/home/EventCard';
import { InviteFriendsSection } from '@/components/home/InviteFriendsSection';
import { BottomTabBar, TabName } from '@/components/navigation/BottomTabBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface HomeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

const regularDinners = [
  { id: '1', date: 'Tuesday, August 12', time: '7:00 PM' },
  { id: '2', date: 'Tuesday, August 12', time: '7:00 PM' },
  { id: '3', date: 'Tuesday, August 12', time: '7:00 PM' },
];

const singlesDinners = [{ id: '4', date: 'Tuesday, August 12', time: '7:00 PM' }];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<TabName>('home');

  const handleGrabSpot = () => {
    // Navigate to booking or payment
    console.log('Grab a spot for event:', selectedEvent);
  };

  const handleInviteFriend = (email: string) => {
    console.log('Inviting friend:', email);
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'dashboard') {
      onNavigate?.('dashboard');
    } else if (tab === 'profile') {
      onNavigate?.('profile');
    } else if (tab !== 'home') {
      setActiveTab(tab);
      console.log('Navigate to:', tab);
    } else {
      setActiveTab(tab);
    }
  };

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

            {/* Events Section */}
            <View style={styles.eventsSection}>
              {/* Regular Dinners */}
              <View style={styles.eventCategory}>
                <Text style={styles.categoryTitle}>Regular Dinners</Text>
                {regularDinners.map((dinner) => (
                  <EventCard
                    key={dinner.id}
                    date={dinner.date}
                    time={dinner.time}
                    isSelected={selectedEvent === dinner.id}
                    onPress={() => setSelectedEvent(dinner.id)}
                  />
                ))}
              </View>

              {/* Singles Dinners */}
              <View style={styles.eventCategory}>
                <Text style={styles.categoryTitle}>Singles Dinners</Text>
                {singlesDinners.map((dinner) => (
                  <EventCard
                    key={dinner.id}
                    date={dinner.date}
                    time={dinner.time}
                    isSelected={selectedEvent === dinner.id}
                    onPress={() => setSelectedEvent(dinner.id)}
                    disabled={true}
                  />
                ))}
              </View>

              {/* Grab a Spot Button */}
              <Pressable style={styles.grabSpotButton} onPress={handleGrabSpot}>
                <Text style={styles.grabSpotText}>Grab a Spot</Text>
                <Icon name="chevron-right" size={20} color={theme.colors.white} />
              </Pressable>
            </View>

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

            {/* Bottom Padding for Tab Bar */}
            <View style={{ height: scaleHeight(100) }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
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
  keyboardView: {
    flex: 1,
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
