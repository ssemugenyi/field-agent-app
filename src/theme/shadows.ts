import { Platform } from 'react-native';

const shadow = (offsetY: number, opacity: number, radius: number, elevation: number) =>
  Platform.select({
    android: { elevation },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  });

export const shadows = {
  none: {},
  sm: shadow(1, 0.06, 4, 2),
  md: shadow(4, 0.08, 14, 5),
  lg: shadow(10, 0.14, 28, 12),
} as const;
