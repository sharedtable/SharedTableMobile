import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Switch, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useUserData } from '@/hooks/useUserData';
import { getUserDisplayName } from '@/utils/getUserDisplayName';
import { theme } from '@/theme';
import { scaleHeight, scaleFont, scaleWidth } from '@/utils/responsive';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout } = usePrivyAuth();
  const { userData } = useUserData();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const accountItems = [
    { id: 'edit-profile', title: 'Edit profile', type: 'navigation' as const },
    { id: 'notifications', title: 'Notifications', type: 'toggle' as const, value: notificationsEnabled },
    { id: 'privacy', title: 'Privacy', type: 'navigation' as const },
    { id: 'refer', title: 'Refer a friend', type: 'navigation' as const },
  ];

  const paymentItems = [
    { id: 'payment-methods', title: 'Payment methods', type: 'navigation' as const },
    { id: 'payment-history', title: 'Payment history', type: 'navigation' as const },
  ];

  const legalItems = [
    { id: 'privacy-policy', title: 'Privacy policy', type: 'navigation' as const },
    { id: 'terms', title: 'Terms of service', type: 'navigation' as const },
    { id: 'about', title: 'About', type: 'navigation' as const },
  ];

  // Only show logout in manage section
  const manageItems = [
    { id: 'logout', title: 'Log out', type: 'navigation' as const },
  ];

  return (
    <View style={styles.container}>
      {/* Red Header Section with Profile */}
      <View style={styles.headerSection}>
        <SafeAreaView>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.white} />
          </Pressable>
          
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={50} color={theme.colors.white} />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            </View>
            <Text style={styles.name}>
              {getUserDisplayName({
                ...userData,
                nickname: userData?.displayName,
                name: userData?.name || user?.name,
                email: userData?.email || user?.email
              }, 'User')}
            </Text>
            <Text style={styles.email}>{userData?.email || user?.email || 'No email'}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            {accountItems.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem, 
                  pressed && styles.menuItemPressed,
                  index === accountItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => {
                  if (item.type === 'navigation') {
                    switch (item.id) {
                      case 'edit-profile':
                        navigation.navigate('EditProfile');
                        break;
                      case 'privacy':
                        navigation.navigate('PrivacySettings');
                        break;
                      case 'refer':
                        navigation.navigate('ReferAFriend');
                        break;
                    }
                  }
                }}
                disabled={item.type === 'toggle'}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                {item.type === 'toggle' ? (
                  <Switch
                    value={item.value}
                    onValueChange={(value) => setNotificationsEnabled(value)}
                    trackColor={{ false: theme.colors.gray[200], true: theme.colors.primary.main }}
                    thumbColor={theme.colors.white}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.sectionCard}>
            {paymentItems.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  index === paymentItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => {
                  switch (item.id) {
                    case 'payment-methods':
                      navigation.navigate('PaymentMethods');
                      break;
                    case 'payment-history':
                      // TODO: Navigate to payment history when implemented
                      break;
                  }
                }}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Legal & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          <View style={styles.sectionCard}>
            {legalItems.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  index === legalItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => {
                  switch (item.id) {
                    case 'privacy-policy':
                      navigation.navigate('PrivacyPolicy');
                      break;
                    case 'terms':
                      navigation.navigate('TermsOfService');
                      break;
                    case 'about':
                      navigation.navigate('About');
                      break;
                  }
                }}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Manage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.sectionCard}>
            {manageItems.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  index === manageItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => {
                  if (item.id === 'logout') {
                    setShowLogoutModal(true);
                  }
                }}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out? You'll need to login again to use the app.
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.logoutButton,
                  pressed && styles.buttonPressed
                ]}
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
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    marginBottom: scaleHeight(12),
  },
  avatarCircle: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    borderRadius: scaleWidth(50),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(12),
  },
  backButton: {
    position: 'absolute',
    top: scaleHeight(10),
    left: scaleWidth(16),
    zIndex: 10,
    padding: scaleWidth(8),
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerSection: {
    backgroundColor: '#E85D5D',
    paddingBottom: scaleHeight(30),
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: scaleHeight(60),
  },
  name: {
    color: theme.colors.white,
    fontSize: scaleFont(22),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  email: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: scaleFont(14),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: scaleHeight(20),
  },
  section: {
    marginBottom: scaleHeight(20),
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
    marginHorizontal: scaleWidth(20),
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemPressed: {
    backgroundColor: '#F8F8F8',
  },
  menuItemText: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(15),
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(24),
    width: '100%',
    maxWidth: scaleWidth(340),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaleFont(15),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFont(22),
    marginBottom: scaleHeight(24),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  logoutButton: {
    backgroundColor: theme.colors.primary.main,
  },
  cancelButtonText: {
    color: theme.colors.primary.main,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});