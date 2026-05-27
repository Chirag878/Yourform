import type { SubmissionRateLimiter, RateLimitResult } from './rate-limit';

/**
 * Stub adapter for future Redis/Upstash rollout.
 * Implement `hit` with atomic INCR + EXPIRE semantics in production.
 */
export class RedisSubmissionRateLimiter implements SubmissionRateLimiter {
  hit(_key: string): RateLimitResult {
    throw new Error('RedisSubmissionRateLimiter is not configured in this build.');
  }
}
