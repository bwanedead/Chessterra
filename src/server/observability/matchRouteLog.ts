import { createScopedLogger } from '@/shared/utils/logger';

const matchLogger = createScopedLogger('match-api');

export interface MatchRouteLogFields {
  action: 'create' | 'get' | 'join' | 'move' | 'resign' | 'history' | 'events';
  matchId?: string;
  actorId?: string | null;
  actorIsGuest?: boolean;
  ok: boolean;
  status: number;
  code?: string | null;
  durationMs: number;
}

/**
 * One structured line per match API request.
 * Never include FEN, PGN, or move payloads here — match_events is the
 * authoritative replay surface; logs are for flow/failure diagnosis only.
 */
export const logMatchRoute = (fields: MatchRouteLogFields): void => {
  const line = {
    action: fields.action,
    matchId: fields.matchId ?? null,
    actorId: fields.actorId ?? null,
    guest: fields.actorIsGuest ?? null,
    ok: fields.ok,
    status: fields.status,
    code: fields.code ?? null,
    durationMs: Math.round(fields.durationMs),
  };
  if (fields.ok) {
    matchLogger.info(line);
  } else if (fields.status >= 500) {
    matchLogger.error(line);
  } else {
    matchLogger.warn(line);
  }
};

/** Logs unexpected route failures without leaking internals to the client. */
export const logMatchRouteException = (
  action: MatchRouteLogFields['action'],
  matchId: string | undefined,
  error: unknown,
): void => {
  matchLogger.error({
    action,
    matchId: matchId ?? null,
    unexpected: true,
    message: error instanceof Error ? error.message : String(error),
  });
};
