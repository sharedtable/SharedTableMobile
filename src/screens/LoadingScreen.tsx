import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export const LoadingScreen = memo<LoadingScreenProps>(({ onLoadingComplete, duration = 2000 }) => {
  const styles = getStyles();
  const _insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Subtle fade in and scale animation for the logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-complete after duration
    const timer = setTimeout(() => {
      onLoadingComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, duration, onLoadingComplete]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.brand.primary}
        translucent={false}
      />

      {/* Logo centered on brand color background - matching Figma exactly */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* SharedTable Logo */}
        <Image
          source={require('@/assets/images/logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
});

LoadingScreen.displayName = 'LoadingScreen';

const getStyles = () => StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    height: 240,
    tintColor: theme.colors.white, // Make the logo white
    width: 240,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
