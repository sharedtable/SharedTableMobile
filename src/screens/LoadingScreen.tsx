import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import { Logo } from '@/components/base/Logo';
import { theme } from '@/theme';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export const LoadingScreen = memo<LoadingScreenProps>(({ onLoadingComplete, duration = 2000 }) => {
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
        {/* Use actual logo if available, otherwise show TT */}
        {/* <Logo size="xlarge" variant="full" /> */}
        <View style={styles.logoWrapper}>
          <RNText style={styles.logoText}>TT</RNText>
        </View>
      </Animated.View>
    </View>
  );
});

LoadingScreen.displayName = 'LoadingScreen';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.heading, // Keania One
    fontSize: 72, // Large TT letters
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  logoWrapper: {
    alignItems: 'center',
    height: 141, // Based on Figma 141x141 aspect ratio
    justifyContent: 'center',
    width: 141,
  },
});
