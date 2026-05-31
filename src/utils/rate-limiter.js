import PQueue from 'p-queue';

export class RateLimiter {
  constructor({ maxPerInterval, interval }) {
    this.queue = new PQueue({
      intervalCap: maxPerInterval,
      interval,
      carryoverConcurrencyCount: true
    });
    this.counts = { total: 0, today: 0, lastReset: new Date().toDateString() };
  }

  async execute(fn) {
    this.resetIfNewDay();
    return this.queue.add(async () => {
      this.counts.total++;
      this.counts.today++;
      return fn();
    });
  }

  resetIfNewDay() {
    const today = new Date().toDateString();
    if (this.counts.lastReset !== today) {
      this.counts.today = 0;
      this.counts.lastReset = today;
    }
  }

  get todayCount() {
    this.resetIfNewDay();
    return this.counts.today;
  }

  canProceed(dailyLimit) {
    this.resetIfNewDay();
    return this.counts.today < dailyLimit;
  }
}

export const apolloLimiter = new RateLimiter({ maxPerInterval: 5, interval: 60000 });
export const gmailLimiter = new RateLimiter({ maxPerInterval: 10, interval: 60000 });
