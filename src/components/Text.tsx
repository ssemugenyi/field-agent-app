import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, fontSize, fontWeight, FontSizeToken, FontWeightToken } from '../theme/typography';
import { ColorToken } from '../theme/colors';

export type TextProps = RNTextProps & {
  size?: FontSizeToken;
  weight?: FontWeightToken;
  color?: ColorToken;
};

export function Text({ size = 'base', weight = 'normal', color = 'text', style, ...rest }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize: fontSize[size].fontSize,
          lineHeight: fontSize[size].lineHeight,
          fontWeight: fontWeight[weight],
          color: colors[color],
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.sans,
  },
});
