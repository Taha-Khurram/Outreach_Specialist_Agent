import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from '../src/utils/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxPerInterval: 5, interval: 1000 });
  });

  it('tracks daily count', async () => {
    assert.equal(limiter.todayCount, 0);
    await limiter.execute(() => 'test');
    assert.equal(limiter.todayCount, 1);
  });

  it('canProceed respects daily limit', async () => {
    assert.equal(limiter.canProceed(2), true);
    await limiter.execute(() => {});
    await limiter.execute(() => {});
    assert.equal(limiter.canProceed(2), false);
  });

  it('execute returns function result', async () => {
    const result = await limiter.execute(() => 42);
    assert.equal(result, 42);
  });

  it('resets count on new day', () => {
    limiter.counts.today = 100;
    limiter.counts.lastReset = 'Mon Jan 01 2020';
    assert.equal(limiter.todayCount, 0);
  });
});
