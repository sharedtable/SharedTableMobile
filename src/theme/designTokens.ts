import { Dimensions, Platform } from 'react-native';

// Device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints for responsive design
export const breakpoints = {
  small: 320,
  medium: 375,
  large: 414,
  xlarge: 768,
} as const;

// Device size helpers
export const deviceSize = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < breakpoints.medium,
  isMedium: SCREEN_WIDTH >= breakpoints.medium && SCREEN_WIDTH < breakpoints.large,
  isLarge: SCREEN_WIDTH >= breakpoints.large,
  isTablet: SCREEN_WIDTH >= breakpoints.xlarge,
} as const;

// Z-index layers
export const zIndex = {
  background: -1,
  default: 0,
  elevated: 1,
  sticky: 10,
  fixed: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
  toast: 60,
} as const;

// Animation constants
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    standard: [0.4, 0.0, 0.2, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    accelerate: [0.4, 0.0, 1, 1],
    sharp: [0.4, 0.0, 0.6, 1],
  },
} as const;

// Touch constants
export const touch = {
  minimumSize: Platform.OS === 'ios' ? 44 : 48,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  activeOpacity: 0.7,
  pressScale: 0.98,
} as const;

// Layout constants
export const layout = {
  grid: {
    columns: 12,
    gutter: 16,
    margin: 16,
  },
  containerMaxWidth: 600,
  tabBarHeight: 56,
  headerHeight: 56,
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      small: 36,
      medium: 44,
      large: 52,
    },
    padding: {
      horizontal: 16,
      vertical: 12,
    },
  },
  input: {
    height: 48,
    padding: 12,
    borderWidth: 1,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  avatar: {
    size: {
      small: 32,
      medium: 48,
      large: 64,
      xlarge: 96,
    },
  },
  badge: {
    size: 20,
    dotSize: 8,
  },
  chip: {
    height: 32,
    padding: 8,
  },
} as const;

// Icon sizes
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

// Opacity levels
export const opacity = {
  disabled: 0.38,
  hint: 0.6,
  divider: 0.12,
  overlay: 0.5,
  pressed: 0.7,
} as const;

// Export all tokens
export const designTokens = {
  breakpoints,
  deviceSize,
  zIndex,
  animation,
  touch,
  layout,
  components,
  iconSize,
  opacity,
} as const;

export type DesignTokens = typeof designTokens;