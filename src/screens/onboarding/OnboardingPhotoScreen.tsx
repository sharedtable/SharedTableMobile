import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';

import { OnboardingLayout, OnboardingTitle, OnboardingButton } from '@/components/onboarding';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight, scaleFont } from '@/utils/responsive';

interface OnboardingPhotoScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentStep?: number;
  totalSteps?: number;
  userData?: any;
}

export const OnboardingPhotoScreen: React.FC<OnboardingPhotoScreenProps> = ({
  onNavigate,
  currentStep = 10,
  totalSteps = 10,
  userData = {},
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [_loading, _setLoading] = useState(false);

  const handleTakePhoto = async () => {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take a selfie for your profile.'
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front, // Front camera for selfie
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to choose a profile picture.'
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!profileImage) {
      Alert.alert(
        'Add a Photo',
        'Would you like to add a profile photo? It helps others get to know you!',
        [
          {
            text: 'Skip for now',
            onPress: () => navigateToComplete(),
            style: 'cancel',
          },
          {
            text: 'Add Photo',
            onPress: () => {},
          },
        ]
      );
      return;
    }

    navigateToComplete();
  };

  const navigateToComplete = () => {
    // Navigate to completion screen
    onNavigate?.('onboarding-complete', {
      ...userData,
      profileImage,
    });
  };

  const handleBack = () => {
    onNavigate?.('onboarding-personality');
  };

  const showPhotoOptions = () => {
    Alert.alert('Choose Photo', 'Select how you want to add your profile photo', [
      {
        text: 'Take Selfie',
        onPress: handleTakePhoto,
      },
      {
        text: 'Choose from Library',
        onPress: handleChooseFromLibrary,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <OnboardingLayout onBack={handleBack} currentStep={currentStep} totalSteps={totalSteps}>
      <View style={styles.container}>
        {/* Title */}
        <OnboardingTitle>
          Say "Cheese"! Let's{'\n'}
          showcase your radiance{'\n'}
          with a selfie!
        </OnboardingTitle>

        {/* Photo Circle */}
        <View style={styles.photoContainer}>
          <View style={styles.photoCircleOuter}>
            <View style={styles.photoCircleInner}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Image
                  source={require('@/assets/icon.png')} // Placeholder image
                  style={styles.placeholderImage}
                />
              )}
            </View>
          </View>
        </View>

        {/* Take Photo Button */}
        <View style={styles.takePhotoContainer}>
          <Pressable
            style={styles.takePhotoButton}
            onPress={profileImage ? showPhotoOptions : handleTakePhoto}
          >
            <Text style={styles.takePhotoText}>{profileImage ? 'Change Photo' : 'Take Photo'}</Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />

        {/* Next Button */}
        <View style={styles.bottomContainer}>
          <OnboardingButton onPress={handleContinue} label="Next" />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    paddingBottom: scaleHeight(40),
    paddingTop: scaleHeight(20),
  },
  container: {
    flex: 1,
  },
  photoCircleInner: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: scaleWidth(120),
    height: scaleWidth(240),
    justifyContent: 'center',
    overflow: 'hidden',
    width: scaleWidth(240),
  },
  photoCircleOuter: {
    alignItems: 'center',
    backgroundColor: 'rgba(226, 72, 73, 0.1)', // 10% of brand color
    borderRadius: scaleWidth(140),
    height: scaleWidth(280),
    justifyContent: 'center',
    padding: scaleWidth(20),
    width: scaleWidth(280),
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(40),
  },
  placeholderImage: {
    height: '100%',
    opacity: 0.8,
    resizeMode: 'cover',
    width: '100%',
  },
  profileImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  spacer: {
    flex: 1,
    minHeight: scaleHeight(40),
  },
  takePhotoButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary.main,
    borderRadius: scaleWidth(24),
    borderWidth: 2,
    paddingHorizontal: scaleWidth(40),
    paddingVertical: scaleHeight(12),
  },
  takePhotoContainer: {
    alignItems: 'center',
  },
  takePhotoText: {
    color: theme.colors.primary.main,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: scaleFont(16),
    fontWeight: '600' as any,
  },
});
