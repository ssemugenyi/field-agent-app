export async function withBackoffRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: unknown) => boolean,
  maxAttempts = 4,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (!isRetryable(err) || attempt >= maxAttempts) throw err;
      const backoffMs = Math.min(15_000, 500 * 2 ** attempt) + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}
