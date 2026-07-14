import type { PropertyStatus, Region } from './api';

export interface Property {
  id: string;
  name: string;
  address: string | null;
  unitCount: number | null;
  region: Region;
  lastInspectedAt: string | null;
  status: PropertyStatus;
  version: number;
  syncedAt: number;
}

export interface Room {
  propertyId: string;
  id: string;
  label: string;
  floor: number;
}

export const ROOM_CONDITIONS = ['good', 'fair', 'poor', 'needs_repair'] as const;
export type RoomCondition = (typeof ROOM_CONDITIONS)[number];

export interface InspectionRoomDraft {
  roomId: string;
  roomLabel: string;
  condition: RoomCondition | null;
  notes: string;
  photoLocalIds: string[];
}

export type InspectionStatus =
  | 'draft'
  | 'queued'
  | 'uploading_photos'
  | 'submitting'
  | 'synced'
  | 'conflict'
  | 'failed';

export interface InspectionDraft {
  localId: string;
  serverId: string | null;
  propertyId: string;
  propertyVersionAtStart: number;
  type: string;
  rooms: InspectionRoomDraft[];
  completedAt: number | null;
  status: InspectionStatus;
  idempotencyKey: string | null;
  conflictRetryCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export type PhotoStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface PhotoRecord {
  localId: string;
  localUri: string;
  inspectionLocalId: string;
  roomId: string;
  serverId: string | null;
  status: PhotoStatus;
  createdAt: number;
}
