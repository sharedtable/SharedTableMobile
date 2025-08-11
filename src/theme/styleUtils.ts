import { Platform, StyleSheet } from 'react-native';

import { designTokens } from './designTokens';

import { theme } from './index';

// Platform-specific shadow helper
export const createShadow = (elevation: keyof typeof theme.shadows) => {
  return Platform.select({
    ios: theme.shadows[elevation],
    android: {
      elevation: (theme.shadows[elevation] as any).elevation || 0,
    },
  });
};

// Responsive value helper
export const responsive = <T>(values: { small?: T; medium?: T; large?: T; default: T }): T => {
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
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignStretch: {
    alignItems: 'stretch',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHorizontal: {
    alignItems: 'center',
  },
  centerVertical: {
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  columnReverse: {
    flexDirection: 'column-reverse',
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
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  justifyStart: {
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceEvenly: {
    justifyContent: 'space-evenly',
  },
});

// Position utilities
export const positions = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  centerAbsolute: {
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  fillAbsolute: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  relative: {
    position: 'relative',
  },
});

// Common text styles
export const textStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  bodySmall: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  button: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.tight,
    textAlign: 'center',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  caption: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
  },
  center: {
    textAlign: 'center',
  },
  error: {
    color: theme.colors.error.main,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
  },
  h1: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
  },
  h2: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
  },
  h3: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.tight,
  },
  h4: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
  },
  h5: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.tight,
  },
  link: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    textDecorationLine: 'underline',
  },
  success: {
    color: theme.colors.success.main,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});

// Border utilities
export const borders = StyleSheet.create({
  all: {
    borderColor: theme.colors.neutral.gray['200'],
    borderWidth: 1,
  },
  bottom: {
    borderBottomColor: theme.colors.neutral.gray['200'],
    borderBottomWidth: 1,
  },
  left: {
    borderLeftColor: theme.colors.neutral.gray['200'],
    borderLeftWidth: 1,
  },
  none: {
    borderWidth: 0,
  },
  right: {
    borderRightColor: theme.colors.neutral.gray['200'],
    borderRightWidth: 1,
  },
  rounded: {
    borderRadius: theme.borderRadius.md,
  },
  roundedFull: {
    borderRadius: theme.borderRadius.full,
  },
  roundedLg: {
    borderRadius: theme.borderRadius.lg,
  },
  roundedSm: {
    borderRadius: theme.borderRadius.sm,
  },
  top: {
    borderTopColor: theme.colors.neutral.gray['200'],
    borderTopWidth: 1,
  },
});

// Spacing utilities
export const createSpacing = (top?: number, right?: number, bottom?: number, left?: number) => {
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

export const createMargin = (top?: number, right?: number, bottom?: number, left?: number) => {
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
