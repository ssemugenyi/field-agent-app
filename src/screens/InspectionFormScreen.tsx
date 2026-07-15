import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDraft, markQueued, updateDraftRooms } from '../db/inspections.repo';
import { getProperty } from '../db/properties.repo';
import { listPhotosForInspection } from '../db/photos.repo';
import { captureFromCamera, pickFromLibrary } from '../sync/photoCapture';
import { kickSync } from '../sync/syncEngine';
import { Button, Card, Text } from '../components';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { space } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { ROOM_CONDITIONS, type InspectionRoomDraft, type PhotoRecord, type RoomCondition } from '../types/domain';

type InspectionFormParams = { propertyId: string; inspectionLocalId: string };
type Props = {
  route: RouteProp<{ InspectionForm: InspectionFormParams }, 'InspectionForm'>;
  navigation: NativeStackNavigationProp<{ InspectionForm: InspectionFormParams }, 'InspectionForm'>;
};

const CONDITION_LABEL: Record<RoomCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  needs_repair: 'Needs repair',
};

const CONDITION_ICON: Record<RoomCondition, keyof typeof Feather.glyphMap> = {
  good: 'check-circle',
  fair: 'alert-circle',
  poor: 'alert-triangle',
  needs_repair: 'tool',
};

function RoomCard({
  room,
  onChange,
  onAddPhoto,
  photos,
}: {
  room: InspectionRoomDraft;
  onChange: (next: InspectionRoomDraft) => void;
  onAddPhoto: (source: 'camera' | 'library') => void;
  photos: PhotoRecord[];
}) {
  return (
    <Card style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text size="base" weight="semibold">
          {room.roomLabel}
        </Text>
        {room.condition ? (
          <Feather name={CONDITION_ICON[room.condition]} size={18} color={colors.primary} />
        ) : null}
      </View>

      <View style={styles.conditionRow}>
        {ROOM_CONDITIONS.map((c) => (
          <Button
            key={c}
            label={CONDITION_LABEL[c]}
            size="sm"
            variant={room.condition === c ? 'primary' : 'outline'}
            onPress={() => onChange({ ...room, condition: c })}
            style={styles.conditionButton}
          />
        ))}
      </View>

      <NotesInput value={room.notes} onChange={(notes) => onChange({ ...room, notes })} />

      {photos.length > 0 ? (
        <View style={styles.photoRow}>
          {photos.map((p) => (
            <Image key={p.localId} source={{ uri: p.localUri }} style={styles.thumbnail} contentFit="cover" />
          ))}
        </View>
      ) : null}
      <View style={styles.photoActions}>
        <Button
          label="Take photo"
          size="sm"
          variant="outline"
          onPress={() => onAddPhoto('camera')}
          style={styles.photoActionButton}
        />
        <Button
          label="Choose photo"
          size="sm"
          variant="ghost"
          onPress={() => onAddPhoto('library')}
          style={styles.photoActionButton}
        />
      </View>
    </Card>
  );
}

function NotesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Notes (optional)"
      placeholderTextColor={colors.textMuted}
      multiline
      numberOfLines={2}
      style={styles.plainInput}
    />
  );
}

export default function InspectionFormScreen({ route, navigation }: Props) {
  const { propertyId, inspectionLocalId } = route.params;
  const [propertyName, setPropertyName] = useState('');
  const [rooms, setRooms] = useState<InspectionRoomDraft[] | null>(null);
  const [photosByRoom, setPhotosByRoom] = useState<Record<string, PhotoRecord[]>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const loadedOnce = useRef(false);

  const reloadPhotos = useCallback(async () => {
    const all = await listPhotosForInspection(inspectionLocalId);
    const byRoom: Record<string, PhotoRecord[]> = {};
    for (const p of all) {
      (byRoom[p.roomId] ??= []).push(p);
    }
    setPhotosByRoom(byRoom);
  }, [inspectionLocalId]);

  useEffect(() => {
    (async () => {
      const [draft, property] = await Promise.all([getDraft(inspectionLocalId), getProperty(propertyId)]);
      if (draft) setRooms(draft.rooms);
      if (property) setPropertyName(property.name);
      await reloadPhotos();
      loadedOnce.current = true;
    })();
  }, [inspectionLocalId, propertyId, reloadPhotos]);

  useEffect(() => {
    if (!rooms || !loadedOnce.current) return;
    const t = setTimeout(() => {
      updateDraftRooms(inspectionLocalId, rooms);
    }, 400);
    return () => clearTimeout(t);
  }, [rooms, inspectionLocalId]);

  const updateRoom = (index: number, next: InspectionRoomDraft) => {
    setRooms((prev) => {
      if (!prev) return prev;
      const copy = prev.slice();
      copy[index] = next;
      return copy;
    });
  };

  const handleAddPhoto = async (roomId: string, source: 'camera' | 'library') => {
    const localId =
      source === 'camera'
        ? await captureFromCamera(inspectionLocalId, roomId)
        : await pickFromLibrary(inspectionLocalId, roomId);
    if (!localId) return;
    setRooms((prev) =>
      prev
        ? prev.map((r) => (r.roomId === roomId ? { ...r, photoLocalIds: [...r.photoLocalIds, localId] } : r))
        : prev,
    );
    await reloadPhotos();
  };

  const handleComplete = async () => {
    if (!rooms) return;
    const missing = rooms.filter((r) => !r.condition);
    if (missing.length > 0) {
      setValidationError(`Set a condition for: ${missing.map((r) => r.roomLabel).join(', ')}`);
      return;
    }
    setValidationError(null);
    setCompleting(true);
    try {
      await updateDraftRooms(inspectionLocalId, rooms);
      const idempotencyKey = Crypto.randomUUID();
      const completedAt = Math.floor(Date.now() / 1000);
      await markQueued(inspectionLocalId, completedAt, idempotencyKey);
      kickSync();
      navigation.goBack();
    } finally {
      setCompleting(false);
    }
  };

  if (!rooms) {
    return (
      <View style={styles.screen}>
        <Text size="sm" color="textMuted">
          Loading inspection…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text size="lg" weight="semibold" style={styles.header}>
        {propertyName}
      </Text>

      {rooms.map((room, index) => (
        <RoomCard
          key={room.roomId}
          room={room}
          photos={photosByRoom[room.roomId] ?? []}
          onChange={(next) => updateRoom(index, next)}
          onAddPhoto={(source) => handleAddPhoto(room.roomId, source)}
        />
      ))}

      {validationError ? (
        <View style={styles.validationCard}>
          <Feather name="alert-circle" size={16} color={colors.error} />
          <Text size="sm" color="error" style={styles.validationText}>
            {validationError}
          </Text>
        </View>
      ) : null}

      <Button label="Complete inspection" onPress={handleComplete} loading={completing} style={styles.completeButton} />
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
  header: {
    marginBottom: space.md,
  },
  roomCard: {
    marginBottom: space.md,
    gap: space.sm,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  conditionButton: {
    flexGrow: 1,
  },
  plainInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base.fontSize,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 48,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.borderMuted,
  },
  photoActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  photoActionButton: {
    flex: 1,
  },
  validationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.errorBg,
    borderRadius: radius.lg,
    padding: space.sm,
    marginBottom: space.sm,
  },
  validationText: {
    flex: 1,
  },
  completeButton: {
    marginTop: space.sm,
  },
});
