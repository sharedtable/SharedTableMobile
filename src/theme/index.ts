import { Platform } from 'react-native';

export const colors = {
  // Brand Colors from Figma
  brand: {
    primary: '#E24849', // Primary red from design
  },

  // Primary (alias for brand) - Extended color palette
  primary: {
    main: '#E24849',
    light: '#FF6B6B',
    dark: '#C13637',
    contrast: '#FFFFFF',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#E24849',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  } as const,

  // State Colors
  state: {
    info: '#B2EDE8', // Light cyan/blue
    action: '#340068', // Deep purple
  },

  // Semantic Colors
  error: {
    main: '#DC2626',
    light: '#EF4444',
    dark: '#B91C1C',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#DC2626',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  success: {
    main: '#16A34A',
    light: '#22C55E',
    dark: '#15803D',
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#16A34A',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  warning: {
    main: '#EAB308',
    light: '#FDE047',
    dark: '#CA8A04',
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#EAB308',
    700: '#CA8A04',
    800: '#A16207',
    900: '#854D0E',
  },

  // Text Colors
  text: {
    primary: '#1F2024',
    secondary: '#808080',
    tertiary: '#9CA3AF',
    disabled: '#9A9A9A',
  },

  // Background Colors
  background: {
    default: '#FFFFFF',
    paper: '#F9FAFB',
  },
  
  // Overlay Colors
  overlay: {
    dark: 'rgba(0, 0, 0, 0.7)',
    darkest: 'rgba(0, 0, 0, 0.9)',
    medium: 'rgba(0, 0, 0, 0.5)',
    mediumDark: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(0, 0, 0, 0.4)',
    lighter: 'rgba(0, 0, 0, 0.3)',
    white: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white80: 'rgba(255, 255, 255, 0.8)',
    whiteLight: 'rgba(255, 255, 255, 0.9)',
    primary10: 'rgba(226, 72, 73, 0.1)',
    primary30: 'rgba(226, 72, 73, 0.3)',
    blue5: 'rgba(0, 122, 255, 0.05)',
  },

  // Border color
  border: '#E5E7EB',

  // Neutral Colors (for compatibility)
  neutral: {
    white: '#FFFFFF',
    gray: {
      '50': '#F9FAFB',
      '100': '#F7F7F7',
      '200': '#E5E7EB',
      '300': '#E5E5E5',
      '400': '#9CA3AF',
      '500': '#9CA3AF',
      '600': '#4B5563',
      '700': '#374151',
      '800': '#1F2937',
      '900': '#111827',
    },
  },

  // Black Colors
  black: {
    '1': '#000000', // Pure black
    '2': '#1F2024', // Dark gray
  },

  // White & Extra
  white: '#FFFFFF',
  transparent: 'transparent',
  extra: '#3E192A',
  
  // iOS System Colors
  ios: {
    blue: '#007AFF',
    red: '#FF3B30',
    green: '#4CD964',
    yellow: '#FFCC00',
    orange: '#FF9500',
    purple: '#5856D6',
    teal: '#5AC8FA',
    pink: '#FF2D55',
  },
  
  // Additional UI Colors
  ui: {
    lightGray: '#E5E5E5',
    lighterGray: '#F5F5F5',
    lightBlue: '#E8F4FF',
    lightRed: '#FFF5F5',
    googleBlue: '#4285F4',
    lightestGray: '#F5F5F5',
    offWhite: '#F8F9FA',
    paleGray: '#E8E8E8',
    borderLight: '#E1E1E1',
    redLight: '#FFE5E5',
    redLightest: '#FFF9F9',
    redMedium: '#FFE4E4',
    greenLight: '#D1FAE5',
    yellowLight: '#FEF3C7',
    yellowBorder: '#FCD34D',
    yellowDark: '#92400E',
    yellowDarker: '#78350F',
    yellowOrange: '#F59E0B',
    bluePale: '#EFF6FF',
    blueIndigo: '#667EEA',
    blueLight: '#3B82F6',
    teal: '#B2EDE8',
    cyan: '#00BCD4',
    orangeLight: '#FFF3E0',
    orangePale: '#FFF3CD',
    yellowBright: '#FFEAA7',
    darkGray: '#666666',
  },

  // Gray Colors
  gray: {
    '1': '#D9D9D9', // Light gray (40% opacity would be rgba(217, 217, 217, 0.4))
    '2': '#808080', // Medium gray (50% black would be rgba(0, 0, 0, 0.5))
    '3': '#9A9A9A', // Medium gray
    '4': '#B2B6C6', // Blue-gray
    '50': '#F9FAFB',
    '100': '#F7F7F7',
    '200': '#E5E7EB',
    '300': '#E5E5E5',
    '400': '#9CA3AF',
    '500': '#9CA3AF',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827',
  },
  
  // Payment brand colors
  paymentBrands: {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
  },
  
  // Special values (removed duplicate transparent)
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: {
    // Fraunces for headings/display text
    heading: Platform.select({
      ios: 'Fraunces-Regular',
      android: 'Fraunces-Regular',
      default: 'Fraunces-Regular',
    }),
    // Inter for body text
    body: Platform.select({
      ios: 'Inter',
      android: 'Inter',
      default: 'Inter',
    }),
    // Specific font families
    keania: 'KeaniaOne-Regular',
    fraunces: 'Fraunces-Regular',
    inter: 'Inter',
    // Fraunces font weights
    regular: Platform.select({
      ios: 'Fraunces-Regular',
      android: 'Fraunces-Regular',
      default: 'Fraunces-Regular',
    }),
    medium: Platform.select({
      ios: 'Fraunces-Medium',
      android: 'Fraunces-Medium',
      default: 'Fraunces-Medium',
    }),
    semibold: Platform.select({
      ios: 'Fraunces-SemiBold',
      android: 'Fraunces-SemiBold',
      default: 'Fraunces-SemiBold',
    }),
    bold: Platform.select({
      ios: 'Fraunces-Bold',
      android: 'Fraunces-Bold',
      default: 'Fraunces-Bold',
    }),
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    title: 32, // Standard title size
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;

// Re-export designTokens
export { designTokens } from './designTokens';
