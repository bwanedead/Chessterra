import { checkRateLimit, type RateLimitPolicy, type RateLimitResult } from './rateLimit';

export type RateLimitedAction = 'create' | 'join' | 'move' | 'resign' | 'read';

/**
 * Per-actor budgets. Generous for humans, hostile to scripts:
 * - create: invite spam guard (guests can rotate ids, so create is also IP-limited)
 * - move: 2/s sustained covers bullet bursts without allowing engine floods
 */
export const MATCH_RATE_POLICIES: Record<RateLimitedAction, RateLimitPolicy> = {
  create: { limit: 10, windowMs: 5 * 60_000 },
  join: { limit: 20, windowMs: 5 * 60_000 },
  move: { limit: 120, windowMs: 60_000 },
  resign: { limit: 10, windowMs: 60_000 },
  read: { limit: 120, windowMs: 60_000 },
};

/** Create is additionally keyed by IP because guest ids are client-chosen. */
export const CREATE_IP_POLICY: RateLimitPolicy = { limit: 30, windowMs: 5 * 60_000 };

export const clientIpFromRequest = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
};

export const checkMatchRateLimit = (
  action: RateLimitedAction,
  actorId: string,
  request?: Request,
): RateLimitResult => {
  const actorResult = checkRateLimit(`match:${action}:${actorId}`, MATCH_RATE_POLICIES[action]);
  if (!actorResult.allowed) {
    return actorResult;
  }

  if (action === 'create' && request) {
    const ip = clientIpFromRequest(request);
    const ipResult = checkRateLimit(`match:create-ip:${ip}`, CREATE_IP_POLICY);
    if (!ipResult.allowed) {
      return ipResult;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
};
