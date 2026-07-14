import { Platform } from 'react-native';

export const fontFamily = {
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fontSize = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 19.5 },
  lg: { fontSize: 18, lineHeight: 21.94 },
  xl: { fontSize: 20, lineHeight: 24.38 },
  '2xl': { fontSize: 24, lineHeight: 29.26 },
  '3xl': { fontSize: 28, lineHeight: 50 },
  '4xl': { fontSize: 48, lineHeight: 58 },
  '5xl': { fontSize: 48, lineHeight: 48 },
  '6xl': { fontSize: 60, lineHeight: 60 },
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;

export const letterSpacing = (fontSizePx: number, token: 'wide' | 'wider') => {
  const em = token === 'wide' ? 0.025 : 0.05;
  return fontSizePx * em;
};
