import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLoginMutation } from '../api/apiSlice';
import * as tokenStore from '../auth/tokenStore';
import { setAuthenticated } from '../auth/authSlice';
import { useAppDispatch } from '../store/hooks';
import { Button, Input, Text } from '../components';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState(__DEV__ ? 'agent@nyumban.test' : '');
  const [password, setPassword] = useState(__DEV__ ? 'Kireka2026!' : '');
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    try {
      const res = await login({ email: email.trim(), password }).unwrap();
      const session = tokenStore.sessionFromLoginResponse(res);
      await tokenStore.saveSession(session);
      dispatch(
        setAuthenticated({
          agentId: session.agentId,
          agentDisplayName: session.agentDisplayName,
          agentRegion: session.agentRegion,
        }),
      );
    } catch (err: any) {
      if (err?.status === 401) {
        setFormError('Incorrect email or password.');
      } else if (err?.kind === 'network_error') {
        setFormError('No connection — sign in requires network the first time.');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text size="3xl" weight="bold" style={styles.title}>
          Nyumban
        </Text>
        <Text size="base" color="textMuted" style={styles.subtitle}>
          Sign in to start your field inspections.
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="agent@nyumban.test"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry
          autoCapitalize="none"
        />

        {formError ? (
          <Text size="sm" color="error" style={styles.error}>
            {formError}
          </Text>
        ) : null}

        <Button
          label={isLoading ? 'Signing in…' : 'Sign in'}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  title: {
    marginBottom: space.xs,
  },
  subtitle: {
    marginBottom: space.xl,
  },
  error: {
    marginBottom: space.sm,
  },
  submit: {
    marginTop: space.sm,
  },
});
