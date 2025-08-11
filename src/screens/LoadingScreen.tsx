import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Text as RNText,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/base/Logo';
import { theme } from '@/theme';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export const LoadingScreen = memo<LoadingScreenProps>(({ 
  onLoadingComplete,
  duration = 2000,
}) => {
  const insets = useSafeAreaInsets();
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
    flex: 1,
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 141, // Based on Figma 141x141 aspect ratio
    height: 141,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 72, // Large TT letters
    fontFamily: theme.typography.fontFamily.heading, // Keania One
    color: theme.colors.white,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
});