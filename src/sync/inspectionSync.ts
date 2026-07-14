import { File } from 'expo-file-system';
import { store } from '../store';
import { api } from '../api/apiSlice';
import {
  listPhotosForInspection,
  markUploaded,
  markPhotoStatus,
} from '../db/photos.repo';
import { markStatus, markSynced, updatePropertyVersion, incrementConflictRetry } from '../db/inspections.repo';
import { upsertPropertyDetail } from '../db/properties.repo';
import { withBackoffRetry } from './retry';
import type { InspectionDraft, PhotoRecord } from '../types/domain';
import type { QueryError } from '../api/baseQuery';
import type { ConflictResponse, InspectionRoomApi, InspectionSubmitRequest } from '../types/api';

const TRANSIENT_KINDS = new Set(['server_error', 'network_error', 'unavailable']);

function isTransient(err: unknown): boolean {
  const e = err as QueryError | undefined;
  return !!e && TRANSIENT_KINDS.has(e.kind);
}

async function uploadPhoto(photo: PhotoRecord): Promise<string> {
  const file = new File(photo.localUri);
  const formData = new FormData();

  formData.append(
    'file',
    { uri: photo.localUri, name: file.name || `${photo.localId}.jpg`, type: 'image/jpeg' } as unknown as Blob,
  );

  const res = await store.dispatch(api.endpoints.postPhoto.initiate(formData)).unwrap();
  return res.id;
}

async function ensurePhotosUploaded(inspectionLocalId: string): Promise<PhotoRecord[]> {
  const photos = await listPhotosForInspection(inspectionLocalId);
  for (const photo of photos) {
    if (photo.status === 'uploaded') continue;
    await markPhotoStatus(photo.localId, 'uploading');
    try {
      const serverId = await withBackoffRetry(() => uploadPhoto(photo), isTransient, 4);
      await markUploaded(photo.localId, serverId);
    } catch (err) {
      await markPhotoStatus(photo.localId, 'failed');
      throw err;
    }
  }
  return listPhotosForInspection(inspectionLocalId);
}

function buildSubmitBody(draft: InspectionDraft, photos: PhotoRecord[], propertyVersion: number): InspectionSubmitRequest {
  const photosByRoom = new Map<string, PhotoRecord[]>();
  for (const p of photos) {
    const list = photosByRoom.get(p.roomId) ?? [];
    list.push(p);
    photosByRoom.set(p.roomId, list);
  }

  const rooms: InspectionRoomApi[] = draft.rooms.map((r) => ({
    roomId: r.roomId,
    condition: r.condition ?? '',
    notes: r.notes,
    photoIds: r.photoLocalIds
      .map((localId) => photosByRoom.get(r.roomId)?.find((p) => p.localId === localId)?.serverId)
      .filter((id): id is string => Boolean(id)),
  }));

  return {
    propertyId: draft.propertyId,
    propertyVersion,
    type: draft.type,
    rooms,
    completedAt: draft.completedAt ?? Math.floor(Date.now() / 1000),
  };
}

async function submitInspection(idempotencyKey: string, body: InspectionSubmitRequest): Promise<{ id: string }> {
  return store.dispatch(api.endpoints.postInspection.initiate({ body, idempotencyKey })).unwrap();
}

async function cleanupLocalFiles(photos: PhotoRecord[]): Promise<void> {
  for (const p of photos) {
    try {
      const f = new File(p.localUri);
      if (f.exists) f.delete();
    } catch {}
  }
}

function sameRoomSet(draft: InspectionDraft, fresh: ConflictResponse): boolean {
  const draftIds = new Set(draft.rooms.map((r) => r.roomId));
  const freshIds = new Set(fresh.rooms.map((r) => r.id));
  return draftIds.size === freshIds.size && [...draftIds].every((id) => freshIds.has(id));
}

export type ProcessOutcome = 'synced' | 'conflict' | 'failed' | 'retry_later';

export async function processInspection(draft: InspectionDraft): Promise<ProcessOutcome> {
  await markStatus(draft.localId, 'uploading_photos');
  let photos: PhotoRecord[];
  try {
    photos = await ensurePhotosUploaded(draft.localId);
  } catch {
    await markStatus(draft.localId, 'queued');
    return 'retry_later';
  }

  await markStatus(draft.localId, 'submitting');
  const idempotencyKey = draft.idempotencyKey ?? '';
  let body = buildSubmitBody(draft, photos, draft.propertyVersionAtStart);

  try {
    const res = await withBackoffRetry(() => submitInspection(idempotencyKey, body), isTransient, 4);
    await markSynced(draft.localId, res.id);
    await cleanupLocalFiles(photos);
    return 'synced';
  } catch (err) {
    const queryError = err as QueryError;

    if (queryError.kind === 'conflict') {
      const fresh = queryError.property;
      await upsertPropertyDetail(fresh);

      if (!sameRoomSet(draft, fresh)) {
        await markStatus(
          draft.localId,
          'conflict',
          "This unit's rooms changed since you started this inspection. Review and resubmit.",
        );
        return 'conflict';
      }

      const retryCount = await incrementConflictRetry(draft.localId);
      if (retryCount > 1) {
        await markStatus(
          draft.localId,
          'conflict',
          'This property changed again after an automatic retry. Please review and resubmit.',
        );
        return 'conflict';
      }

      await updatePropertyVersion(draft.localId, fresh.version);
      body = { ...body, propertyVersion: fresh.version };

      try {
        const res = await withBackoffRetry(() => submitInspection(idempotencyKey, body), isTransient, 4);
        await markSynced(draft.localId, res.id);
        await cleanupLocalFiles(photos);
        return 'synced';
      } catch (err2) {
        const qe2 = err2 as QueryError;
        if (qe2.kind === 'conflict') {
          await markStatus(draft.localId, 'conflict', 'This property changed again. Please review and resubmit.');
          return 'conflict';
        }
        await markStatus(draft.localId, 'queued');
        return 'retry_later';
      }
    }

    if (queryError.kind === 'validation') {
      const message =
        Object.entries(queryError.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('; ') || 'The server rejected this inspection.';
      await markStatus(draft.localId, 'failed', message);
      return 'failed';
    }

    await markStatus(draft.localId, 'queued');
    return 'retry_later';
  }
}
