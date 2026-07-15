import React from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';

export default function SplashScreen() {
  return (
    <View style={styles.screen}>
      <Image source={require('../../assets/images/nyumban-logo.png')} style={styles.logo} contentFit="contain" />
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: space.xl,
  },
  spinner: {
    marginTop: space.xs,
  },
});
