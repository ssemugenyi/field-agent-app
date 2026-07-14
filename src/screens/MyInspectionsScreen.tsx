import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listAll } from '../db/inspections.repo';
import { getProperty } from '../db/properties.repo';
import { kickSync } from '../sync/syncEngine';
import { useAppSelector } from '../store/hooks';
import { Badge, Text } from '../components';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';
import type { InspectionDraft, InspectionStatus } from '../types/domain';
import type { InspectionsStackParamList } from '../navigation/types';

interface Row {
  draft: InspectionDraft;
  propertyName: string;
}

const STATUS_META: Record<InspectionStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'error' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  queued: { label: 'Queued', variant: 'info' },
  uploading_photos: { label: 'Uploading photos', variant: 'info' },
  submitting: { label: 'Submitting', variant: 'info' },
  synced: { label: 'Synced', variant: 'success' },
  conflict: { label: 'Needs attention', variant: 'warning' },
  failed: { label: 'Needs attention', variant: 'error' },
};

function InspectionRow({ row, onPress }: { row: Row; onPress: () => void }) {
  const meta = STATUS_META[row.draft.status];
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text size="base" weight="semibold" style={styles.rowTitle} numberOfLines={1}>
          {row.propertyName}
        </Text>
        <Badge label={meta.label} variant={meta.variant} />
      </View>
      <Text size="xs" color="textMuted">
        Updated {new Date(row.draft.updatedAt).toLocaleString()}
      </Text>
    </Pressable>
  );
}

export default function MyInspectionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InspectionsStackParamList>>();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const pendingCount = useAppSelector((s) => s.syncStatus.pendingCount);

  const reload = useCallback(async () => {
    const drafts = await listAll();
    const withNames = await Promise.all(
      drafts.map(async (draft) => {
        const property = await getProperty(draft.propertyId);
        return { draft, propertyName: property?.name ?? 'Unknown property' };
      }),
    );
    setRows(withNames);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    if (pendingCount === 0) return;
    const interval = setInterval(reload, 1500);
    return () => clearInterval(interval);
  }, [pendingCount, reload]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await kickSync();
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <FlashList
        data={rows}
        keyExtractor={(item) => item.draft.localId}
        renderItem={({ item }) => (
          <InspectionRow row={item} onPress={() => navigation.navigate('InspectionDetail', { inspectionLocalId: item.draft.localId })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text size="sm" color="textMuted">
              No inspections yet. Start one from a property's detail screen.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: space.xl,
  },
  row: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  rowTitle: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginLeft: space.md,
  },
  empty: {
    padding: space.xl,
    alignItems: 'center',
  },
});
