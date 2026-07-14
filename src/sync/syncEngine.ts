import { store } from '../store';
import { listByStatus } from '../db/inspections.repo';
import { processInspection } from './inspectionSync';
import { runPortfolioSync } from './propertySync';
import { reconcileStuckInspections } from './reconciliation';
import { setEngineState, setPendingCount, setLastSyncedAt } from './syncStatusSlice';

let draining = false;
let kickedAgainWhileDraining = false;

async function drainOnce(): Promise<void> {
  await reconcileStuckInspections();

  const items = await listByStatus(['queued', 'uploading_photos', 'submitting']);
  store.dispatch(setPendingCount(items.length));
  if (items.length === 0) return;

  store.dispatch(setEngineState('syncing'));
  for (const draft of items) {
    await processInspection(draft);
  }

  const remaining = await listByStatus(['queued', 'uploading_photos', 'submitting']);
  store.dispatch(setPendingCount(remaining.length));
  store.dispatch(setLastSyncedAt(Date.now()));
}

export async function kickSync(): Promise<void> {
  if (draining) {
    kickedAgainWhileDraining = true;
    return;
  }
  draining = true;
  try {
    do {
      kickedAgainWhileDraining = false;
      await drainOnce();

      runPortfolioSync();
    } while (kickedAgainWhileDraining);
  } finally {
    draining = false;
    store.dispatch(setEngineState('idle'));
  }
}
