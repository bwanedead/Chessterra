import { NextResponse } from 'next/server';
import type { RequestActor } from '@/server/auth/types';
import {
  logMatchRoute,
  logMatchRouteException,
  type MatchRouteLogFields,
} from './matchRouteLog';

type Action = MatchRouteLogFields['action'];

export interface MatchRouteResponder {
  ok: (body: unknown, actor?: RequestActor) => NextResponse;
  fail: (
    status: number,
    body: { error: string; code?: string },
    actor?: RequestActor,
  ) => NextResponse;
  rateLimited: (retryAfterSeconds: number, actor?: RequestActor) => NextResponse;
  exception: (error: unknown) => NextResponse;
  setMatchId: (matchId: string) => void;
}

/**
 * Per-request responder that pairs every match API response with one
 * structured log line (action, actor, status, code, duration).
 */
export const createMatchRouteResponder = (
  action: Action,
  matchId?: string,
): MatchRouteResponder => {
  const startedAt = performance.now();
  let currentMatchId = matchId;

  return {
    setMatchId(nextMatchId) {
      currentMatchId = nextMatchId;
    },

    ok(body, actor) {
      logMatchRoute({
        action,
        matchId: currentMatchId,
        actorId: actor?.userId ?? null,
        actorIsGuest: actor?.isGuest,
        ok: true,
        status: 200,
        durationMs: performance.now() - startedAt,
      });
      return NextResponse.json(body);
    },

    fail(status, body, actor) {
      logMatchRoute({
        action,
        matchId: currentMatchId,
        actorId: actor?.userId ?? null,
        actorIsGuest: actor?.isGuest,
        ok: false,
        status,
        code: body.code ?? null,
        durationMs: performance.now() - startedAt,
      });
      return NextResponse.json(body, { status });
    },

    rateLimited(retryAfterSeconds, actor) {
      logMatchRoute({
        action,
        matchId: currentMatchId,
        actorId: actor?.userId ?? null,
        actorIsGuest: actor?.isGuest,
        ok: false,
        status: 429,
        code: 'rate_limited',
        durationMs: performance.now() - startedAt,
      });
      return NextResponse.json(
        { error: 'Too many requests — please slow down.', code: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      );
    },

    exception(error) {
      logMatchRouteException(action, currentMatchId, error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'internal' },
        { status: 500 },
      );
    },
  };
};
