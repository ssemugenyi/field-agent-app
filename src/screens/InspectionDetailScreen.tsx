import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InspectionsStackParamList } from '../navigation/types';
import { getDraft } from '../db/inspections.repo';
import { getProperty } from '../db/properties.repo';
import { Badge, Button, Card, Text } from '../components';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';
import type { InspectionDraft, Property } from '../types/domain';

type Props = NativeStackScreenProps<InspectionsStackParamList, 'InspectionDetail'>;

const STATUS_LABEL: Record<InspectionDraft['status'], string> = {
  draft: 'Draft — not yet submitted',
  queued: 'Queued to sync',
  uploading_photos: 'Uploading photos…',
  submitting: 'Submitting…',
  synced: 'Synced',
  conflict: 'Needs attention — conflict',
  failed: 'Needs attention — rejected',
};

export default function InspectionDetailScreen({ route, navigation }: Props) {
  const { inspectionLocalId } = route.params;
  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  const reload = useCallback(async () => {
    const d = await getDraft(inspectionLocalId);
    setDraft(d);
    if (d) setProperty(await getProperty(d.propertyId));
  }, [inspectionLocalId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!draft) {
    return (
      <View style={styles.screen}>
        <Text size="sm" color="textMuted">
          Loading…
        </Text>
      </View>
    );
  }

  const needsAttention = draft.status === 'conflict' || draft.status === 'failed';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text size="xl" weight="bold">
        {property?.name ?? 'Unknown property'}
      </Text>
      <Badge
        label={STATUS_LABEL[draft.status]}
        variant={needsAttention ? (draft.status === 'conflict' ? 'warning' : 'error') : draft.status === 'synced' ? 'success' : 'info'}
      />

      {needsAttention && draft.errorMessage ? (
        <Card bordered style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text size="sm" weight="semibold" color="error">
              What happened
            </Text>
          </View>
          <Text size="sm" color="textMuted">
            {draft.errorMessage}
          </Text>
        </Card>
      ) : null}

      <Text size="lg" weight="semibold" style={styles.sectionTitle}>
        Rooms
      </Text>
      <Card style={styles.card}>
        {draft.rooms.map((room, index) => (
          <View key={room.roomId} style={[styles.roomRow, index === draft.rooms.length - 1 && styles.roomRowLast]}>
            <Text size="sm" weight="medium">
              {room.roomLabel}
            </Text>
            <Text size="xs" color="textMuted">
              {room.condition ?? 'no condition set'} · {room.photoLocalIds.length} photo(s)
            </Text>
            {room.notes ? (
              <Text size="xs" color="textMuted">
                "{room.notes}"
              </Text>
            ) : null}
          </View>
        ))}
      </Card>

      {needsAttention ? (
        <Button
          label="Review & resubmit"
          onPress={() =>
            navigation.navigate('InspectionForm', { propertyId: draft.propertyId, inspectionLocalId: draft.localId })
          }
          style={styles.actionButton}
        />
      ) : draft.status === 'draft' ? (
        <Button
          label="Continue inspection"
          onPress={() =>
            navigation.navigate('InspectionForm', { propertyId: draft.propertyId, inspectionLocalId: draft.localId })
          }
          style={styles.actionButton}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: space.md,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  errorCard: {
    gap: space.xs,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  sectionTitle: {
    marginTop: space.sm,
  },
  card: {
    gap: 0,
  },
  roomRow: {
    gap: 2,
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  roomRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  actionButton: {
    marginTop: space.md,
  },
});
