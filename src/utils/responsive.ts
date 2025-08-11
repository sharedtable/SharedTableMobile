import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions from Figma design (iPhone 16)
const baseWidth = 393;
const baseHeight = 852;

/**
 * Scales a value based on device width
 * Use for: widths, horizontal margins, horizontal paddings
 */
export const scaleWidth = (size: number): number => {
  const scale = screenWidth / baseWidth;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scales a value based on device height
 * Use for: heights, vertical margins, vertical paddings
 */
export const scaleHeight = (size: number): number => {
  const scale = screenHeight / baseHeight;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scales font size with limits to maintain readability
 * Use for: all font sizes
 */
export const scaleFont = (size: number): number => {
  const scale = screenWidth / baseWidth;

  // Limit scaling to maintain readability
  const maxScale = 1.2;
  const minScale = 0.8;

  const limitedScale = Math.min(Math.max(scale, minScale), maxScale);
  return Math.round(PixelRatio.roundToNearestPixel(size * limitedScale));
};

/**
 * Returns value without scaling
 * Use for: border widths, icon strokes, etc.
 */
export const fixed = (size: number): number => size;

/**
 * Device size detection
 */
export const isSmallDevice = screenWidth < 375;
export const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
export const isLargeDevice = screenWidth >= 414;

/**
 * Responsive value based on device size
 */
export function responsive<T>(values: { small?: T; medium?: T; large?: T; default: T }): T {
  if (isSmallDevice && values.small !== undefined) return values.small;
  if (isMediumDevice && values.medium !== undefined) return values.medium;
  if (isLargeDevice && values.large !== undefined) return values.large;
  return values.default;
}
