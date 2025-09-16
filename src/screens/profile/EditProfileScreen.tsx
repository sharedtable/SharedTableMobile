import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  InteractionManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';

import { TopBar } from '@/components/navigation/TopBar';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';
import { useUserData } from '@/hooks/useUserData';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { api } from '@/services/api';
import { logger } from '@/utils/logger';

// Validation schema
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  birthday: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Birthday must be in YYYY-MM-DD format'
  ).refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 16 && age <= 100;
  }, 'You must be between 16 and 100 years old'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileScreenProps {
  onNavigate?: (screen: string, data?: Record<string, unknown>) => void;
}

export const EditProfileScreen = React.memo<EditProfileScreenProps>(({ onNavigate: _onNavigate }) => {
  const navigation = useNavigation();
  const { user } = usePrivyAuth();
  const { userData, refetch } = useUserData();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [birthday, setBirthday] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const displayNameRef = useRef<TextInput>(null);
  const birthdayRef = useRef<TextInput>(null);

  // Memoized validation
  const validateField = useCallback((field: keyof ProfileFormData, value: string) => {
    try {
      const fieldSchema = profileSchema.shape[field];
      fieldSchema.parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  }, []);

  // Load user data with proper error handling
  useEffect(() => {
    let mounted = true;
    
    const loadUserData = async () => {
      if (!user?.id) {
        setDataLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        
        if (!mounted) return;
        
        if (response.success && response.data) {
          const data = response.data as any;
          
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setDisplayName(data.display_name || '');
          setGender(data.gender || '');
          
          if (data.birthday) {
            setBirthday(data.birthday.split('T')[0]);
          }
        }
      } catch (error) {
        logger.error('Error loading user data:', error);
        
        if (!mounted) return;
        
        // Fallback to cached data
        if (userData) {
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setDisplayName(userData.display_name || '');
          setGender(userData.gender || '');
          setBirthday(userData.birthday || '');
        }
      } finally {
        if (mounted) {
          setDataLoading(false);
        }
      }
    };

    InteractionManager.runAfterInteractions(() => {
      loadUserData();
    });
    
    return () => {
      mounted = false;
    };
  }, [user?.id, userData]);

  // Optimized save handler with validation
  const handleSave = useCallback(async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Validate all fields
    const formData: ProfileFormData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim(),
      gender: gender as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
      birthday,
    };
    
    try {
      profileSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof ProfileFormData;
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
        
        // Scroll to first error
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
        
        // Show alert for first error
        const firstError = Object.values(fieldErrors)[0];
        Alert.alert('Validation Error', firstError);
        return;
      }
    }

    setLoading(true);
    
    try {
      const response = await api.post('/onboarding-simple/save', {
        step: 'profile-edit',
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          nickname: formData.displayName,
          gender: formData.gender,
          birthDate: formData.birthday,
        }
      });

      if (response.success) {
        // Clear dirty flag
        setIsDirty(false);
        
        // Refetch user data
        await refetch();
        
        // Success haptic
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Error updating profile:', error);
      
      // Error haptic
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        'Update Failed', 
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, displayName, gender, birthday, refetch, navigation]);

  // Memoized gender options
  const genderOptions = useMemo(() => 
    ['Male', 'Female', 'Other', 'Prefer not to say'],
  []);
  
  // Handle text input changes with validation
  const handleFirstNameChange = useCallback((text: string) => {
    setFirstName(text);
    setIsDirty(true);
    if (text) validateField('firstName', text);
  }, [validateField]);
  
  const handleLastNameChange = useCallback((text: string) => {
    setLastName(text);
    setIsDirty(true);
    if (text) validateField('lastName', text);
  }, [validateField]);
  
  const handleDisplayNameChange = useCallback((text: string) => {
    setDisplayName(text);
    setIsDirty(true);
    if (text) validateField('displayName', text);
  }, [validateField]);
  
  const handleBirthdayChange = useCallback((text: string) => {
    setBirthday(text);
    setIsDirty(true);
    if (text.length === 10) validateField('birthday', text);
  }, [validateField]);
  
  const handleGenderSelect = useCallback((selectedGender: string) => {
    setGender(selectedGender);
    setIsDirty(true);
    validateField('gender', selectedGender);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, [validateField]);

  if (dataLoading) {
    return (
      <View style={styles.container}>
        <TopBar
          title="Edit Profile"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

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
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                ref={firstNameRef}
                style={[styles.input, errors.firstName && styles.inputError]}
                value={firstName}
                onChangeText={handleFirstNameChange}
                placeholder="Enter your first name"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                maxLength={50}
                testID="first-name-input"
                accessible
                accessibilityLabel="First Name Input"
                accessibilityHint="Enter your first name"
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                ref={lastNameRef}
                style={[styles.input, errors.lastName && styles.inputError]}
                value={lastName}
                onChangeText={handleLastNameChange}
                placeholder="Enter your last name"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => displayNameRef.current?.focus()}
                maxLength={50}
                testID="last-name-input"
                accessible
                accessibilityLabel="Last Name Input"
                accessibilityHint="Enter your last name"
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput
                ref={displayNameRef}
                style={[styles.input, errors.displayName && styles.inputError]}
                value={displayName}
                onChangeText={handleDisplayNameChange}
                placeholder="How you want to be called"
                placeholderTextColor={theme.colors.text.secondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => birthdayRef.current?.focus()}
                maxLength={50}
                testID="display-name-input"
                accessible
                accessibilityLabel="Display Name Input"
                accessibilityHint="Enter how you want to be called"
              />
              {errors.displayName ? (
                <Text style={styles.errorText}>{errors.displayName}</Text>
              ) : (
                <Text style={styles.helperText}>This is how others will see your name</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.genderOptionSelected,
                      errors.gender && styles.genderOptionError
                    ]}
                    onPress={() => handleGenderSelect(option)}
                    testID={`gender-option-${option}`}
                    accessible
                    accessibilityRole="radio"
                    accessibilityState={{ selected: gender === option }}
                    accessibilityLabel={`Gender option: ${option}`}
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
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday *</Text>
              <TextInput
                ref={birthdayRef}
                style={[styles.input, errors.birthday && styles.inputError]}
                value={birthday}
                onChangeText={handleBirthdayChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={10}
                testID="birthday-input"
                accessible
                accessibilityLabel="Birthday Input"
                accessibilityHint="Enter your birthday in YYYY-MM-DD format"
              />
              {errors.birthday ? (
                <Text style={styles.errorText}>{errors.birthday}</Text>
              ) : (
                <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 1990-01-31)</Text>
              )}
            </View>
          </View>

          {/* Save Button at Bottom */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              loading && styles.saveButtonDisabled,
              pressed && styles.saveButtonPressed,
              !isDirty && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || !isDirty}
            testID="save-button"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Save Changes"
            accessibilityState={{ disabled: loading || !isDirty }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isDirty ? 'Save Changes' : 'No Changes'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
});

EditProfileScreen.displayName = 'EditProfileScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(10),
    fontSize: scaleFont(14),
    color: theme.colors.text.secondary,
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
  helperText: {
    fontSize: scaleFont(12),
    color: theme.colors.text.secondary,
    marginTop: scaleHeight(4),
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
  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  inputError: {
    borderColor: (theme.colors as any).error || '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    fontSize: scaleFont(12),
    color: (theme.colors as any).error || '#FF3B30',
    marginTop: scaleHeight(4),
    marginLeft: scaleWidth(4),
  },
  genderOptionError: {
    borderColor: (theme.colors as any).error || '#FF3B30',
  },
});