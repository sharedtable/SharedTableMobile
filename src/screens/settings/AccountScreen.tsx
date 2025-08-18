import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';

import { Icon } from '@/components/base/Icon';
import { TopBar } from '@/components/navigation/TopBar';
import { useAuth } from '@/lib/auth';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface AccountScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

interface AccountField {
  key: string;
  label: string;
  value: string;
  editable: boolean;
  type: 'text' | 'email' | 'phone';
  placeholder?: string;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<AccountField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  const [accountFields, setAccountFields] = useState<AccountField[]>([
    {
      key: 'full_name',
      label: 'Full Name',
      value: '',
      editable: true,
      type: 'text',
      placeholder: 'Enter your full name',
    },
    {
      key: 'email',
      label: 'Email',
      value: '',
      editable: false, // Usually can't change email easily
      type: 'email',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      value: '',
      editable: true,
      type: 'phone',
      placeholder: '+1 (555) 123-4567',
    },
    {
      key: 'username',
      label: 'Username',
      value: '',
      editable: true,
      type: 'text',
      placeholder: 'Choose a username',
    },
  ]);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserData = () => {
    if (user) {
      setAccountFields((prev) =>
        prev.map((field) => {
          switch (field.key) {
            case 'full_name':
              return {
                ...field,
                value: user.user_metadata?.full_name || user.user_metadata?.name || '',
              };
            case 'email':
              return { ...field, value: user.email || '' };
            case 'phone':
              return { ...field, value: user.user_metadata?.phone || user.phone || '' };
            case 'username':
              return { ...field, value: user.user_metadata?.username || '' };
            default:
              return field;
          }
        })
      );
    }
  };

  const handleEditField = (field: AccountField) => {
    setEditingField(field);
    setEditValue(field.value);
    setShowEditModal(true);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    setLoading(true);
    try {
      // Validate input
      if (editingField.type === 'email' && editValue && !isValidEmail(editValue)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }

      if (editingField.type === 'phone' && editValue && !isValidPhone(editValue)) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
        return;
      }

      // Update user profile - placeholder implementation
      // In a real app, this would call your backend API
      console.log('Updating profile:', editingField.key, editValue);

      // Update local state
      setAccountFields((prev) =>
        prev.map((field) =>
          field.key === editingField.key ? { ...field, value: editValue } : field
        )
      );

      setShowEditModal(false);
      setEditingField(null);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoPress = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Photo Library', onPress: openImageLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Photo library permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setLoading(true);
    try {
      // Here you would upload the image to your backend/storage
      // For now, we'll just log the action
      console.log('Updating profile photo:', uri);
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error) {
      console.error('Failed to update profile photo:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be temporarily disabled. You can reactivate it anytime by logging in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            // Implement account deactivation
            Alert.alert('Account Deactivated', 'Your account has been deactivated.');
          },
        },
      ]
    );
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  };

  const handleBack = () => {
    onNavigate?.('settings');
  };

  const getUserDisplayName = () => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'User'
    );
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TopBar title="Account" showBack onBack={handleBack} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Pressable style={styles.avatarContainer} onPress={handleProfilePhotoPress}>
            <View style={styles.avatar}>
              {getUserAvatar() ? (
                <Image source={{ uri: getUserAvatar() }} style={styles.avatarImage} />
              ) : (
                <Icon name="user" size={50} color="#B2EDE8" />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={16} color={theme.colors.white} />
            </View>
          </Pressable>
          <Text style={styles.displayName}>{getUserDisplayName()}</Text>
          <Text style={styles.memberSince}>
            Member since{' '}
            {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.fieldsList}>
            {accountFields.map((field, index) => (
              <View key={field.key}>
                <Pressable
                  style={({ pressed }) => [
                    styles.fieldItem,
                    !field.editable && styles.disabledField,
                    pressed && field.editable && styles.pressedField,
                  ]}
                  onPress={() => field.editable && handleEditField(field)}
                  disabled={!field.editable}
                >
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text
                      style={[
                        styles.fieldValue,
                        !field.value && styles.placeholderText,
                        !field.editable && styles.disabledText,
                      ]}
                    >
                      {field.value || field.placeholder || 'Not set'}
                    </Text>
                  </View>
                  {field.editable && (
                    <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
                  )}
                  {!field.editable && field.key === 'email' && (
                    <View style={styles.verifiedBadge}>
                      <Icon name="check" size={16} color={theme.colors.primary.main} />
                    </View>
                  )}
                </Pressable>
                {index < accountFields.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.actionsList}>
            <Pressable
              style={({ pressed }) => [styles.actionItem, pressed && styles.pressedField]}
              onPress={handleDeactivateAccount}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="user" size={20} color="#FF8800" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Deactivate Account</Text>
                <Text style={styles.actionSubtitle}>Temporarily disable your account</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        <View style={{ height: scaleHeight(50) }} />
      </ScrollView>

      {/* Edit Field Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editingField?.label}</Text>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editingField?.placeholder}
              keyboardType={
                editingField?.type === 'email'
                  ? 'email-address'
                  : editingField?.type === 'phone'
                    ? 'phone-pad'
                    : 'default'
              }
              autoCapitalize={editingField?.type === 'email' ? 'none' : 'words'}
              autoComplete={
                editingField?.type === 'email'
                  ? 'email'
                  : editingField?.type === 'phone'
                    ? 'tel'
                    : 'name'
              }
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveField}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContent: {
    flex: 1,
  },
  actionIconContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: scaleWidth(20),
    height: scaleWidth(40),
    justifyContent: 'center',
    marginRight: scaleWidth(16),
    width: scaleWidth(40),
  },
  actionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  actionSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    marginTop: scaleHeight(2),
  },
  actionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
  actionsList: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#B2EDE8',
    borderRadius: scaleWidth(50),
    height: scaleWidth(100),
    justifyContent: 'center',
    overflow: 'hidden',
    width: scaleWidth(100),
  },
  avatarContainer: {
    marginBottom: scaleHeight(16),
    position: 'relative',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  cameraIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.white,
    borderRadius: scaleWidth(16),
    borderWidth: 2,
    bottom: 0,
    height: scaleWidth(32),
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: scaleWidth(32),
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
  disabledField: {
    opacity: 0.7,
  },
  disabledText: {
    color: theme.colors.text.secondary,
  },
  displayName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginBottom: scaleHeight(4),
  },
  fieldContent: {
    flex: 1,
  },
  fieldItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
  },
  fieldLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '500',
    marginBottom: scaleHeight(2),
  },
  fieldValue: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
  },
  fieldsList: {
    backgroundColor: theme.colors.white,
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    marginHorizontal: scaleWidth(16),
    overflow: 'hidden',
  },
  memberSince: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
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
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5E5',
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
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
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },
  placeholderText: {
    fontStyle: 'italic',
  },
  pressedField: {
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: scaleHeight(24),
    paddingVertical: scaleHeight(32),
  },
  saveButton: {
    backgroundColor: theme.colors.primary.main,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: scaleHeight(24),
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(13),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(8),
    marginHorizontal: scaleWidth(16),
    textTransform: 'uppercase',
  },
  separator: {
    backgroundColor: '#F0F0F0',
    height: 1,
    marginLeft: scaleWidth(20),
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: scaleWidth(12),
    height: scaleWidth(24),
    justifyContent: 'center',
    width: scaleWidth(24),
  },
});
