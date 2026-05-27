import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySubmissionRateLimiter } from './rate-limit';

test('rate limiter allows until max and then blocks', () => {
  const limiter = new InMemorySubmissionRateLimiter(60_000, 2);
  assert.equal(limiter.hit('k').allowed, true);
  assert.equal(limiter.hit('k').allowed, true);
  const blocked = limiter.hit('k');
  assert.equal(blocked.allowed, false);
  assert.equal(typeof blocked.retryAfterMs, 'number');
});
