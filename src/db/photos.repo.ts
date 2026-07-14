import { getDb } from './client';
import type { PhotoRecord, PhotoStatus } from '../types/domain';

interface PhotoRow {
  local_id: string;
  local_uri: string;
  inspection_local_id: string;
  room_id: string;
  server_id: string | null;
  status: PhotoStatus;
  created_at: number;
}

function rowToPhoto(row: PhotoRow): PhotoRecord {
  return {
    localId: row.local_id,
    localUri: row.local_uri,
    inspectionLocalId: row.inspection_local_id,
    roomId: row.room_id,
    serverId: row.server_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function insertPhoto(
  localId: string,
  localUri: string,
  inspectionLocalId: string,
  roomId: string,
): Promise<PhotoRecord> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO photos (local_id, local_uri, inspection_local_id, room_id, server_id, status, created_at)
     VALUES (?, ?, ?, ?, NULL, 'pending', ?)`,
    [localId, localUri, inspectionLocalId, roomId, now],
  );
  return { localId, localUri, inspectionLocalId, roomId, serverId: null, status: 'pending', createdAt: now };
}

export async function getPhoto(localId: string): Promise<PhotoRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE local_id = ?', [localId]);
  return row ? rowToPhoto(row) : null;
}

export async function listPhotosForInspection(inspectionLocalId: string): Promise<PhotoRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE inspection_local_id = ? ORDER BY created_at ASC',
    [inspectionLocalId],
  );
  return rows.map(rowToPhoto);
}

export async function markUploaded(localId: string, serverId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE photos SET status = 'uploaded', server_id = ? WHERE local_id = ?`, [serverId, localId]);
}

export async function markPhotoStatus(localId: string, status: PhotoStatus): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE photos SET status = ? WHERE local_id = ?', [status, localId]);
}

export async function deletePhotoRow(localId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM photos WHERE local_id = ?', [localId]);
}
