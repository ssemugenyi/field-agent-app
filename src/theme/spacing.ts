export const spacing = (multiplier: number) => multiplier * 4;

export const space = {
  xs: spacing(1),
  sm: spacing(2),
  md: spacing(4),
  lg: spacing(6),
  xl: spacing(8),
  '2xl': spacing(12),
  '3xl': spacing(16),
} as const;
