import { listByStatus, markStatus } from '../db/inspections.repo';

const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

export async function reconcileStuckInspections(): Promise<void> {
  const stuck = (await listByStatus(['submitting', 'uploading_photos'])).filter(
    (d) => Date.now() - d.updatedAt > STUCK_THRESHOLD_MS,
  );
  for (const draft of stuck) {
    await markStatus(draft.localId, 'queued');
  }
}
