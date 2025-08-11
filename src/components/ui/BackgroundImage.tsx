import React, { memo } from 'react';
import {
  ImageBackground,
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BackgroundImageProps {
  source?: any; // Can be require() or {uri: string}
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  gradient?: boolean;
  gradientColors?: string[];
  gradientLocations?: number[];
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const BackgroundImage = memo<BackgroundImageProps>(({
  source = { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' }, // Default restaurant image
  overlay = true,
  overlayColor = '#000000',
  overlayOpacity = 0.4,
  gradient = false,
  gradientColors = ['transparent', 'rgba(0,0,0,0.8)'],
  gradientLocations = [0, 1],
  style,
  children,
}) => {
  return (
    <ImageBackground
      source={source}
      style={[styles.container, style]}
      resizeMode="cover"
    >
      {overlay && !gradient && (
        <View 
          style={[
            styles.overlay, 
            { 
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            }
          ]} 
        />
      )}
      
      {gradient && (
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          style={styles.gradient}
        />
      )}
      
      {children}
    </ImageBackground>
  );
});

BackgroundImage.displayName = 'BackgroundImage';

// Screen with background image (full screen)
interface ScreenWithBackgroundProps {
  imageSource?: any;
  darkOverlay?: boolean;
  children: React.ReactNode;
}

export const ScreenWithBackground = memo<ScreenWithBackgroundProps>(({
  imageSource,
  darkOverlay = true,
  children,
}) => {
  // Use the default restaurant/dining image from the Figma design
  const defaultImage = { 
    uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' 
  };

  return (
    <View style={styles.screenContainer}>
      <ImageBackground
        source={imageSource || defaultImage}
        style={styles.fullScreen}
        resizeMode="cover"
      >
        {darkOverlay && (
          <View style={styles.darkOverlay} />
        )}
        <View style={styles.content}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
});

ScreenWithBackground.displayName = 'ScreenWithBackground';

// Hero section with background (partial screen)
interface HeroBackgroundProps {
  imageSource?: any;
  height?: number;
  children?: React.ReactNode;
}

export const HeroBackground = memo<HeroBackgroundProps>(({
  imageSource,
  height = SCREEN_HEIGHT * 0.4,
  children,
}) => {
  return (
    <ImageBackground
      source={imageSource || { uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800' }}
      style={[styles.hero, { height }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        locations={[0.3, 1]}
        style={styles.heroGradient}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  );
});

HeroBackground.displayName = 'HeroBackground';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  screenContainer: {
    flex: 1,
  },
  fullScreen: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
});