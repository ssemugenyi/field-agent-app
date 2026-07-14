import { getDb } from './client';

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export const SYNC_META_KEYS = {
  portfolioCursor: 'portfolio_cursor',
  portfolioSyncedCount: 'portfolio_synced_count',
  portfolioComplete: 'portfolio_complete',
  lastFullSyncAt: 'last_full_sync_at',
} as const;
