import { getDb } from './client';
import type { InspectionDraft, InspectionRoomDraft, InspectionStatus } from '../types/domain';

interface InspectionRow {
  local_id: string;
  server_id: string | null;
  property_id: string;
  property_version_at_start: number;
  type: string;
  rooms_json: string;
  completed_at: number | null;
  status: InspectionStatus;
  idempotency_key: string | null;
  conflict_retry_count: number;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

function rowToDraft(row: InspectionRow): InspectionDraft {
  return {
    localId: row.local_id,
    serverId: row.server_id,
    propertyId: row.property_id,
    propertyVersionAtStart: row.property_version_at_start,
    type: row.type,
    rooms: JSON.parse(row.rooms_json) as InspectionRoomDraft[],
    completedAt: row.completed_at,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    conflictRetryCount: row.conflict_retry_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDraft(
  localId: string,
  propertyId: string,
  propertyVersion: number,
  rooms: InspectionRoomDraft[],
): Promise<InspectionDraft> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO inspections
      (local_id, server_id, property_id, property_version_at_start, type, rooms_json, completed_at, status, idempotency_key, conflict_retry_count, error_message, created_at, updated_at)
     VALUES (?, NULL, ?, ?, 'routine', ?, NULL, 'draft', NULL, 0, NULL, ?, ?)`,
    [localId, propertyId, propertyVersion, JSON.stringify(rooms), now, now],
  );
  return {
    localId,
    serverId: null,
    propertyId,
    propertyVersionAtStart: propertyVersion,
    type: 'routine',
    rooms,
    completedAt: null,
    status: 'draft',
    idempotencyKey: null,
    conflictRetryCount: 0,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getDraft(localId: string): Promise<InspectionDraft | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<InspectionRow>('SELECT * FROM inspections WHERE local_id = ?', [localId]);
  return row ? rowToDraft(row) : null;
}

export async function getActiveDraftForProperty(propertyId: string): Promise<InspectionDraft | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<InspectionRow>(
    `SELECT * FROM inspections WHERE property_id = ? AND status != 'synced' ORDER BY updated_at DESC LIMIT 1`,
    [propertyId],
  );
  return row ? rowToDraft(row) : null;
}

export async function updateDraftRooms(localId: string, rooms: InspectionRoomDraft[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE inspections SET rooms_json = ?, updated_at = ? WHERE local_id = ?', [
    JSON.stringify(rooms),
    Date.now(),
    localId,
  ]);
}

export async function markQueued(localId: string, completedAt: number, idempotencyKey: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE inspections SET status = 'queued', completed_at = ?, idempotency_key = ?, updated_at = ? WHERE local_id = ?`,
    [completedAt, idempotencyKey, Date.now(), localId],
  );
}

export async function markStatus(localId: string, status: InspectionStatus, errorMessage: string | null = null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE inspections SET status = ?, error_message = ?, updated_at = ? WHERE local_id = ?', [
    status,
    errorMessage,
    Date.now(),
    localId,
  ]);
}

export async function markSynced(localId: string, serverId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE inspections SET status = 'synced', server_id = ?, error_message = NULL, updated_at = ? WHERE local_id = ?`,
    [serverId, Date.now(), localId],
  );
}

export async function incrementConflictRetry(localId: string): Promise<number> {
  const db = await getDb();
  await db.runAsync('UPDATE inspections SET conflict_retry_count = conflict_retry_count + 1, updated_at = ? WHERE local_id = ?', [
    Date.now(),
    localId,
  ]);
  const row = await db.getFirstAsync<{ conflict_retry_count: number }>(
    'SELECT conflict_retry_count FROM inspections WHERE local_id = ?',
    [localId],
  );
  return row?.conflict_retry_count ?? 0;
}

export async function updatePropertyVersion(localId: string, propertyVersion: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE inspections SET property_version_at_start = ?, updated_at = ? WHERE local_id = ?', [
    propertyVersion,
    Date.now(),
    localId,
  ]);
}

export async function listByStatus(statuses: InspectionStatus[]): Promise<InspectionDraft[]> {
  const db = await getDb();
  const placeholders = statuses.map(() => '?').join(',');
  const rows = await db.getAllAsync<InspectionRow>(
    `SELECT * FROM inspections WHERE status IN (${placeholders}) ORDER BY updated_at ASC`,
    statuses,
  );
  return rows.map(rowToDraft);
}

export async function listAll(): Promise<InspectionDraft[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<InspectionRow>('SELECT * FROM inspections ORDER BY updated_at DESC');
  return rows.map(rowToDraft);
}
