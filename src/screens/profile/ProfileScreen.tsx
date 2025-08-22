import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';

interface ProfileScreenProps {
  navigation?: unknown;
  route?: unknown;
  onNavigate?: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { user, logout } = usePrivyAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profileItems = [
    { id: 'settings', title: 'Settings', icon: 'settings-outline' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
    { id: 'about', title: 'About', icon: 'information-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.name}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
          {user?.walletAddress && (
            <View style={styles.walletContainer}>
              <Ionicons name="wallet-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.wallet}>
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          {profileItems.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => onNavigate?.(item.id)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={theme.colors.text.primary}
                />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginBottom: scaleHeight(16),
  },
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  email: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(4),
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    paddingVertical: scaleHeight(32),
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(24),
    marginHorizontal: scaleWidth(24),
    marginTop: scaleHeight(32),
    paddingVertical: scaleHeight(14),
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(16),
  },
  menuItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  menuItemPressed: {
    backgroundColor: theme.colors.gray['1'],
  },
  menuItemText: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
  },
  menuSection: {
    paddingTop: scaleHeight(20),
  },
  name: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(4),
  },
  wallet: {
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    fontSize: scaleFont(12),
  },
  walletContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: scaleWidth(6),
    marginTop: scaleHeight(8),
  },
});
