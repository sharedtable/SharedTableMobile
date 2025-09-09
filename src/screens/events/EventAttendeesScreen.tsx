import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api, EventAttendee } from '@/services/api';

type RouteParams = {
  EventAttendees: {
    eventId: string;
    eventTitle: string;
    isHost: boolean;
  };
};


const EventAttendeesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventAttendees'>>();
  const { eventId, eventTitle, isHost } = route.params;

  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'confirmed' | 'pending' | 'waitlisted'>('confirmed');

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      const response = await api.getEventAttendees(eventId);
      if (response.success && response.data) {
        setAttendees(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      Alert.alert('Error', 'Failed to load attendees');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendees();
  };

  const handleApproveAttendee = async (_attendeeId: string) => {
    if (!isHost) return;

    Alert.alert(
      'Approve Attendee',
      'Are you sure you want to approve this attendee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              // TODO: Implement approve API
              Alert.alert('Success', 'Attendee approved successfully');
              fetchAttendees();
            } catch {
              Alert.alert('Error', 'Failed to approve attendee');
            }
          },
        },
      ]
    );
  };

  const handleDeclineAttendee = async (_attendeeId: string) => {
    if (!isHost) return;

    Alert.alert(
      'Decline Attendee',
      'Are you sure you want to decline this attendee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement decline API
              Alert.alert('Success', 'Attendee declined');
              fetchAttendees();
            } catch {
              Alert.alert('Error', 'Failed to decline attendee');
            }
          },
        },
      ]
    );
  };

  const handleMessageAttendee = (attendee: EventAttendee) => {
    // Navigate to chat with this attendee
    (navigation as any).navigate('Chat', {
      userId: attendee.user_id,
      userName: attendee.user.name,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'waitlisted':
        return theme.colors.gray['500'];
      case 'declined':
      case 'cancelled':
        return '#EF4444';
      default:
        return theme.colors.gray['500'];
    }
  };

  const filteredAttendees = attendees.filter(a => {
    if (selectedTab === 'confirmed') return a.status === 'confirmed';
    if (selectedTab === 'pending') return a.status === 'pending';
    if (selectedTab === 'waitlisted') return a.status === 'waitlisted';
    return false;
  });

  const renderAttendeeCard = (attendee: EventAttendee) => (
    <View key={attendee.id} style={styles.attendeeCard}>
      <View style={styles.attendeeHeader}>
        <Image
          source={{
            uri: attendee.user.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${  attendee.user.name}`,
          }}
          style={styles.attendeeAvatar}
        />
        <View style={styles.attendeeInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.attendeeName}>{attendee.user.name}</Text>
            {attendee.guests_count > 1 && (
              <View style={styles.guestBadge}>
                <Ionicons name="people" size={12} color="#6B7280" />
                <Text style={styles.guestCount}>+{attendee.guests_count - 1}</Text>
              </View>
            )}
          </View>
          <Text style={styles.attendeeEmail}>{attendee.user.email}</Text>
          {attendee.user.bio && (
            <Text style={styles.attendeeBio} numberOfLines={2}>
              {attendee.user.bio}
            </Text>
          )}
        </View>
      </View>

      {(attendee.dietary_notes || attendee.special_requests) && (
        <View style={styles.attendeeNotes}>
          {attendee.dietary_notes && (
            <View style={styles.noteItem}>
              <Ionicons name="restaurant-outline" size={14} color="#6B7280" />
              <Text style={styles.noteText}>{attendee.dietary_notes}</Text>
            </View>
          )}
          {attendee.special_requests && (
            <View style={styles.noteItem}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.noteText}>{attendee.special_requests}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.attendeeFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(attendee.status) }]} />
          <Text style={styles.statusText}>
            {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
          </Text>
          <Text style={styles.dateText}>
            {format(new Date(attendee.requested_at), 'MMM d, h:mm a')}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMessageAttendee(attendee)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary.main} />
          </TouchableOpacity>

          {isHost && attendee.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApproveAttendee(attendee.id)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDeclineAttendee(attendee.id)}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendees</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Attendees</Text>
          <Text style={styles.headerSubtitle}>{eventTitle}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'confirmed' && styles.tabActive]}
          onPress={() => setSelectedTab('confirmed')}
        >
          <Text style={[styles.tabText, selectedTab === 'confirmed' && styles.tabTextActive]}>
            Confirmed ({attendees.filter(a => a.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            Pending ({attendees.filter(a => a.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'waitlisted' && styles.tabActive]}
          onPress={() => setSelectedTab('waitlisted')}
        >
          <Text style={[styles.tabText, selectedTab === 'waitlisted' && styles.tabTextActive]}>
            Waitlist ({attendees.filter(a => a.status === 'waitlisted').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredAttendees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No {selectedTab} attendees</Text>
          </View>
        ) : (
          filteredAttendees.map(renderAttendeeCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray['50'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.gray['900'],
  },
  headerSubtitle: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: scaleWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.transparent,
  },
  tabActive: {
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: scaleFont(14),
    color: theme.colors.gray['500'],
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scaleWidth(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(12),
    shadowColor: theme.colors.black['1'],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendeeHeader: {
    flexDirection: 'row',
    marginBottom: scaleHeight(12),
  },
  attendeeAvatar: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    marginRight: scaleWidth(12),
  },
  attendeeInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  attendeeName: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.gray['900'],
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray['100'],
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(4),
  },
  guestCount: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['500'],
  },
  attendeeEmail: {
    fontSize: scaleFont(13),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(2),
  },
  attendeeBio: {
    fontSize: scaleFont(13),
    color: theme.colors.gray['700'],
    marginTop: scaleHeight(4),
    lineHeight: scaleFont(18),
  },
  attendeeNotes: {
    backgroundColor: theme.colors.gray['50'],
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(6),
  },
  noteText: {
    fontSize: scaleFont(13),
    color: theme.colors.gray['700'],
    marginLeft: scaleWidth(6),
    flex: 1,
  },
  attendeeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  statusDot: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
  statusText: {
    fontSize: scaleFont(13),
    color: theme.colors.gray['700'],
    fontWeight: '500',
  },
  dateText: {
    fontSize: scaleFont(12),
    color: theme.colors.gray['400'],
    marginLeft: scaleWidth(4),
  },
  actions: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  actionButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(8),
    backgroundColor: theme.colors.gray['100'],
  },
  approveButton: {
    backgroundColor: theme.colors.ui.greenLight,
  },
  declineButton: {
    backgroundColor: theme.colors.error['100'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: scaleHeight(60),
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: theme.colors.gray['500'],
    marginTop: scaleHeight(12),
  },
});

export default EventAttendeesScreen;