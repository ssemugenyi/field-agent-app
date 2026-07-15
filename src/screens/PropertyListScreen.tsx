import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { searchProperties } from '../db/properties.repo';
import { useAppSelector } from '../store/hooks';
import { Badge, Card, Input, Text } from '../components';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { space } from '../theme/spacing';
import type { Property } from '../types/domain';
import type { PropertyStatus, Region } from '../types/api';
import type { PropertiesStackParamList } from '../navigation/types';

const REGIONS: { label: string; value: Region | undefined }[] = [
  { label: 'All regions', value: undefined },
  { label: 'Central', value: 'central' },
  { label: 'Eastern', value: 'eastern' },
  { label: 'Western', value: 'western' },
  { label: 'Northern', value: 'northern' },
];

const STATUSES: { label: string; value: PropertyStatus | undefined }[] = [
  { label: 'All statuses', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Under renovation', value: 'under_renovation' },
];

function statusVariant(status: PropertyStatus): 'success' | 'neutral' | 'warning' {
  if (status === 'active') return 'success';
  if (status === 'under_renovation') return 'warning';
  return 'neutral';
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text size="xs" weight="semibold" color={selected ? 'textInverse' : 'textMuted'}>
        {label}
      </Text>
    </Pressable>
  );
}

function PropertyRow({ property, onPress }: { property: Property; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.rowHeader}>
          <Text size="base" weight="semibold" style={styles.rowTitle} numberOfLines={1}>
            {property.name}
          </Text>
          <Badge label={property.status.replace('_', ' ')} variant={statusVariant(property.status)} />
        </View>
        <Text size="sm" color="textMuted" numberOfLines={1}>
          {property.address ?? 'No address on file'}
        </Text>
        <View style={styles.rowFooter}>
          <View style={styles.rowFooterText}>
            <Text size="xs" color="textMuted">
              {property.unitCount != null ? `${property.unitCount} units` : 'Unit count unknown'} · {property.region}
            </Text>
            <Text size="xs" color="textMuted">
              {property.lastInspectedAt
                ? `Last inspected ${new Date(property.lastInspectedAt).toLocaleDateString()}`
                : 'Never inspected'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

export default function PropertyListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PropertiesStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [status, setStatus] = useState<PropertyStatus | undefined>(undefined);
  const [properties, setProperties] = useState<Property[]>([]);

  const portfolioSynced = useAppSelector((s) => s.syncStatus.portfolioSynced);
  const portfolioComplete = useAppSelector((s) => s.syncStatus.portfolioComplete);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(searchText.trim()), 250);
    return () => clearTimeout(t);
  }, [searchText]);

  const runSearch = useCallback(async () => {
    const results = await searchProperties({
      q: debouncedText || undefined,
      region,
      status,
      limit: 200,
    });
    setProperties(results);
  }, [debouncedText, region, status]);

  useEffect(() => {
    runSearch();
  }, [runSearch, portfolioSynced]);

  const listEmptyMessage = useMemo(() => {
    if (portfolioSynced === 0) return 'Downloading the property portfolio for offline use…';
    if (properties.length === 0) return 'No properties match your search.';
    return null;
  }, [portfolioSynced, properties.length]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchArea}>
        <Input placeholder="Search by name or address" value={searchText} onChangeText={setSearchText} style={styles.searchInput} />
        <View style={styles.chipRow}>
          {REGIONS.map((r) => (
            <Chip key={r.label} label={r.label} selected={region === r.value} onPress={() => setRegion(r.value)} />
          ))}
        </View>
        <View style={styles.chipRow}>
          {STATUSES.map((s) => (
            <Chip key={s.label} label={s.label} selected={status === s.value} onPress={() => setStatus(s.value)} />
          ))}
        </View>
        {!portfolioComplete ? (
          <Text size="xs" color="textMuted" style={styles.progress}>
            Syncing portfolio for offline use: {portfolioSynced.toLocaleString()} properties so far…
          </Text>
        ) : null}
      </View>

      <FlashList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyRow property={item} onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          listEmptyMessage ? (
            <View style={styles.empty}>
              <Text size="sm" color="textMuted">
                {listEmptyMessage}
              </Text>
            </View>
          ) : null
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
  searchArea: {
    padding: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  searchInput: {
    marginBottom: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  chip: {
    paddingVertical: space.xs / 1.5,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.borderMuted,
  },
  chipSelected: {
    backgroundColor: colors.secondary,
  },
  progress: {
    marginTop: space.sm,
  },
  listContent: {
    padding: space.md,
    paddingBottom: space.xl,
  },
  separator: {
    height: space.sm,
  },
  row: {
    gap: space.xs,
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
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
    gap: space.sm,
  },
  rowFooterText: {
    flex: 1,
    gap: 2,
  },
  empty: {
    padding: space.xl,
    alignItems: 'center',
  },
});
