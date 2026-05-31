const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now };
}

if (typeof globalThis !== 'undefined' && !(globalThis as any).__rateLimitCleanup) {
  (globalThis as any).__rateLimitCleanup = true;
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateMap) {
        if (now > entry.resetAt) rateMap.delete(key);
      }
    }, 60_000);
  }
}
