/**
 * User Profile Screen
 * Display user profile in chat context
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/theme';
import { ChatStackParamList } from './ChatNavigator';

type RouteProps = RouteProp<ChatStackParamList, 'UserProfile'>;
type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

export const UserProfileScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = route.params;

  const handleSendMessage = () => {
    // Navigate to chat with this user
    navigation.goBack();
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Spam', onPress: () => {} },
        { text: 'Inappropriate content', onPress: () => {} },
        { text: 'Other', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.userName}>User Name</Text>
          <Text style={styles.userId}>@{userId}</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleSendMessage}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.white} />
            <Text style={styles.primaryButtonText}>Send Message</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionContent}>
            Food enthusiast sharing tables and creating connections through dining experiences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Since</Text>
          <Text style={styles.sectionContent}>January 2024</Text>
        </View>

        <View style={styles.dangerZone}>
          <Pressable style={styles.dangerButton} onPress={handleBlock}>
            <Ionicons name="ban-outline" size={20} color={theme.colors.error.main} />
            <Text style={styles.dangerButtonText}>Block User</Text>
          </Pressable>
          <Pressable style={styles.dangerButton} onPress={handleReport}>
            <Ionicons name="flag-outline" size={20} color={theme.colors.error.main} />
            <Text style={styles.dangerButtonText}>Report User</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    paddingVertical: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 40,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  userName: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userId: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success.main,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  actions: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semibold,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  dangerZone: {
    paddingHorizontal: 16,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.gray['1'],
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    color: theme.colors.error.main,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    marginLeft: 12,
  },
});