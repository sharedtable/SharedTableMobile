import React, { memo } from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

// import { theme } from '@/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'full' | 'icon' | 'text';
  style?: ImageStyle | ViewStyle;
  aspectRatio?: string; // "1:1" or custom ratio
}

const sizeMap = {
  small: { width: 80, height: 24 },
  medium: { width: 120, height: 36 },
  large: { width: 160, height: 48 },
  xlarge: { width: 200, height: 60 },
};

export const Logo = memo<LogoProps>(
  ({
    size = 'medium',
    variant: _variant = 'full',
    style,
    aspectRatio = '141:141', // From Figma: 141 × 141
  }) => {
    const dimensions = sizeMap[size];

    // Calculate dimensions based on aspect ratio if provided
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    const calculatedHeight = (dimensions.width * heightRatio) / widthRatio;

    // Use the icon.png file for all variants for now
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const logoSource = require('@/assets/icon.png');

    return (
      <View style={[styles.container, style]}>
        <Image
          source={logoSource}
          style={[
            styles.logo,
            {
              width: dimensions.width,
              height: aspectRatio === '1:1' ? dimensions.width : calculatedHeight,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }
);

Logo.displayName = 'Logo';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Logo specific styles
  },
});

// Logo with text component for headers
interface LogoWithTextProps {
  size?: 'small' | 'medium' | 'large';
  tagline?: string;
  style?: ViewStyle;
}

export const LogoWithText = memo<LogoWithTextProps>(
  ({
    size = 'medium',
    tagline = 'The logo should maintain a 1:1 aspect ratio (equal width and height)',
    style,
  }) => {
    return (
      <View style={[logoWithTextStyles.logoWithTextContainer, style]}>
        <Logo size={size} aspectRatio="1:1" />
        {tagline && (
          <View style={logoWithTextStyles.taglineContainer}>
            {/* Text component would go here */}
          </View>
        )}
      </View>
    );
  }
);

LogoWithText.displayName = 'LogoWithText';

const logoWithTextStyles = StyleSheet.create({
  logoWithTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  taglineContainer: {
    marginTop: 4,
  },
});
