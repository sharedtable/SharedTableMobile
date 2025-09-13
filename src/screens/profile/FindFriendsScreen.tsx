import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { api } from '@/services/api';
import { getUserDisplayName } from '@/utils/getUserDisplayName';
// @ts-expect-error - lodash types not installed
import debounce from 'lodash/debounce';

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email: string;
  avatar_url?: string;
  connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked';
}

export const FindFriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Debounced search function
  const searchUsers = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setUsers([]);
          return;
        }

        setLoading(true);
        try {
          const response = await api.searchUsers(query);
          if (response.success && response.data) {
            setUsers(response.data);
          }
        } catch (error) {
          console.error('Failed to search users:', error);
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  useEffect(() => {
    searchUsers(searchQuery);
  }, [searchQuery, searchUsers]);

  const handleSendRequest = async (user: User) => {
    const userName = getUserDisplayName({
      nickname: user.nickname,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
    Alert.alert(
      'Send Friend Request',
      `Send a friend request to ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSendingRequest(user.id);
            try {
              const response = await api.sendConnectionRequest(user.id);
              if (response.success) {
                Alert.alert('Success', 'Friend request sent!');
                // Update the user's status in the list
                setUsers(prevUsers =>
                  prevUsers.map(u =>
                    u.id === user.id
                      ? { ...u, connectionStatus: 'pending' }
                      : u
                  )
                );
              }
            } catch (_error) {
              Alert.alert('Error', 'Failed to send friend request');
            } finally {
              setSendingRequest(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (user: User) => {
    const userName = getUserDisplayName({
      nickname: user.nickname,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });
    Alert.alert(
      'Cancel Request',
      `Cancel friend request to ${userName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setSendingRequest(user.id);
            try {
              // Note: You'll need to get the connection ID first
              // For now, we'll need to enhance the API to support this
              Alert.alert('Info', 'Feature coming soon');
            } catch (_error) {
              Alert.alert('Error', 'Failed to cancel request');
            } finally {
              setSendingRequest(null);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isLoading = sendingRequest === item.id;

    return (
      <View style={styles.userCard}>
        <Pressable
          style={styles.userInfo}
          onPress={() => {
            // Navigate to user profile
          }}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={theme.colors.white} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {getUserDisplayName({
                nickname: item.nickname,
                firstName: item.first_name,
                lastName: item.last_name,
                email: item.email,
              })}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </Pressable>

        <View style={styles.actionContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            <>
              {item.connectionStatus === 'none' && (
                <Pressable
                  style={styles.addButton}
                  onPress={() => handleSendRequest(item)}
                >
                  <Ionicons name="person-add" size={18} color={theme.colors.white} />
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              )}

              {item.connectionStatus === 'pending' && (
                <Pressable
                  style={styles.pendingButton}
                  onPress={() => handleCancelRequest(item)}
                >
                  <Ionicons name="time-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.pendingButtonText}>Pending</Text>
                </Pressable>
              )}

              {item.connectionStatus === 'accepted' && (
                <View style={styles.friendBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success.main} />
                  <Text style={styles.friendText}>Friends</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Find Friends</Text>
          <View style={styles.backButton} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
          </View>
        ) : searchQuery.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>Search for friends</Text>
            <Text style={styles.emptySubtext}>Enter at least 2 characters to search</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral.gray[200],
  },
  backButton: {
    width: scaleWidth(40),
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(12),
  },
  searchBar: {
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
  listContent: {
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(100),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral.gray[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    marginRight: scaleWidth(12),
  },
  avatarPlaceholder: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: theme.colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(2),
  },
  userEmail: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
  },
  actionContainer: {
    marginLeft: scaleWidth(12),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(4),
  },
  addButtonText: {
    fontSize: scaleFont(13),
    color: theme.colors.white,
    fontWeight: '500',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray[100],
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(4),
  },
  pendingButtonText: {
    fontSize: scaleFont(13),
    color: theme.colors.text.secondary,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  friendText: {
    fontSize: scaleFont(13),
    color: theme.colors.success.main,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(40),
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