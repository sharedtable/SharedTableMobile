import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, StatusBar } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { BottomTabBar, TabName } from '@/components/navigation/BottomTabBar';
import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface ProfileScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

type ProfileTab = 'reservations' | 'connections';

interface Reservation {
  id: string;
  name: string;
  date: string;
  time: string;
  status: 'live' | 'past';
}

interface Connection {
  id: string;
  name: string;
  avatar: string;
  rating: number;
}

const mockReservations: Reservation[] = [
  { id: '1', name: 'Sotto Mare', date: '2024-02-15', time: '7:00 PM', status: 'live' },
  { id: '2', name: 'Laze Bear', date: '2024-02-15', time: '7:00 PM', status: 'live' },
];

const mockConnections: Connection[] = [
  { id: '1', name: 'Sotto Mare', avatar: 'https://i.pravatar.cc/150?img=1', rating: 4.5 },
  { id: '2', name: 'Sotto Mare', avatar: 'https://i.pravatar.cc/150?img=2', rating: 4.5 },
  { id: '3', name: 'Sotto Mare', avatar: 'https://i.pravatar.cc/150?img=3', rating: 4.5 },
  { id: '4', name: 'Sotto Mare', avatar: 'https://i.pravatar.cc/150?img=4', rating: 4.5 },
  { id: '5', name: 'Sotto Mare', avatar: 'https://i.pravatar.cc/150?img=5', rating: 4.5 },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('reservations');
  const [activeNavTab, setActiveNavTab] = useState<TabName>('profile');

  const handleTabPress = (tab: TabName) => {
    if (tab === 'home') {
      onNavigate?.('home');
    } else if (tab === 'dashboard') {
      onNavigate?.('dashboard');
    } else if (tab !== 'profile') {
      setActiveNavTab(tab);
      console.log('Navigate to:', tab);
    } else {
      setActiveNavTab(tab);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reservations':
        return (
          <>
            {/* Next Reservation Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Next Reservation</Text>
                <View style={styles.smileyIcon}>
                  <Text style={styles.smileyEmoji}>😊</Text>
                </View>
              </View>

              {mockReservations.map((reservation) => (
                <View key={reservation.id} style={styles.reservationItem}>
                  <View style={styles.restaurantIcon}>
                    <View style={styles.iconPlaceholder} />
                  </View>
                  <View style={styles.reservationInfo}>
                    <Text style={styles.restaurantName}>{reservation.name}</Text>
                    <View style={styles.dateRow}>
                      <Icon name="calendar" size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.dateText}>
                        {reservation.date} at {reservation.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {reservation.status === 'live' ? 'Live details' : 'Past details'}
                    </Text>
                    <Pressable style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Quick Action Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quick Action</Text>
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.refineButton}
                  onPress={() => {
                    // Navigate to review screen
                    onNavigate?.('review');
                  }}
                >
                  <Text style={styles.refineButtonText}>Refine</Text>
                </Pressable>
                <Pressable style={styles.grabButton} onPress={() => onNavigate?.('filter')}>
                  <Text style={styles.grabButtonText}>Grab a Spot</Text>
                </Pressable>
              </View>
            </View>
          </>
        );
      case 'connections':
        return (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Next Reservation</Text>
              <View style={styles.smileyIcon}>
                <Text style={styles.smileyEmoji}>😊</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.connectionsScroll}
            >
              <View style={styles.connectionsRow}>
                {mockConnections.map((connection) => (
                  <View key={connection.id} style={styles.connectionItem}>
                    <Image source={{ uri: connection.avatar }} style={styles.connectionAvatar} />
                    <Text style={styles.connectionName}>{connection.name}</Text>
                    <Text style={styles.connectionRating}>★ {connection.rating}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <TopBar title="Profile" showSettings onSettings={() => onNavigate?.('settings')} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Header */}
        <View style={styles.userHeader}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=10' }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back, John</Text>
            <View style={styles.tierInfo}>
              <Text style={styles.tierText}>Tier 4</Text>
              <Text style={styles.tierDivider}>•</Text>
              <Text style={styles.tierLevel}>Gourmand</Text>
              <Text style={styles.tierDivider}>•</Text>
              <Text style={styles.dinnerCount}>Dinners: 45</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
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
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        <View style={{ height: scaleHeight(100) }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeNavTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginTop: scaleHeight(16),
  },
  activeTab: {
    borderBottomColor: theme.colors.primary.main,
    borderBottomWidth: 2,
  },
  activeTabText: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
  },
  connectionAvatar: {
    borderRadius: scaleWidth(30),
    height: scaleWidth(60),
    marginBottom: scaleHeight(8),
    width: scaleWidth(60),
  },
  connectionItem: {
    alignItems: 'center',
    marginRight: scaleWidth(20),
  },
  connectionName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(2),
  },
  connectionRating: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(11),
  },
  connectionsRow: {
    flexDirection: 'row',
    paddingRight: scaleWidth(20),
  },
  connectionsScroll: {
    marginHorizontal: scaleWidth(-20),
    paddingHorizontal: scaleWidth(20),
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dateText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    marginLeft: scaleWidth(4),
  },
  dinnerCount: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  grabButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(20),
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  grabButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  iconPlaceholder: {
    backgroundColor: '#D9D9D9',
    borderRadius: scaleWidth(8),
    height: scaleWidth(40),
    width: scaleWidth(40),
  },
  refineButton: {
    alignItems: 'center',
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  refineButtonText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600' as any,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationItem: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: scaleHeight(12),
  },
  restaurantIcon: {
    marginRight: scaleWidth(12),
  },
  restaurantName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(4),
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginBottom: scaleHeight(16),
    marginHorizontal: scaleWidth(16),
    padding: scaleWidth(20),
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
  },
  smileyEmoji: {
    fontSize: scaleFont(18),
  },
  smileyIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    borderRadius: scaleWidth(16),
    height: scaleWidth(32),
    justifyContent: 'center',
    width: scaleWidth(32),
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  statusText: {
    color: '#4CAF50',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(12),
    marginBottom: scaleHeight(4),
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  tabContainer: {
    backgroundColor: theme.colors.white,
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(16),
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  tierDivider: {
    color: theme.colors.text.secondary,
    marginHorizontal: scaleWidth(6),
  },
  tierInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  tierLevel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  tierText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
  },
  userAvatar: {
    borderRadius: scaleWidth(30),
    height: scaleWidth(60),
    marginRight: scaleWidth(16),
    width: scaleWidth(60),
  },
  userHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    marginBottom: scaleHeight(4),
  },
});
