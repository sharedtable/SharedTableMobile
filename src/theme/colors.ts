/**
 * Centralized color definitions for the app
 * This ensures consistency and fixes ESLint color-literal warnings
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#E24849',
    secondary: '#2C3E50',
    tertiary: '#34495E',
  },

  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#F5F5F5',
    300: '#E5E5E5',
    400: '#CCCCCC',
    500: '#999999',
    600: '#666666',
    700: '#4D4D4D',
    800: '#374151',
    900: '#1A1A1A',
  },

  // Semantic colors
  success: '#16A34A',
  error: '#D32F2F',
  warning: '#FF8800',
  info: '#007AFF',

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9F9F9',
    tertiary: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    brandLight: 'rgba(226, 72, 73, 0.05)',
    brandLighter: 'rgba(226, 72, 73, 0.1)',
    successLight: 'rgba(22, 163, 74, 0.1)',
    transparent: 'transparent',
    whiteTransparent: 'rgba(255, 255, 255, 0.3)',
  },

  // Text colors
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#999999',
    white: '#FFFFFF',
    error: '#D32F2F',
    success: '#16A34A',
    warning: '#FF8800',
  },

  // Border colors
  border: {
    primary: '#E5E5E5',
    secondary: '#F5F5F5',
    tertiary: '#CCCCCC',
  },

  // Special colors
  special: {
    link: '#007AFF',
    disabled: 'rgba(0, 0, 0, 0.3)',
    placeholder: '#999999',
    badge: '#FF3B30',
    highlight: '#FFD700',
  },

  // Platform-specific
  ios: {
    systemBlue: '#007AFF',
    systemGreen: '#34C759',
    systemIndigo: '#5856D6',
    systemOrange: '#FF9500',
    systemPink: '#FF2D55',
    systemPurple: '#AF52DE',
    systemRed: '#FF3B30',
    systemTeal: '#5AC8FA',
    systemYellow: '#FFCC00',
  },

  android: {
    primary: '#2196F3',
    primaryDark: '#1976D2',
    accent: '#FF4081',
  },
} as const;

// Re-export for convenience
export const {
  brand,
  white,
  black,
  gray,
  success,
  error,
  warning,
  info,
  background,
  text,
  border,
  special,
  ios,
  android,
} = colors;