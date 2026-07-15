import React, { useRef } from 'react';
import { Animated, ActivityIndicator, Pressable, PressableProps, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { space } from '../theme/spacing';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

const sizeStyles = {
  sm: { paddingVertical: space.xs, paddingHorizontal: space.md, fontSize: 'sm' as const },
  md: { paddingVertical: space.sm + 2, paddingHorizontal: space.lg, fontSize: 'base' as const },
  lg: { paddingVertical: space.md, paddingHorizontal: space.xl, fontSize: 'lg' as const },
};

const variantStyles: Record<ButtonVariant, { bg: string; border?: string; text: string; elevated?: boolean }> = {
  primary: { bg: colors.primary, text: colors.textInverse, elevated: true },
  secondary: { bg: colors.secondary, text: colors.textInverse, elevated: true },
  outline: { bg: colors.surface, border: colors.border, text: colors.secondary },
  ghost: { bg: 'transparent', text: colors.secondary },
  danger: { bg: colors.error, text: colors.textInverse, elevated: true },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPressIn={(e) => {
        animateTo(0.96);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        rest.onPressOut?.(e);
      }}
      style={{ opacity: isDisabled ? 0.5 : 1 }}
      {...rest}
    >
      <Animated.View
        style={[
          {
            borderRadius: radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            backgroundColor: v.bg,
            borderColor: v.border ?? 'transparent',
            borderWidth: v.border ? 1 : 0,
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            transform: [{ scale }],
          },
          !isDisabled && v.elevated ? shadows.sm : null,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <Text size={s.fontSize} weight="semibold" style={{ color: v.text, letterSpacing: 0.2 }}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
