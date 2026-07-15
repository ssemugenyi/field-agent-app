import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';

function PulsingDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View style={[styles.dot, { opacity: pulse }]} />;
}

export function SyncBanner() {
  const isOnline = useAppSelector((s) => s.connectivity.isOnline);
  const pendingCount = useAppSelector((s) => s.syncStatus.pendingCount);
  const engineState = useAppSelector((s) => s.syncStatus.engineState);

  if (isOnline === false) {
    return (
      <View style={[styles.banner, styles.offline]}>
        <View style={styles.staticDot} />
        <Text size="xs" weight="semibold" style={{ color: colors.textInverse }}>
          Offline — your work is saved and will sync when you're back online
        </Text>
      </View>
    );
  }

  if (engineState === 'syncing' || pendingCount > 0) {
    return (
      <View style={[styles.banner, styles.syncing]}>
        <PulsingDot />
        <Text size="xs" weight="semibold" style={{ color: colors.textInverse }}>
          {pendingCount > 0 ? `Syncing ${pendingCount} inspection${pendingCount > 1 ? 's' : ''}…` : 'Syncing…'}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  offline: {
    backgroundColor: colors.secondary,
  },
  syncing: {
    backgroundColor: colors.info,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
  },
  staticDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
    opacity: 0.7,
  },
});
