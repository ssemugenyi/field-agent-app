import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { space } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      {label ? (
        <Text size="sm" weight="medium" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text size="xs" color="error" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text size="xs" color="textMuted" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space.md,
  },
  label: {
    marginBottom: space.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  helper: {
    marginTop: space.xs,
  },
});
