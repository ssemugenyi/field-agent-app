import { store } from '../store';
import { api } from '../api/apiSlice';
import { getMeta, setMeta, SYNC_META_KEYS } from '../db/syncMeta.repo';
import { countProperties } from '../db/properties.repo';
import { setPortfolioProgress, setLastError } from './syncStatusSlice';
import type { PropertiesListResponse } from '../types/api';

const PAGE_LIMIT = 50;
const MAX_ATTEMPTS_PER_PAGE = 6;

let running = false;

async function fetchPageWithRetry(cursor: string | undefined): Promise<PropertiesListResponse> {
  let attempt = 0;
  for (;;) {
    const action = store.dispatch(
      api.endpoints.getProperties.initiate({ cursor, limit: PAGE_LIMIT }, { forceRefetch: true }),
    );
    try {
      const data = await action.unwrap();

      action.unsubscribe();
      return data;
    } catch (err) {
      action.unsubscribe();
      attempt++;
      if (attempt >= MAX_ATTEMPTS_PER_PAGE) throw err;
      const backoffMs = Math.min(30_000, 500 * 2 ** attempt) + Math.random() * 300;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

export async function runPortfolioSync(opts: { forceRestart?: boolean } = {}): Promise<void> {
  if (running) return;
  running = true;
  try {
    if (opts.forceRestart) {
      await setMeta(SYNC_META_KEYS.portfolioComplete, '0');
      await setMeta(SYNC_META_KEYS.portfolioCursor, '');
    }

    let cursor = (await getMeta(SYNC_META_KEYS.portfolioCursor)) || undefined;

    for (;;) {
      let page: PropertiesListResponse;
      try {
        page = await fetchPageWithRetry(cursor);
      } catch {
        store.dispatch(setLastError('Portfolio sync paused (connection issue) — will resume automatically.'));
        break;
      }

      cursor = page.next_cursor ?? undefined;
      const synced = await countProperties();

      if (cursor) {
        await setMeta(SYNC_META_KEYS.portfolioCursor, cursor);
        store.dispatch(setPortfolioProgress({ synced, complete: false }));
      } else {
        await setMeta(SYNC_META_KEYS.portfolioComplete, '1');
        await setMeta(SYNC_META_KEYS.lastFullSyncAt, String(Date.now()));
        store.dispatch(setPortfolioProgress({ synced, complete: true }));
        break;
      }
    }
  } finally {
    running = false;
  }
}

export async function isPortfolioComplete(): Promise<boolean> {
  return (await getMeta(SYNC_META_KEYS.portfolioComplete)) === '1';
}
