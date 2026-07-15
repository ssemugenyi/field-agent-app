import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { space } from '../theme/spacing';

export type CardProps = ViewProps & {
  bordered?: boolean;
};

export function Card({ bordered = false, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.base, bordered ? styles.bordered : shadows.sm, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
