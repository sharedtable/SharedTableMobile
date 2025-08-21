import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Modal } from 'react-native';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { useAuth } from '@/lib/auth';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface SettingsScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface SettingsItem {
  id: string;
  title: string;
  icon?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const settingsItems: SettingsItem[] = [
  { id: 'account', title: 'Account', showArrow: true },
  { id: 'notifications', title: 'Notifications', showArrow: true },
  { id: 'appearance', title: 'Appearance', showArrow: true },
  { id: 'privacy', title: 'Privacy & Security', showArrow: true },
  { id: 'language', title: 'Language', showArrow: true },
  { id: 'refer', title: 'Refer a Friend', showArrow: true },
  { id: 'about', title: 'About', showArrow: true },
  { id: 'logout', title: 'Log Out', showArrow: true },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { signOut, user } = useAuth();

  const handleBack = () => {
    onNavigate?.('profile');
  };

  const handleSettingPress = (item: SettingsItem) => {
    if (item.id === 'logout') {
      setShowLogoutModal(true);
    } else if (item.id === 'notifications') {
      onNavigate?.('notifications');
    } else if (item.id === 'privacy') {
      onNavigate?.('privacy-security');
    } else if (item.id === 'appearance') {
      onNavigate?.('appearance');
    } else if (item.id === 'account') {
      onNavigate?.('account');
    } else if (item.id === 'about') {
      onNavigate?.('about');
    } else {
      // Navigate to other settings items
    }
  };

  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      await signOut();
      // Navigation will be handled by AuthWrapper/App based on auth state
    } catch (error) {
      // Still close modal and let auth state handle navigation
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <TopBar title="Settings" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="user" size={40} color="#B2EDE8" />
            </View>
            <View style={styles.editBadge}>
              <Icon name="edit" size={12} color={theme.colors.white} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userHandle}>{user?.email || ''}</Text>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.settingsItem,
                pressed && styles.settingsItemPressed,
                index === settingsItems.length - 1 && styles.lastItem,
              ]}
              onPress={() => handleSettingPress(item)}
            >
              <Text style={[styles.settingsText, item.id === 'logout' && styles.logoutText]}>
                {item.title}
              </Text>
              {item.showArrow && (
                <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out? You&apos;ll need to login again to use the app.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#B2EDE8',
    borderRadius: scaleWidth(40),
    height: scaleWidth(80),
    justifyContent: 'center',
    width: scaleWidth(80),
  },
  avatarContainer: {
    marginBottom: scaleHeight(16),
    position: 'relative',
  },
  cancelButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  editBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.white,
    borderRadius: scaleWidth(14),
    borderWidth: 2,
    bottom: 0,
    height: scaleWidth(28),
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: scaleWidth(28),
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  logoutButton: {
    backgroundColor: theme.colors.primary.main,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  logoutText: {
    color: theme.colors.primary.main,
  },
  modalButton: {
    alignItems: 'center',
    borderRadius: scaleWidth(25),
    flex: 1,
    paddingVertical: scaleHeight(12),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(20),
    marginHorizontal: scaleWidth(40),
    maxWidth: scaleWidth(350),
    padding: scaleWidth(24),
    width: '85%',
  },
  modalMessage: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(24),
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scaleHeight(12),
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(20),
    paddingVertical: scaleHeight(30),
  },
  scrollView: {
    flex: 1,
  },
  settingsItem: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  settingsItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  settingsList: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  settingsText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
  },
  userHandle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  userName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(20),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
});
