import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import * as tokenStore from '../auth/tokenStore';
import { acquireSlot, pauseFor, waitIfPaused } from './rateLimiter';
import type { LoginResponse, ConflictResponse } from '../types/api';

export const BASE_URL = 'https://nyumban-assessment-0000d50c027d.herokuapp.com';

const ASSESSMENT_KEY = process.env.EXPO_PUBLIC_ASSESSMENT_KEY ?? '';

export interface FetchArgs {
  url: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  formData?: FormData;
}

export type QueryError =
  | { status: 401; kind: 'unauthorized'; message: string }
  | { status: 404; kind: 'not_found'; message: string }
  | { status: 409; kind: 'conflict'; property: ConflictResponse }
  | { status: 413; kind: 'too_large'; message: string }
  | { status: 422; kind: 'validation'; errors: Record<string, string> }
  | { status: 429; kind: 'rate_limited'; retryAfterSeconds: number }
  | { status: 500; kind: 'server_error'; message: string }
  | { status: 503; kind: 'unavailable'; message: string }
  | { status: 507; kind: 'storage_full'; message: string }
  | { status: -1; kind: 'network_error'; message: string };

function buildUrl(url: string, params?: FetchArgs['params']): string {
  const u = new URL(BASE_URL + url);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

async function rawFetch(args: FetchArgs, accessToken: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    'X-Assessment-Key': ASSESSMENT_KEY,
    ...args.headers,
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let body: BodyInit | undefined;
  if (args.formData) {
    body = args.formData;
  } else if (args.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(args.body);
  }

  await waitIfPaused();
  await acquireSlot();

  return fetch(buildUrl(args.url, args.params), { method: args.method ?? 'GET', headers, body });
}

export type RefreshOutcome = 'ok' | 'invalid' | 'network_error';

let refreshPromise: Promise<RefreshOutcome> | null = null;

async function doRefresh(): Promise<RefreshOutcome> {
  const session = tokenStore.getCachedSession();
  if (!session) return 'invalid';
  try {
    const res = await rawFetch(
      { url: '/auth/refresh', method: 'POST', body: { refreshToken: session.refreshToken } },
      null,
    );
    if (!res.ok) {

      await tokenStore.clearSession();
      return 'invalid';
    }
    const json = (await res.json()) as LoginResponse;
    await tokenStore.saveSession(tokenStore.sessionFromLoginResponse(json));
    return 'ok';
  } catch {
    return 'network_error';
  }
}

async function refreshOnceShared(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function ensureFreshAccessToken(): Promise<void> {
  const session = tokenStore.getCachedSession();
  if (!session) return;
  if (session.expiresAt - Date.now() < 60_000) {
    await refreshOnceShared();
  }
}

export async function validateSessionAtBoot(): Promise<boolean> {
  const session = tokenStore.getCachedSession();
  if (!session) return false;
  if (session.expiresAt - Date.now() > 60_000) return true;
  const outcome = await refreshOnceShared();
  return outcome !== 'invalid';
}

async function parseError(res: Response): Promise<QueryError> {
  const status = res.status;
  if (status === 429) {
    const retryAfterSeconds = Number(res.headers.get('Retry-After') ?? '1');
    pauseFor(retryAfterSeconds * 1000);
    return { status, kind: 'rate_limited', retryAfterSeconds };
  }
  if (status === 409) {
    const property = (await res.json().catch(() => null)) as ConflictResponse;
    return { status, kind: 'conflict', property };
  }
  if (status === 422) {
    const json = await res.json().catch(() => ({ errors: {} }));
    return { status, kind: 'validation', errors: json.errors ?? {} };
  }
  if (status === 413) {
    const json = await res.json().catch(() => ({ error: 'File too large' }));
    return { status, kind: 'too_large', message: json.error };
  }
  if (status === 507) {
    const json = await res.json().catch(() => ({ error: 'Photo storage is full' }));
    return { status, kind: 'storage_full', message: json.error };
  }
  if (status === 503) {
    const json = await res.json().catch(() => ({ error: 'Service unavailable' }));
    return { status, kind: 'unavailable', message: json.error };
  }
  if (status === 401) {
    const json = await res.json().catch(() => ({ error: 'Unauthorized' }));
    return { status, kind: 'unauthorized', message: json.error };
  }
  if (status === 404) {
    const json = await res.json().catch(() => ({ error: 'Not found' }));
    return { status, kind: 'not_found', message: json.error };
  }
  const json = await res.json().catch(() => ({ error: 'Internal server error' }));
  return { status: 500, kind: 'server_error', message: json.error ?? 'Internal server error' };
}

export const customBaseQuery: BaseQueryFn<FetchArgs, unknown, QueryError> = async (args) => {
  const isAuthEndpoint = args.url === '/auth/login' || args.url === '/auth/refresh';
  if (!isAuthEndpoint) await ensureFreshAccessToken();

  const session = tokenStore.getCachedSession();
  let res: Response;
  try {
    res = await rawFetch(args, isAuthEndpoint ? null : (session?.accessToken ?? null));
  } catch {
    return { error: { status: -1, kind: 'network_error', message: 'Network request failed' } };
  }

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { data };
  }

  if (res.status === 401 && !isAuthEndpoint) {
    const outcome = await refreshOnceShared();
    if (outcome === 'invalid') {
      return { error: { status: 401, kind: 'unauthorized', message: 'Session expired — please sign in again' } };
    }
    if (outcome === 'network_error') {
      return { error: { status: -1, kind: 'network_error', message: 'Network request failed' } };
    }
    const retrySession = tokenStore.getCachedSession();
    try {
      res = await rawFetch(args, retrySession?.accessToken ?? null);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { data };
      }
    } catch {
      return { error: { status: -1, kind: 'network_error', message: 'Network request failed' } };
    }
  }

  return { error: await parseError(res) };
};
