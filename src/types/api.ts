export type Region = 'central' | 'eastern' | 'western' | 'northern';
export type PropertyStatus = 'active' | 'inactive' | 'under_renovation';

export interface LoginResponse {
  access_token: string;
  refreshToken: string;
  expires_in: number;
  agent: {
    id: string;
    display_name: string;
    assignedRegion: string;
  };
}

export interface PropertyApi {
  id: string;
  name: string;
  address: string | null;
  unit_count: number | null;
  region: Region;
  last_inspected_at: string | null;
  status: PropertyStatus;
  version: number;
}

export interface RoomApi {
  id: string;
  label: string;
  floor: number;
}

export interface PropertyDetailApi extends PropertyApi {
  rooms: RoomApi[];
}

export interface PropertiesListResponse {
  data: PropertyApi[];
  next_cursor: string | null;
}

export interface InspectionRoomApi {
  roomId: string;
  condition: string;
  notes: string;
  photoIds: string[];
}

export interface InspectionSubmitRequest {
  propertyId: string;
  propertyVersion: number;
  type?: string;
  rooms: InspectionRoomApi[];
  completedAt: number;
}

export interface InspectionSubmitResponse {
  id: string;
  created: number;
  updated_at: number;
}

export interface InspectionApi {
  id: string;
  propertyId: string;
  type: string;
  rooms: InspectionRoomApi[];
  completedAt: number;
  created: number;
  updated_at: number;
}

export interface InspectionsListResponse {
  data: InspectionApi[];
  next_cursor: string | null;
}

export interface PhotoUploadResponse {
  id: string;
  url: string;
}

export interface ApiErrorFlat {
  error: string;
}

export interface ApiErrorValidation {
  errors: Record<string, string>;
}

export type ConflictResponse = PropertyDetailApi;
