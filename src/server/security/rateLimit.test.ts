import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, clearRateLimitBuckets } from './rateLimit';
import { checkMatchRateLimit, clientIpFromRequest, MATCH_RATE_POLICIES } from './matchRateLimits';

describe('checkRateLimit', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it('allows requests under the limit', () => {
    const policy = { limit: 3, windowMs: 1000 };
    expect(checkRateLimit('k', policy, 0).allowed).toBe(true);
    expect(checkRateLimit('k', policy, 100).allowed).toBe(true);
    expect(checkRateLimit('k', policy, 200).allowed).toBe(true);
  });

  it('blocks the request over the limit with retry-after', () => {
    const policy = { limit: 2, windowMs: 10_000 };
    checkRateLimit('k', policy, 0);
    checkRateLimit('k', policy, 1000);
    const blocked = checkRateLimit('k', policy, 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('slides the window — old requests expire', () => {
    const policy = { limit: 2, windowMs: 1000 };
    checkRateLimit('k', policy, 0);
    checkRateLimit('k', policy, 100);
    expect(checkRateLimit('k', policy, 500).allowed).toBe(false);
    expect(checkRateLimit('k', policy, 1200).allowed).toBe(true);
  });

  it('keeps separate budgets per key', () => {
    const policy = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit('a', policy, 0).allowed).toBe(true);
    expect(checkRateLimit('b', policy, 0).allowed).toBe(true);
    expect(checkRateLimit('a', policy, 1).allowed).toBe(false);
  });
});

describe('checkMatchRateLimit', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it('blocks a guest exceeding the move budget', () => {
    const actor = 'guest-spammer';
    for (let i = 0; i < MATCH_RATE_POLICIES.move.limit; i += 1) {
      expect(checkMatchRateLimit('move', actor).allowed).toBe(true);
    }
    expect(checkMatchRateLimit('move', actor).allowed).toBe(false);
  });

  it('limits create per IP even when guest ids rotate', () => {
    const request = new Request('http://localhost/api/matches', {
      headers: { 'x-forwarded-for': '203.0.113.9' },
    });
    let blocked = false;
    // Rotating actor ids dodges the per-actor budget; the IP budget must catch it.
    for (let i = 0; i < 100; i += 1) {
      const result = checkMatchRateLimit('create', `guest-${i}`, request);
      if (!result.allowed) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});

describe('clientIpFromRequest', () => {
  it('takes the first x-forwarded-for hop', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '198.51.100.7, 10.0.0.1' },
    });
    expect(clientIpFromRequest(request)).toBe('198.51.100.7');
  });

  it('falls back to x-real-ip then unknown', () => {
    const withRealIp = new Request('http://localhost/', {
      headers: { 'x-real-ip': '198.51.100.8' },
    });
    expect(clientIpFromRequest(withRealIp)).toBe('198.51.100.8');
    expect(clientIpFromRequest(new Request('http://localhost/'))).toBe('unknown');
  });
});
