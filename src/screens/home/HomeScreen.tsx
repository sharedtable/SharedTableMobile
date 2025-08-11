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
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { EventCard } from '@/components/home/EventCard';
import { InviteFriendsSection } from '@/components/home/InviteFriendsSection';
import { BottomTabBar, TabName } from '@/components/navigation/BottomTabBar';
import { Icon } from '@/components/base/Icon';

interface HomeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

const regularDinners = [
  { id: '1', date: 'Tuesday, August 12', time: '7:00 PM' },
  { id: '2', date: 'Tuesday, August 12', time: '7:00 PM' },
  { id: '3', date: 'Tuesday, August 12', time: '7:00 PM' },
];

const singlesDinners = [
  { id: '4', date: 'Tuesday, August 12', time: '7:00 PM' },
];

export const HomeScreen: React.FC<HomeScreenProps> = () => {
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
    setActiveTab(tab);
    // Handle navigation to different tabs
    if (tab !== 'home') {
      console.log('Navigate to:', tab);
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
            <Pressable style={styles.footerLink}>
              <Text style={styles.footerLinkText}>How it works</Text>
            </Pressable>
            <Pressable style={styles.footerLink}>
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
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: scaleHeight(240),
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    marginTop: -scaleHeight(30),
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    minHeight: scaleHeight(600),
    paddingTop: scaleHeight(24),
  },
  titleSection: {
    paddingHorizontal: scaleWidth(24),
    marginBottom: scaleHeight(24),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(16),
  },
  locationText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginLeft: scaleWidth(4),
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  heroTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  heroSubtitle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
  },
  eventsSection: {
    paddingHorizontal: scaleWidth(24),
  },
  eventCategory: {
    marginBottom: scaleHeight(24),
  },
  categoryTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: scaleHeight(16),
  },
  grabSpotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(24),
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(24),
    marginTop: scaleHeight(8),
  },
  grabSpotText: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    marginRight: scaleWidth(8),
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(80),
    paddingVertical: scaleHeight(32),
    paddingHorizontal: scaleWidth(24),
  },
  footerLink: {
    paddingVertical: scaleHeight(4),
  },
  footerLinkText: {
    fontSize: scaleFont(14),
    fontWeight: '500' as any,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
});