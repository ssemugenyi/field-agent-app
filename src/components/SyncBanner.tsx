import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';

export function SyncBanner() {
  const isOnline = useAppSelector((s) => s.connectivity.isOnline);
  const pendingCount = useAppSelector((s) => s.syncStatus.pendingCount);
  const engineState = useAppSelector((s) => s.syncStatus.engineState);

  if (isOnline === false) {
    return (
      <View style={[styles.banner, styles.offline]}>
        <Text size="xs" weight="semibold" style={{ color: colors.textInverse }}>
          Offline — your work is saved and will sync when you're back online
        </Text>
      </View>
    );
  }

  if (engineState === 'syncing' || pendingCount > 0) {
    return (
      <View style={[styles.banner, styles.syncing]}>
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
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: colors.textMuted,
  },
  syncing: {
    backgroundColor: colors.info,
  },
});
