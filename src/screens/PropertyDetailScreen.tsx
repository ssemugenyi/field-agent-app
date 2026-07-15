import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Crypto from 'expo-crypto';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PropertiesStackParamList } from '../navigation/types';
import { useGetPropertyDetailQuery } from '../api/apiSlice';
import { getProperty, getRoomsForProperty } from '../db/properties.repo';
import { createDraft, getActiveDraftForProperty } from '../db/inspections.repo';
import { Badge, Button, Card, Text } from '../components';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';
import type { Property, Room, InspectionDraft } from '../types/domain';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyDetail'>;

const STATUS_LABEL: Record<InspectionDraft['status'], string> = {
  draft: 'Resume draft',
  queued: 'Queued to sync',
  uploading_photos: 'Uploading photos…',
  submitting: 'Submitting…',
  synced: 'Synced',
  conflict: 'Needs attention',
  failed: 'Needs attention',
};

export default function PropertyDetailScreen({ route, navigation }: Props) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeDraft, setActiveDraft] = useState<InspectionDraft | null>(null);
  const [starting, setStarting] = useState(false);

  const reload = useCallback(async () => {
    const [p, r, d] = await Promise.all([
      getProperty(propertyId),
      getRoomsForProperty(propertyId),
      getActiveDraftForProperty(propertyId),
    ]);
    setProperty(p);
    setRooms(r);
    setActiveDraft(d);
  }, [propertyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const { isSuccess } = useGetPropertyDetailQuery(propertyId);
  useEffect(() => {
    if (isSuccess) reload();
  }, [isSuccess, reload]);

  const handleStartOrResume = async () => {
    if (!property) return;
    if (activeDraft) {
      navigation.navigate('InspectionForm', { propertyId, inspectionLocalId: activeDraft.localId });
      return;
    }
    setStarting(true);
    try {
      const localId = Crypto.randomUUID();
      await createDraft(
        localId,
        propertyId,
        property.version,
        rooms.map((r) => ({ roomId: r.id, roomLabel: r.label, condition: null, notes: '', photoLocalIds: [] })),
      );
      navigation.navigate('InspectionForm', { propertyId, inspectionLocalId: localId });
    } finally {
      setStarting(false);
    }
  };

  if (!property) {
    return (
      <View style={styles.screen}>
        <Text size="sm" color="textMuted">
          This property hasn't been downloaded yet — connect to the internet once to view it.
        </Text>
      </View>
    );
  }

  const roomsUnavailable = rooms.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text size="2xl" weight="bold">
        {property.name}
      </Text>
      <Text size="sm" color="textMuted" style={styles.address}>
        {property.address ?? 'No address on file'}
      </Text>

      <View style={styles.badgeRow}>
        <Badge label={property.status.replace('_', ' ')} variant={property.status === 'active' ? 'success' : 'neutral'} />
        <Badge label={property.region} variant="info" />
      </View>

      <Card style={styles.card}>
        <View style={styles.statRow}>
          <Feather name="grid" size={16} color={colors.textMuted} />
          <Text size="sm" color="textMuted">
            {property.unitCount != null ? `${property.unitCount} units` : 'Unit count not on file'}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Feather name="clock" size={16} color={colors.textMuted} />
          <Text size="sm" color="textMuted">
            {property.lastInspectedAt
              ? `Last inspected ${new Date(property.lastInspectedAt).toLocaleDateString()}`
              : 'Never inspected'}
          </Text>
        </View>
      </Card>

      <Text size="lg" weight="semibold" style={styles.sectionTitle}>
        Rooms
      </Text>
      {roomsUnavailable ? (
        <Card bordered style={styles.card}>
          <Text size="sm" color="textMuted">
            This unit's room list hasn't been downloaded yet. Connect to the internet once while viewing this
            property to load it — after that it's available offline.
          </Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          {rooms.map((room, index) => (
            <View key={room.id} style={[styles.roomRow, index === rooms.length - 1 && styles.roomRowLast]}>
              <Text size="sm">{room.label}</Text>
              <Text size="xs" color="textMuted">
                Floor {room.floor}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {activeDraft ? (
        <Text size="xs" color="textMuted" style={styles.draftStatus}>
          Existing inspection: {STATUS_LABEL[activeDraft.status]}
        </Text>
      ) : null}

      <Button
        label={activeDraft ? 'Resume inspection' : 'Start inspection'}
        onPress={handleStartOrResume}
        disabled={roomsUnavailable || starting}
        loading={starting}
        style={styles.startButton}
      />
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
  },
  address: {
    marginBottom: space.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  card: {
    marginBottom: space.md,
    gap: space.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  sectionTitle: {
    marginBottom: space.sm,
  },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  roomRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  draftStatus: {
    marginBottom: space.sm,
  },
  startButton: {
    marginTop: space.sm,
  },
});
