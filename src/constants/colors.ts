/**
 * Centralized color constants to avoid color literals in components
 * Addresses react-native/no-color-literals ESLint rule
 */

export const Colors = {
  // Transparent
  transparent: 'transparent',
  
  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#F5F5F5',
  gray300: '#E5E5E5',
  gray400: '#CCCCCC',
  gray500: '#999999',
  gray600: '#666666',
  gray700: '#374151',
  
  // Background colors
  backgroundLight: '#F9F9F9',
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',
  backgroundWhiteOverlay: 'rgba(255, 255, 255, 0.3)',
  
  // Primary colors with opacity
  primaryLight: 'rgba(226, 72, 73, 0.05)',
  primaryLighter: 'rgba(226, 72, 73, 0.1)',
  
  // Status colors
  success: '#16A34A',
  error: '#DC2626',
  errorLight: '#FCA5A5',
  errorLighter: '#FEE2E2',
  warning: '#F59E0B',
  warningDark: '#856404',
  warningLight: '#FFEAA7',
  warningLighter: '#FFF3CD',
  info: '#3B82F6',
  
  // Brand colors
  google: '#4285F4',
  
  // Special colors
  shadowColor: '#000000',
  textDark: '#000000',
  orange: '#FF8800',
  orangeLight: '#FFF3E0',
  teal: '#B2EDE8',
  grayDark: '#6B6B6B',
  redDark: '#FF4444',
  redLight: '#FFE5E5',
  pinkLight: '#FFF9F9',
  yellowLight: '#FFE4E4',
  
  // Opacity colors
  blackOverlay: 'rgba(0, 0, 0, 0.4)',
  blackOverlayMedium: 'rgba(0, 0, 0, 0.5)',
  whiteOverlay: 'rgba(255, 255, 255, 0.6)',
  whiteOpaque: 'rgba(255, 255, 255, 1)',
  whiteOverlayLight: 'rgba(255, 255, 255, 0.9)',
  whiteOverlayMedium: 'rgba(255, 255, 255, 0.5)',
  primaryMedium: 'rgba(226, 72, 73, 0.3)',
  
  // UI specific colors
  borderGray: '#E1E1E1',
  borderLight: '#E5E7EB',
  textPrimary: '#666666',
  textSecondary: '#8E8E93',
  textTertiary: '#8B4513',
  backgroundYellow: '#FFF9E6',
  borderYellow: '#FFE5B4',
  googleBlue: '#4285F4',
  backgroundGray: '#F8F8F8',
  backgroundGrayLight: '#F9FAFB',
  backgroundGrayLighter: '#F7F7F7',
  textDarkGray: '#1C1C1E',
  
  // Pink colors
  pinkBackground: '#FFF0F1',
  pinkBorder: '#FFB6C1',
} as const;

export type ColorKey = keyof typeof Colors;