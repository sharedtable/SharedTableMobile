import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionType = 'notifications' | 'camera' | 'photos';

interface PermissionResult {
  granted: boolean;
  canAskAgain?: boolean;
}

export const permissions = {
  // Check notification permissions
  async checkNotifications(): Promise<PermissionResult> {
    const { status } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
    };
  },

  // Request notification permissions
  async requestNotifications(): Promise<PermissionResult> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return { granted: true };
    }

    if (existingStatus === 'denied') {
      return { granted: false, canAskAgain: false };
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
    };
  },

  // Check camera permissions
  async checkCamera(): Promise<PermissionResult> {
    // @ts-expect-error - Camera API types may be outdated
    // eslint-disable-next-line import/namespace
    const result = await Camera.getCameraPermissionsAsync();
    return {
      granted: result.status === 'granted',
      canAskAgain: result.status !== 'denied',
    };
  },

  // Request camera permissions
  async requestCamera(): Promise<PermissionResult> {
    // @ts-expect-error - Camera API types may be outdated
    // eslint-disable-next-line import/namespace
    const result = await Camera.requestCameraPermissionsAsync();
    return {
      granted: result.status === 'granted',
      canAskAgain: result.status !== 'denied',
    };
  },

  // Check photo library permissions
  async checkPhotos(): Promise<PermissionResult> {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
    };
  },

  // Request photo library permissions
  async requestPhotos(): Promise<PermissionResult> {
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (existingStatus === 'granted') {
      return { granted: true };
    }

    if (existingStatus === 'denied') {
      return { granted: false, canAskAgain: false };
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
    };
  },

  // Helper to show permission denied alert with settings redirect
  showPermissionDeniedAlert(permissionType: PermissionType) {
    const messages = {
      notifications: {
        title: 'Notifications Permission Required',
        message:
          'Please enable notifications in your device settings to receive booking reminders and updates.',
      },
      camera: {
        title: 'Camera Permission Required',
        message: 'Please enable camera access in your device settings to take profile photos.',
      },
      photos: {
        title: 'Photos Permission Required',
        message:
          'Please enable photo library access in your device settings to select profile photos.',
      },
    };

    const { title, message } = messages[permissionType];

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
      { cancelable: true }
    );
  },

  // Request permission with proper handling
  async requestPermission(type: PermissionType): Promise<boolean> {
    let result: PermissionResult;

    switch (type) {
      case 'notifications':
        result = await this.requestNotifications();
        break;
      case 'camera':
        result = await this.requestCamera();
        break;
      case 'photos':
        result = await this.requestPhotos();
        break;
      default:
        return false;
    }

    if (!result.granted && !result.canAskAgain) {
      this.showPermissionDeniedAlert(type);
    }

    return result.granted;
  },
};
