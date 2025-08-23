/**
 * New Chat Screen
 * Create new direct messages or group chats
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { ChatStackParamList } from './ChatNavigator';
import { useChatClient } from './hooks/useChatClient';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { normalizeStreamUserId } from '../../../shared/streamUserId';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

interface User {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

export const NewChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const client = useChatClient();
  const { user: currentUser } = usePrivyAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!client || !query || query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await client.queryUsers(
        {
          $or: [
            { name: { $autocomplete: query } },
            { id: { $autocomplete: query } },
          ],
        },
        { name: 1 },
        { limit: 10 }
      );

      // Filter out current user
      const currentUserId = currentUser?.id ? normalizeStreamUserId(currentUser.id) : '';
      const filteredUsers = response.users
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: u.id,
          name: u.name || u.id,
          image: u.image,
          online: u.online,
        }));
      
      setUsers(filteredUsers);
    } catch {
      // Error searching users
    } finally {
      setLoading(false);
    }
  }, [client, currentUser]);

  const handleUserSelect = useCallback((user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  }, [selectedUsers]);

  const handleCreateChat = useCallback(async () => {
    if (!client || selectedUsers.length === 0 || !currentUser?.id) return;

    setCreating(true);
    try {
      const currentUserId = normalizeStreamUserId(currentUser.id);
      const memberIds = [currentUserId, ...selectedUsers.map(u => u.id)];
      
      // For direct messages (1-on-1), use a deterministic channel ID
      // This ensures we don't create duplicate channels
      let channel;
      
      if (selectedUsers.length === 1) {
        // Direct message - use sorted member IDs for deterministic channel ID
        const sortedIds = [currentUserId, selectedUsers[0].id].sort();
        const channelId = sortedIds.join('_');
        
        channel = client.channel('messaging', channelId, {
          members: memberIds,
        });
      } else {
        // Group chat - let Stream generate a unique ID
        channel = client.channel('messaging', {
          members: memberIds,
          name: selectedUsers.map(u => u.name).join(', '),
        } as any);
      }

      // Create or get the channel - watch it to load messages
      await channel.watch();

      // Navigate to the channel
      navigation.replace('Channel', { channelId: channel.id! });
    } catch {
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [client, selectedUsers, currentUser, navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable 
          onPress={handleCreateChat}
          disabled={selectedUsers.length === 0 || creating}
          style={styles.headerButton}
        >
          {creating ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            <Text style={[
              styles.createText,
              selectedUsers.length === 0 && styles.createTextDisabled
            ]}>
              Create
            </Text>
          )}
        </Pressable>
      ),
    });
  }, [navigation, handleCreateChat, selectedUsers, creating]);

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);
    
    return (
      <Pressable
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.userAvatar}>
          {item.image ? (
            <View style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userId}>@{item.id}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary.main} />
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>Selected:</Text>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.selectedChip}
                onPress={() => handleUserSelect(item)}
              >
                <Text style={styles.selectedName}>{item.name}</Text>
                <Ionicons name="close" size={16} color={theme.colors.white} />
              </Pressable>
            )}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.userList}
          ListEmptyComponent={
            searchQuery.length > 1 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  headerButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
  },
  createText: {
    fontSize: 16,
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  createTextDisabled: {
    color: theme.colors.text.disabled,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.gray['1'],
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  selectedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray['1'],
  },
  selectedLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedName: {
    color: theme.colors.white,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    marginRight: 4,
  },
  userList: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userItemSelected: {
    backgroundColor: theme.colors.gray['1'],
  },
  userAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray['2'],
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success.main,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  userId: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
});