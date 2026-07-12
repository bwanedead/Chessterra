/**
 * Sliding-window rate limiter, in-memory per server instance.
 *
 * Scope note: on serverless (Vercel) each instance keeps its own counters,
 * so this is a best-effort guard against tight loops and scripted spam,
 * not a distributed quota. Platform-level protection (Vercel WAF) plus a
 * shared store (e.g. Upstash) are the production upgrades — documented in
 * docs/development-insights/rate-limits.md.
 */

export interface RateLimitPolicy {
  /** Max requests allowed inside the window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds the caller should wait before retrying (0 when allowed). */
  retryAfterSeconds: number;
}

interface WindowEntry {
  timestamps: number[];
}

const buckets = new Map<string, WindowEntry>();

/** Bounded cleanup so long-lived instances do not accumulate stale keys. */
const MAX_BUCKETS = 10_000;

const pruneStale = (now: number, maxWindowMs: number): void => {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }
  for (const [key, entry] of buckets) {
    const newest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
    if (now - newest > maxWindowMs) {
      buckets.delete(key);
    }
  }
};

export const checkRateLimit = (
  key: string,
  policy: RateLimitPolicy,
  now: number = Date.now(),
): RateLimitResult => {
  pruneStale(now, policy.windowMs);

  const entry = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - policy.windowMs;
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

  if (entry.timestamps.length >= policy.limit) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = oldest + policy.windowMs - now;
    buckets.set(key, entry);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);
  return { allowed: true, retryAfterSeconds: 0 };
};

/** Test helper — reset all counters. */
export const clearRateLimitBuckets = (): void => {
  buckets.clear();
};
