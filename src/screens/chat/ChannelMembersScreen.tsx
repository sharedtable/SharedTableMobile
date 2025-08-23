/**
 * Channel Members Screen
 * Display and manage channel members
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { ChatStackParamList } from './ChatNavigator';
import { useChatClient } from './hooks/useChatClient';

type RouteProps = RouteProp<ChatStackParamList, 'ChannelMembers'>;
type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

interface Member {
  user_id: string;
  user: {
    id: string;
    name: string;
    image?: string;
    online?: boolean;
    last_active?: string;
  };
  role?: string;
}

export const ChannelMembersScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const client = useChatClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [_loading, setLoading] = useState(true);

  const { channelId } = route.params;

  useEffect(() => {
    if (!client || !channelId) return;

    const fetchMembers = async () => {
      try {
        const channels = await client.queryChannels({ id: channelId });
        if (channels.length > 0) {
          const channel = channels[0];
          const response = await channel.queryMembers({});
          setMembers(response.members);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        Alert.alert('Error', 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [client, channelId]);

  const handleMemberPress = (member: Member) => {
    navigation.navigate('UserProfile', { userId: member.user_id });
  };

  const renderMember = ({ item }: { item: Member }) => (
    <Pressable
      style={styles.memberItem}
      onPress={() => handleMemberPress(item)}
    >
      <View style={styles.memberAvatar}>
        {item.user.image ? (
          <View style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.user.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.user.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.user.name}</Text>
          {item.role === 'owner' && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerText}>Owner</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberStatus}>
          {item.user.online ? 'Online' : 'Offline'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {members.length} {members.length === 1 ? 'Member' : 'Members'}
        </Text>
      </View>
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={styles.membersList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray['1'],
  },
  headerTitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  membersList: {
    paddingVertical: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray['2'],
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.success.main,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  ownerBadge: {
    marginLeft: 8,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerText: {
    color: theme.colors.white,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  memberStatus: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.gray['1'],
    marginLeft: 76,
  },
});