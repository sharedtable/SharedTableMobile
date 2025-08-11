import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
} from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';

interface SettingsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

interface SettingsItem {
  id: string;
  title: string;
  icon?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const settingsItems: SettingsItem[] = [
  { id: 'refer', title: 'Refer a Friend', showArrow: true },
  { id: 'website1', title: 'wwwwww', showArrow: true },
  { id: 'website2', title: 'wwwwww', showArrow: true },
  { id: 'notifications', title: 'Notifications', showArrow: true },
  { id: 'appearance', title: 'Appearance', showArrow: true },
  { id: 'language', title: 'Language', showArrow: true },
  { id: 'privacy', title: 'Privacy & Security', showArrow: true },
  { id: 'logout', title: 'Log Out', showArrow: true },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleBack = () => {
    onNavigate?.('profile');
  };

  const handleSettingPress = (item: SettingsItem) => {
    if (item.id === 'logout') {
      setShowLogoutModal(true);
    } else {
      console.log('Navigate to:', item.title);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    console.log('Logging out...');
    onNavigate?.('welcome');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Bar */}
      <TopBar
        title="Settings"
        showBack
        onBack={handleBack}
      />

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
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userHandle}>@Johndoe</Text>
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
              <Text style={[
                styles.settingsText,
                item.id === 'logout' && styles.logoutText
              ]}>
                {item.title}
              </Text>
              {item.showArrow && (
                <Icon 
                  name="chevron-right" 
                  size={20} 
                  color={theme.colors.text.secondary} 
                />
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
              Are you sure you want to log out? You'll need to login again to use the app.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: scaleHeight(30),
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(20),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: scaleHeight(16),
  },
  avatar: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    backgroundColor: '#B2EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: scaleFont(20),
    fontWeight: '600' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: scaleHeight(4),
  },
  userHandle: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  settingsList: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(27),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingsText: {
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    flex: 1,
  },
  logoutText: {
    color: theme.colors.primary.main,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(20),
    padding: scaleWidth(24),
    marginHorizontal: scaleWidth(40),
    width: '85%',
    maxWidth: scaleWidth(350),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: scaleHeight(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: scaleFont(20),
    marginBottom: scaleHeight(24),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(25),
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.white,
  },
  cancelButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.primary.main,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
  logoutButton: {
    backgroundColor: theme.colors.primary.main,
  },
  logoutButtonText: {
    fontSize: scaleFont(14),
    color: theme.colors.white,
    fontWeight: '600' as any,
    fontFamily: theme.typography.fontFamily.body,
  },
});