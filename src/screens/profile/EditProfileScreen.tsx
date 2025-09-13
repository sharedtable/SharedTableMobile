import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useUserData } from '@/hooks/useUserData';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';

interface EditProfileScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  const { user } = usePrivyAuth();
  const { userData: _userData, refetch } = useUserData();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');

  useEffect(() => {
    if (_userData) {
      setFirstName(_userData.first_name || '');
      setLastName(_userData.last_name || '');
      setDisplayName(_userData.display_name || '');
      setEmail(_userData.email || '');
      setPhone(_userData.phone || '');
      setGender(_userData.gender || '');
      setBirthday(_userData.birthday || '');
      setBio(_userData.bio || '');
    } else if (user) {
      // Set email from Privy user if no userData yet
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
    }
  }, [_userData, user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'First name and last name are required.');
      return;
    }

    setLoading(true);
    
    try {
      // Use backend API to update profile (similar to onboarding)
      const response = await api.put('/users/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim() || firstName.trim(),
        gender: gender || undefined,
        birthday: birthday || undefined,
        bio: bio || undefined,
      });

      if (response.success) {
        // Refetch user data to update the cache
        await refetch();
        
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed', 
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  return (
    <View style={styles.container}>
      <TopBar
        title="Edit Profile"
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How you want to be called"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      gender === option && styles.genderOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday</Text>
              <TextInput
                style={styles.input}
                value={birthday}
                onChangeText={setBirthday}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {email ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email}
                  editable={false}
                  placeholder="Your email address"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            ) : null}

            {phone ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={phone}
                  editable={false}
                  placeholder="Your phone number"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCorrect={true}
              />
            </View>
          </View>

          {/* Save Button at Bottom */}
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleHeight(100),
  },
  section: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(20),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(15),
  },
  inputGroup: {
    marginBottom: scaleHeight(20),
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: scaleHeight(8),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.ui.borderLight,
    borderRadius: 8,
    paddingHorizontal: scaleWidth(15),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFont(16),
    color: theme.colors.text.primary,
  },
  disabledInput: {
    backgroundColor: theme.colors.background.paper,
    color: theme.colors.text.secondary,
  },
  textArea: {
    minHeight: scaleHeight(100),
    paddingTop: scaleHeight(12),
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  genderOption: {
    paddingHorizontal: scaleWidth(15),
    paddingVertical: scaleHeight(8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.ui.borderLight,
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  genderOptionText: {
    fontSize: scaleFont(14),
    color: theme.colors.text.primary,
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: scaleWidth(20),
    marginTop: scaleHeight(20),
    paddingVertical: scaleHeight(16),
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
});