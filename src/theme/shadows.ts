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
  md: shadow(3, 0.12, 3, 3),
  lg: shadow(4, 0.15, 4, 6),
} as const;
