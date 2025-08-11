import { Platform, StyleSheet } from 'react-native';
import { theme } from './index';
import { designTokens } from './designTokens';

// Platform-specific shadow helper
export const createShadow = (elevation: keyof typeof theme.shadows) => {
  return Platform.select({
    ios: theme.shadows[elevation],
    android: {
      elevation: theme.shadows[elevation].elevation,
    },
  });
};

// Responsive value helper
export const responsive = <T,>(values: { small?: T; medium?: T; large?: T; default: T }): T => {
  const { deviceSize } = designTokens;
  
  if (deviceSize.isLarge && values.large !== undefined) {
    return values.large;
  }
  if (deviceSize.isMedium && values.medium !== undefined) {
    return values.medium;
  }
  if (deviceSize.isSmall && values.small !== undefined) {
    return values.small;
  }
  
  return values.default;
};

// Common flex layouts
export const flexLayouts = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  column: {
    flexDirection: 'column',
  },
  columnReverse: {
    flexDirection: 'column-reverse',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerHorizontal: {
    alignItems: 'center',
  },
  centerVertical: {
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  spaceEvenly: {
    justifyContent: 'space-evenly',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStretch: {
    alignItems: 'stretch',
  },
  justifyStart: {
    justifyContent: 'flex-start',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
});

// Position utilities
export const positions = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
  fillAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerAbsolute: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

// Common text styles
export const textStyles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
    color: theme.colors.text.primary,
  },
  h2: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
    color: theme.colors.text.primary,
  },
  h3: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.tight,
    color: theme.colors.text.primary,
  },
  h4: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
  },
  h5: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
  },
  bodySmall: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    color: theme.colors.text.secondary,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
    color: theme.colors.text.secondary,
  },
  button: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.tight,
    textAlign: 'center',
  },
  link: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.primary.main,
    textDecorationLine: 'underline',
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.tight,
    color: theme.colors.text.primary,
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.error.main,
  },
  success: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.success.main,
  },
  center: {
    textAlign: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
});

// Border utilities
export const borders = StyleSheet.create({
  none: {
    borderWidth: 0,
  },
  all: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray['200'],
  },
  top: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray['200'],
  },
  bottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray['200'],
  },
  left: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.neutral.gray['200'],
  },
  right: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.neutral.gray['200'],
  },
  rounded: {
    borderRadius: theme.borderRadius.md,
  },
  roundedSm: {
    borderRadius: theme.borderRadius.sm,
  },
  roundedLg: {
    borderRadius: theme.borderRadius.lg,
  },
  roundedFull: {
    borderRadius: theme.borderRadius.full,
  },
});

// Spacing utilities
export const createSpacing = (
  top?: number,
  right?: number,
  bottom?: number,
  left?: number
) => {
  const rightValue = right ?? top;
  const bottomValue = bottom ?? top;
  const leftValue = left ?? rightValue;

  return {
    paddingTop: top,
    paddingRight: rightValue,
    paddingBottom: bottomValue,
    paddingLeft: leftValue,
  };
};

export const createMargin = (
  top?: number,
  right?: number,
  bottom?: number,
  left?: number
) => {
  const rightValue = right ?? top;
  const bottomValue = bottom ?? top;
  const leftValue = left ?? rightValue;

  return {
    marginTop: top,
    marginRight: rightValue,
    marginBottom: bottomValue,
    marginLeft: leftValue,
  };
};

// Safe area padding helper
export const safePadding = (insets: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}) => ({
  paddingTop: Math.max(insets.top, theme.spacing.md),
  paddingBottom: Math.max(insets.bottom, theme.spacing.md),
  paddingLeft: Math.max(insets.left, theme.spacing.md),
  paddingRight: Math.max(insets.right, theme.spacing.md),
});

// Hit slop helper for touch targets
export const createHitSlop = (size: number = 10) => ({
  top: size,
  bottom: size,
  left: size,
  right: size,
});

// Accessibility utilities
export const a11y = {
  hide: {
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants' as const,
  },
  show: {
    accessibilityElementsHidden: false,
    importantForAccessibility: 'yes' as const,
  },
  button: {
    accessibilityRole: 'button' as const,
  },
  link: {
    accessibilityRole: 'link' as const,
  },
  header: {
    accessibilityRole: 'header' as const,
  },
  image: {
    accessibilityRole: 'image' as const,
  },
  text: {
    accessibilityRole: 'text' as const,
  },
};