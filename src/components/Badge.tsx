import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { space } from '../theme/spacing';
import { Text } from './Text';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
  error: { bg: colors.errorBg, text: colors.error },
  info: { bg: colors.infoBg, text: colors.info },
  neutral: { bg: colors.borderMuted, text: colors.textMuted },
};

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.base, { backgroundColor: v.bg }]}>
      <Text size="xs" weight="semibold" style={{ color: v.text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingVertical: space.xs * 0.75,
    paddingHorizontal: space.sm + 2,
  },
});
