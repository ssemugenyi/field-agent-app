import * as SecureStore from 'expo-secure-store';
import type { LoginResponse } from '../types/api';

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  agentId: string;
  agentDisplayName: string;
  agentRegion: string;
}

const STORAGE_KEY = 'nyumban_session_v1';

let cached: Session | null | undefined = undefined;

export function sessionFromLoginResponse(res: LoginResponse): Session {
  return {
    accessToken: res.access_token,
    refreshToken: res.refreshToken,
    expiresAt: Date.now() + res.expires_in * 1000,
    agentId: res.agent.id,
    agentDisplayName: res.agent.display_name,
    agentRegion: res.agent.assignedRegion,
  };
}

export async function loadSession(): Promise<Session | null> {
  if (cached !== undefined) return cached;
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  cached = raw ? (JSON.parse(raw) as Session) : null;
  return cached;
}

export async function saveSession(session: Session): Promise<void> {
  cached = session;
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export function getCachedSession(): Session | null {
  return cached ?? null;
}
