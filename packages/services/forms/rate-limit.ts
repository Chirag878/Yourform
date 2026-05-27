export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

export interface SubmissionRateLimiter {
  hit(key: string): RateLimitResult;
}

type Bucket = {
  count: number;
  resetAt: number;
};

export class InMemorySubmissionRateLimiter implements SubmissionRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
  ) {}

  hit(key: string): RateLimitResult {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt < now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }

    if (existing.count >= this.max) {
      return { allowed: false, retryAfterMs: Math.max(existing.resetAt - now, 0) };
    }

    existing.count += 1;
    return { allowed: true };
  }
}

/**
 * Placeholder hook for future distributed limiter (Redis/Upstash).
 * Keeps callsites stable while we ship in-memory for single-instance demos.
 */
export const createSubmissionRateLimiter = (windowMs: number, max: number): SubmissionRateLimiter => {
  return new InMemorySubmissionRateLimiter(windowMs, max);
};
