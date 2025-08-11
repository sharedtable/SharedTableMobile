import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabBar, TabName } from '@/components/navigation/BottomTabBar';

interface ProfileScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
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
                    console.log('Refine button pressed, navigating to review');
                    onNavigate?.('review');
                  }}
                >
                  <Text style={styles.refineButtonText}>Refine</Text>
                </Pressable>
                <Pressable 
                  style={styles.grabButton}
                  onPress={() => onNavigate?.('filter')}
                >
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
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.connectionsScroll}>
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
      <TopBar
        title="Profile"
        showSettings
        onSettings={() => onNavigate?.('settings')}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Header */}
        <View style={styles.userHeader}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=10' }} 
            style={styles.userAvatar}
          />
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
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollView: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(20),
    backgroundColor: theme.colors.white,
  },
  userAvatar: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    marginRight: scaleWidth(16),
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: scaleFont(18),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    fontSize: scaleFont(13),
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
  },
  tierDivider: {
    marginHorizontal: scaleWidth(6),
    color: theme.colors.text.secondary,
  },
  tierLevel: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  dinnerCount: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: scaleHeight(20),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  activeTabText: {
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: scaleWidth(20),
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  smileyIcon: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smileyEmoji: {
    fontSize: scaleFont(18),
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  restaurantIcon: {
    marginRight: scaleWidth(12),
  },
  iconPlaceholder: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    backgroundColor: '#D9D9D9',
    borderRadius: scaleWidth(8),
  },
  reservationInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: scaleFont(15),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginLeft: scaleWidth(4),
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: scaleFont(12),
    color: '#4CAF50',
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
  },
  cancelButton: {
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: '#F5F5F5',
    borderRadius: scaleWidth(12),
  },
  cancelText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginTop: scaleHeight(16),
  },
  refineButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    alignItems: 'center',
  },
  refineButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  grabButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
  },
  grabButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  connectionsScroll: {
    marginHorizontal: scaleWidth(-20),
    paddingHorizontal: scaleWidth(20),
  },
  connectionsRow: {
    flexDirection: 'row',
    paddingRight: scaleWidth(20),
  },
  connectionItem: {
    alignItems: 'center',
    marginRight: scaleWidth(20),
  },
  connectionAvatar: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    marginBottom: scaleHeight(8),
  },
  connectionName: {
    fontSize: scaleFont(12),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(2),
  },
  connectionRating: {
    fontSize: scaleFont(11),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
});