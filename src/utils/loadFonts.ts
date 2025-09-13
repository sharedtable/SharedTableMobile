import * as Font from 'expo-font';

export const loadFonts = async () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  await Font.loadAsync({
    // Keania One font for headings
    'KeaniaOne-Regular': require('@/assets/fonts/KeaniaOne-Regular.ttf'),

    // Fraunces font family
    'Fraunces-Regular': require('@/assets/fonts/Fraunces_400Regular.ttf'),
    'Fraunces-Medium': require('@/assets/fonts/Fraunces_500Medium.ttf'),
    'Fraunces-SemiBold': require('@/assets/fonts/Fraunces_600SemiBold.ttf'),
    'Fraunces-Bold': require('@/assets/fonts/Fraunces_700Bold.ttf'),
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
};

// Font configuration for text components
export const fontConfig = {
  heading: {
    h1: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 48,
      lineHeight: 52.8, // 1.1x
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 36,
      lineHeight: 39.6, // 1.1x
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 30,
      lineHeight: 36, // 1.2x
      letterSpacing: 0,
    },
    h4: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 24,
      lineHeight: 28.8, // 1.2x
      letterSpacing: 0,
    },
    h5: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 20,
      lineHeight: 30, // 1.5x
      letterSpacing: 0,
    },
    h6: {
      fontFamily: 'KeaniaOne-Regular',
      fontSize: 18,
      lineHeight: 27, // 1.5x
      letterSpacing: 0,
    },
  },
  body: {
    large: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 18,
      lineHeight: 27, // 1.5x
      letterSpacing: 0,
    },
    regular: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 16,
      lineHeight: 24, // 1.5x
      letterSpacing: 0,
    },
    small: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 14,
      lineHeight: 21, // 1.5x
      letterSpacing: 0,
    },
    tiny: {
      fontFamily: 'Fraunces-Regular',
      fontSize: 12,
      lineHeight: 18, // 1.5x
      letterSpacing: 0.1,
    },
  },
  button: {
    large: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
    regular: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
    small: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0.1,
      textTransform: 'none' as const,
    },
  },
  label: {
    fontFamily: 'Fraunces-Medium',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'Fraunces-Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
};
