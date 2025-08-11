import React, { memo } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';

import { theme } from '@/theme';
import { fontConfig } from '@/utils/loadFonts';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'link';

type TextColor =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'inverse'
  | 'brand'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

type TextAlign = 'left' | 'center' | 'right' | 'justify';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  weight?: keyof typeof theme.typography.fontWeight;
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export const Text = memo<TextProps>(
  ({ variant = 'body', color = 'primary', align, weight, children, style, ...restProps }) => {
    const getTextStyle = (): TextStyle[] => {
      const styles: TextStyle[] = [baseStyles[variant]];

      // Add color
      if (color) {
        styles.push({ color: colorMap[color] });
      }

      // Add alignment
      if (align) {
        styles.push({ textAlign: align });
      }

      // Add custom weight
      if (weight) {
        styles.push({ fontWeight: theme.typography.fontWeight[weight] });
      }

      // Add custom style
      if (style) {
        styles.push(style as TextStyle);
      }

      return styles;
    };

    return (
      <RNText style={getTextStyle()} {...restProps}>
        {children}
      </RNText>
    );
  }
);

Text.displayName = 'Text';

const colorMap = {
  primary: theme.colors.text.primary,
  secondary: theme.colors.text.secondary,
  disabled: theme.colors.text.disabled,
  inverse: theme.colors.white, // Use white as inverse text color
  brand: theme.colors.brand.primary,
  error: theme.colors.error.main,
  success: theme.colors.success.main,
  warning: theme.colors.warning.main,
  info: theme.colors.state.info, // Use state.info instead of info.main
};

const baseStyles = StyleSheet.create({
  body: {
    ...fontConfig.body.regular,
    color: theme.colors.text.primary,
  },
  bodyLarge: {
    ...fontConfig.body.large,
    color: theme.colors.text.primary,
  },
  bodySmall: {
    ...fontConfig.body.small,
    color: theme.colors.text.secondary,
  },
  button: {
    ...fontConfig.button.regular,
    color: theme.colors.text.primary,
  },
  caption: {
    ...fontConfig.caption,
    color: theme.colors.text.secondary,
  },
  h1: {
    ...fontConfig.heading.h1,
    color: theme.colors.text.primary,
  },
  h2: {
    ...fontConfig.heading.h2,
    color: theme.colors.text.primary,
  },
  h3: {
    ...fontConfig.heading.h3,
    color: theme.colors.text.primary,
  },
  h4: {
    ...fontConfig.heading.h4,
    color: theme.colors.text.primary,
  },
  h5: {
    ...fontConfig.heading.h5,
    color: theme.colors.text.primary,
  },
  h6: {
    ...fontConfig.heading.h6,
    color: theme.colors.text.primary,
  },
  label: {
    ...fontConfig.label,
    color: theme.colors.text.primary,
  },
  link: {
    ...fontConfig.body.regular,
    color: theme.colors.brand.primary,
    textDecorationLine: 'underline',
  },
});
