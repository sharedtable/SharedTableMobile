import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    // Keania One font for headings
    'Keania One': require('@/assets/fonts/KeaniaOne-Regular.ttf'),

    // Inter font family
    Inter: require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Thin': require('@/assets/fonts/Inter-Thin.ttf'),
    'Inter-Light': require('@/assets/fonts/Inter-Light.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('@/assets/fonts/Inter-ExtraBold.ttf'),
    'Inter-Black': require('@/assets/fonts/Inter-Black.ttf'),
  });
};

// Font configuration for text components
export const fontConfig = {
  heading: {
    h1: {
      fontFamily: 'Keania One',
      fontSize: 48,
      lineHeight: 52.8, // 1.1x
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'Keania One',
      fontSize: 36,
      lineHeight: 39.6, // 1.1x
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'Keania One',
      fontSize: 30,
      lineHeight: 36, // 1.2x
      letterSpacing: 0,
    },
    h4: {
      fontFamily: 'Keania One',
      fontSize: 24,
      lineHeight: 28.8, // 1.2x
      letterSpacing: 0,
    },
    h5: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 20,
      lineHeight: 30, // 1.5x
      letterSpacing: 0,
    },
    h6: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 18,
      lineHeight: 27, // 1.5x
      letterSpacing: 0,
    },
  },
  body: {
    large: {
      fontFamily: 'Inter-Regular',
      fontSize: 18,
      lineHeight: 27, // 1.5x
      letterSpacing: 0,
    },
    regular: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      lineHeight: 24, // 1.5x
      letterSpacing: 0,
    },
    small: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      lineHeight: 21, // 1.5x
      letterSpacing: 0,
    },
    tiny: {
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      lineHeight: 18, // 1.5x
      letterSpacing: 0.1,
    },
  },
  button: {
    large: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
    regular: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
    small: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
};
