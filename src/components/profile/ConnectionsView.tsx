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
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';
import { getUserDisplayName } from '@/utils/getUserDisplayName';
import { useStreamChat } from '@/providers/GlobalStreamChatProvider';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { normalizeStreamUserId } from '../../../shared/streamUserId';

interface Connection {
  view_id: string;  // Unique identifier for the view row
  connection_id: string;  // The actual connection ID
  connected_user_id: string;
  connected_user_first_name?: string;
  connected_user_last_name?: string;
  connected_user_nickname?: string;
  connected_user_email: string;
  connected_user_photo?: string;
  status: 'accepted' | 'pending' | 'blocked';
  requested_at?: string;
  connected_at?: string;
  message?: string;
  dinners_together?: number;
  last_interaction?: string;
}

interface PendingRequest {
  id: string;
  requester_id: string;
  connected_user_id: string;
  requester_first_name?: string;
  requester_last_name?: string;
  requester_nickname?: string;
  requester_email: string;
  requester_photo?: string;
  message?: string;
  requested_at: string;
  status: string;
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
  const navigation = useNavigation<any>();
  const { client } = useStreamChat();
  const { user: currentUser } = usePrivyAuth();

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

  const handleMessage = async (connection: Connection) => {
    if (!client || !currentUser?.id) {
      Alert.alert('Error', 'Chat service is not available');
      return;
    }

    try {
      // Create a deterministic channel ID for direct messaging
      const currentUserId = normalizeStreamUserId(currentUser.id);
      const friendUserId = normalizeStreamUserId(connection.connected_user_id);
      const sortedIds = [currentUserId, friendUserId].sort();
      const channelId = sortedIds.join('_');

      // Get or create the channel
      const channel = client.channel('messaging', channelId, {
        members: [currentUserId, friendUserId],
      });

      // Watch the channel to ensure it exists
      await channel.watch();

      // Navigate to the Chat tab and then to the specific channel
      navigation.navigate('Chat', {
        screen: 'Channel',
        params: { channelId: channel.id },
      });
    } catch (error) {
      console.error('Failed to open chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  const handleUnfriend = async (connection: Connection) => {
    const userName = getUserDisplayName({
      nickname: connection.connected_user_nickname,
      firstName: connection.connected_user_first_name,
      lastName: connection.connected_user_last_name,
      email: connection.connected_user_email,
    });
    Alert.alert(
      'Remove Friend',
      `Remove ${userName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.removeConnection(connection.connection_id);
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

  const filteredConnections = connections.filter(connection => {
    const displayName = getUserDisplayName({
      nickname: connection.connected_user_nickname,
      firstName: connection.connected_user_first_name,
      lastName: connection.connected_user_last_name,
      email: connection.connected_user_email,
    });
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.connected_user_email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConnection = ({ item }: { item: Connection }) => (
    <View style={styles.connectionCard}>
      <View style={styles.connectionLeft}>
        {item.connected_user_photo ? (
          <Image source={{ uri: item.connected_user_photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
          </View>
        )}
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>
            {getUserDisplayName({
              nickname: item.connected_user_nickname,
              firstName: item.connected_user_first_name,
              lastName: item.connected_user_last_name,
              email: item.connected_user_email,
            })}
          </Text>
          <Text style={styles.connectionEmail}>{item.connected_user_email || ''}</Text>
          {item.dinners_together && item.dinners_together > 0 ? (
            <Text style={styles.dinnersText}>
              {`🍽️ ${item.dinners_together} dinners together`}
            </Text>
          ) : null}
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
            const userName = getUserDisplayName({
              nickname: item.connected_user_nickname,
              firstName: item.connected_user_first_name,
              lastName: item.connected_user_last_name,
              email: item.connected_user_email,
            });
            Alert.alert(
              'Friend Options',
              `Manage ${userName}`,
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
                  onPress: () => {
                    const userName = getUserDisplayName({
                      nickname: item.connected_user_nickname,
                      firstName: item.connected_user_first_name,
                      lastName: item.connected_user_last_name,
                      email: item.connected_user_email,
                    });
                    handleBlock(item.connected_user_id, userName);
                  },
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
        {item.requester_photo ? (
          <Image source={{ uri: item.requester_photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
          </View>
        )}
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>
            {getUserDisplayName({
              nickname: item.requester_nickname,
              firstName: item.requester_first_name,
              lastName: item.requester_last_name,
              email: item.requester_email,
            })}
          </Text>
          <Text style={styles.connectionEmail}>{item.requester_email || ''}</Text>
          {item.message ? (
            <Text style={styles.connectionMessage}>{item.message}</Text>
          ) : null}
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
            {pendingRequests.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{String(pendingRequests.length)}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* Search Bar and Actions */}
      <View style={styles.searchContainer}>
        {activeTab === 'connections' ? (
          <React.Fragment>
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
          </React.Fragment>
        ) : (
          <Text style={styles.requestsHeader}>
            {`You have ${pendingRequests.length} pending connection request${pendingRequests.length !== 1 ? 's' : ''}`}
          </Text>
        )}
      </View>

      {/* Connections List */}
      {activeTab === 'connections' ? (
        <FlatList
          data={filteredConnections}
          renderItem={renderConnection}
          keyExtractor={(item) => item.view_id || item.connection_id}
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