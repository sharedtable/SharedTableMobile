import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout } = usePrivyAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const settingsItems = [
    { id: 'account', title: 'Account', icon: 'person-outline' },
    { id: 'dining-preferences', title: 'Dining Preferences', icon: 'restaurant-outline' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' },
    { id: 'privacy', title: 'Privacy & Security', icon: 'lock-closed-outline' },
    { id: 'language', title: 'Language', icon: 'language-outline' },
    { id: 'appearance', title: 'Appearance', icon: 'color-palette-outline' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
    { id: 'about', title: 'About', icon: 'information-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
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

        {/* Settings Menu Items */}
        <View style={styles.menuSection}>
          {settingsItems.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                switch (item.id) {
                  case 'dining-preferences':
                    navigation.navigate('DiningPreferences');
                    break;
                  case 'about':
                    navigation.navigate('About');
                    break;
                  case 'account':
                  case 'notifications':
                  case 'privacy':
                  case 'language':
                  case 'appearance':
                  case 'help':
                    // TODO: Navigate to respective screens when implemented
                    break;
                }
              }}
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

        {/* Logout Button */}
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
  backButton: {
    padding: scaleWidth(8),
    width: scaleWidth(40),
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
  headerBar: {
    alignItems: 'center',
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(20),
    fontWeight: '600',
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
  profileSection: {
    alignItems: 'center',
    borderBottomColor: theme.colors.gray['1'],
    borderBottomWidth: 1,
    paddingVertical: scaleHeight(32),
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