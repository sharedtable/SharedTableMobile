import { Platform } from 'react-native';

export const colors = {
  // Brand Colors from Figma
  brand: {
    primary: '#E24849', // Primary red from design
  },

  // Primary (alias for brand)
  primary: {
    main: '#E24849',
    light: '#FF6B6B',
    contrast: '#FFFFFF',
  },

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
  },

  success: {
    main: '#16A34A',
    light: '#22C55E',
    dark: '#15803D',
  },

  warning: {
    main: '#EAB308',
    light: '#FDE047',
    dark: '#CA8A04',
  },

  // Text Colors
  text: {
    primary: '#1F2024',
    secondary: '#808080',
    disabled: '#9A9A9A',
  },

  // Background Colors
  background: {
    default: '#FFFFFF',
    paper: '#F9FAFB',
  },

  // Neutral Colors (for compatibility)
  neutral: {
    white: '#FFFFFF',
    gray: {
      '50': '#F9FAFB',
      '100': '#F3F4F6',
      '200': '#E5E7EB',
      '300': '#D1D5DB',
      '400': '#9CA3AF',
      '500': '#6B7280',
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
  extra: '#3E192A',

  // Gray Colors
  gray: {
    '1': '#D9D9D9', // Light gray (40% opacity would be rgba(217, 217, 217, 0.4))
    '2': '#808080', // Medium gray (50% black would be rgba(0, 0, 0, 0.5))
    '3': '#9A9A9A', // Medium gray
    '4': '#B2B6C6', // Blue-gray
  },
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
    // Keania One for headings/display text
    heading: Platform.select({
      ios: 'KeaniaOne-Regular',
      android: 'KeaniaOne-Regular',
      default: 'System',
    }),
    // Inter for body text
    body: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    // Specific font families
    keania: 'KeaniaOne-Regular',
    // Inter font weights
    regular: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'Inter-Bold',
      android: 'Inter-Bold',
      default: 'System',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
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
