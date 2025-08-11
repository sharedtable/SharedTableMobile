import React, { memo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AntDesign } from '@expo/vector-icons';
import { theme, designTokens } from '@/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'light' | 'dark';
  iconType?: 'image' | 'vector'; // Choose between image URL or vector icon
}

export const GoogleSignInButton = memo<GoogleSignInButtonProps>(({
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  variant = 'light',
  iconType = 'vector',
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'dark' && styles.buttonDark,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.gray['3']} />
        ) : (
          <>
            {iconType === 'vector' ? (
              <AntDesign 
                name="google" 
                size={20} 
                color={variant === 'dark' ? theme.colors.white : '#4285F4'}
              />
            ) : (
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
                resizeMode="contain"
              />
            )}
            <Text style={[
              styles.text,
              variant === 'dark' && styles.textDark,
              isDisabled && styles.textDisabled,
            ]}>
              Sign in with Google
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
});

GoogleSignInButton.displayName = 'GoogleSignInButton';

const styles = StyleSheet.create({
  button: {
    height: 48,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray['1'],
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonDark: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.gray['4'],
    fontFamily: theme.typography.fontFamily.medium,
  },
  textDark: {
    color: theme.colors.white,
  },
  textDisabled: {
    color: theme.colors.gray['2'],
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});