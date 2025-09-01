import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';

interface Connection {
  id: string;
  connected_user_id: string;
  connected_user_name: string;
  connected_user_email: string;
  connected_user_avatar?: string;
  connected_user_bio?: string;
  connected_user_dinners_attended?: number;
  status: 'accepted' | 'pending' | 'blocked';
  requested_at?: string;
  connected_at?: string;
  message?: string;
  dinners_together?: number;
  last_interaction?: string;
}

interface PendingRequest {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  requester_avatar?: string;
  message?: string;
  requested_at: string;
}

interface ConnectionsViewProps {
  userId?: string;
  onAddFriend?: () => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ onAddFriend }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.getConnections();
      if (response.success && response.data) {
        setConnections(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.getPendingConnections();
      if (response.success && response.data) {
        setPendingRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const handleMessage = (connection: Connection) => {
    // Navigate to chat/message screen
    console.log('Message:', connection.connected_user_name);
  };

  const handleUnfriend = async (connection: Connection) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${connection.connected_user_name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.removeConnection(connection.id);
              if (response.success) {
                // Refresh connections list
                fetchConnections();
                Alert.alert('Success', 'Friend removed');
              }
            } catch (error) {
              console.error('Failed to remove friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleBlock = async (userId: string, userName: string) => {
    Alert.alert(
      'Block User',
      `Block ${userName}? They won't be able to send you friend requests or see your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.blockUser(userId);
              if (response.success) {
                // Refresh connections list
                fetchConnections();
                Alert.alert('Success', 'User blocked');
              }
            } catch (error) {
              console.error('Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (request: PendingRequest) => {
    try {
      const response = await api.acceptConnection(request.id);
      if (response.success) {
        // Refresh both lists
        fetchConnections();
        fetchPendingRequests();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDeclineRequest = async (request: PendingRequest) => {
    try {
      const response = await api.rejectConnection(request.id);
      if (response.success) {
        // Refresh pending requests
        fetchPendingRequests();
      }
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  const filteredConnections = connections.filter(connection =>
    connection.connected_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.connected_user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConnection = ({ item }: { item: Connection }) => (
    <View style={styles.connectionCard}>
      <View style={styles.connectionLeft}>
        {item.connected_user_avatar ? (
          <Image source={{ uri: item.connected_user_avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
          </View>
        )}
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.connected_user_name}</Text>
          <Text style={styles.connectionEmail}>{item.connected_user_email}</Text>
          {item.dinners_together && item.dinners_together > 0 && (
            <Text style={styles.dinnersText}>
              🍽️ {item.dinners_together} dinners together
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.connectionActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => handleMessage(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary.main} />
        </Pressable>
        
        <Pressable 
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Friend Options',
              `Manage ${item.connected_user_name}`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove Friend',
                  style: 'destructive',
                  onPress: () => handleUnfriend(item),
                },
                {
                  text: 'Block User',
                  style: 'destructive',
                  onPress: () => handleBlock(item.connected_user_id, item.connected_user_name),
                },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text.secondary} />
        </Pressable>
      </View>
    </View>
  );

  const renderPendingRequest = ({ item }: { item: PendingRequest }) => (
    <View style={styles.connectionCard}>
      <View style={styles.connectionLeft}>
        {item.requester_avatar ? (
          <Image source={{ uri: item.requester_avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
          </View>
        )}
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.requester_name}</Text>
          <Text style={styles.connectionEmail}>{item.requester_email}</Text>
          {item.message && (
            <Text style={styles.connectionMessage}>{item.message}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.connectionActions}>
        <Pressable 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
            Connections
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Search Bar and Actions */}
      <View style={styles.searchContainer}>
        {activeTab === 'connections' ? (
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search connections"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <Pressable 
              style={styles.addFriendButton}
              onPress={onAddFriend}
            >
              <Ionicons name="person-add" size={20} color={theme.colors.primary.main} />
            </Pressable>
          </>
        ) : (
          <Text style={styles.requestsHeader}>
            You have {pendingRequests.length} pending connection request{pendingRequests.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Connections List */}
      {activeTab === 'connections' ? (
        <FlatList
          data={filteredConnections}
          renderItem={renderConnection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No connections yet</Text>
              <Text style={styles.emptySubtext}>Connect with other diners to start chatting!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderPendingRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>When someone wants to connect, you&apos;ll see it here</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(24),
    marginBottom: scaleHeight(16),
  },
  tab: {
    marginRight: scaleWidth(24),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.main,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  tabText: {
    fontSize: scaleFont(16),
    color: theme.colors.text.secondary,
    paddingBottom: scaleHeight(8),
  },
  activeTabText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: theme.colors.error.main,
    borderRadius: scaleWidth(10),
    minWidth: scaleWidth(20),
    height: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(6),
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: scaleWidth(24),
    marginBottom: scaleHeight(16),
    flexDirection: 'row',
    gap: scaleWidth(12),
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray[100],
    borderRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
  },
  searchInput: {
    flex: 1,
    marginLeft: scaleWidth(8),
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
  },
  addFriendButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.neutral.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsHeader: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(100),
  },
  connectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral.gray[200],
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    marginRight: scaleWidth(12),
  },
  avatarPlaceholder: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(2),
  },
  connectionEmail: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
  },
  dinnersText: {
    fontSize: scaleFont(11),
    color: theme.colors.text.tertiary,
    marginTop: scaleHeight(2),
  },
  connectionMessage: {
    fontSize: scaleFont(12),
    color: theme.colors.text.tertiary,
    marginTop: scaleHeight(4),
    fontStyle: 'italic',
  },
  connectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  actionButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(20),
    backgroundColor: theme.colors.neutral.gray[100],
  },
  acceptButton: {
    backgroundColor: theme.colors.success.main,
    borderColor: theme.colors.success.main,
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(12),
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: theme.colors.neutral.gray[100],
    borderColor: theme.colors.neutral.gray[200],
  },
  declineButtonText: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(12),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scaleHeight(60),
  },
  emptyText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: scaleHeight(16),
  },
  emptySubtext: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(8),
    textAlign: 'center',
  },
});