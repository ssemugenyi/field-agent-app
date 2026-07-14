const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 16;

const timestamps: number[] = [];
let pausedUntil = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitIfPaused(): Promise<void> {
  const remaining = pausedUntil - Date.now();
  if (remaining > 0) await sleep(remaining);
}

export function pauseFor(ms: number): void {
  pausedUntil = Math.max(pausedUntil, Date.now() + ms);
}

export async function acquireSlot(): Promise<void> {
  for (;;) {
    await waitIfPaused();
    const now = Date.now();
    while (timestamps.length && now - timestamps[0] >= WINDOW_MS) {
      timestamps.shift();
    }
    if (timestamps.length < MAX_PER_WINDOW) {
      timestamps.push(now);
      return;
    }
    await sleep(WINDOW_MS - (now - timestamps[0]) + 10);
  }
}
