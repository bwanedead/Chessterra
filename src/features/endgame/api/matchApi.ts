import type { MatchSnapshot } from '@/domain/play/match/types';
import { authenticatedFetch } from '@/features/auth/authenticatedFetch';

const jsonHeaders = (playerId: string) => ({
  'Content-Type': 'application/json',
  'X-Player-Id': playerId,
});

/** Typed client-side error carrying HTTP status and server error code. */
export class MatchApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'MatchApiError';
  }
}

const toApiError = async (response: Response, fallback: string): Promise<MatchApiError> => {
  let message = fallback;
  let code: string | null = null;
  try {
    const data = (await response.json()) as { error?: unknown; code?: unknown };
    if (typeof data.error === 'string' && data.error.length > 0) {
      message = data.error;
    }
    if (typeof data.code === 'string' && data.code.length > 0) {
      code = data.code;
    }
  } catch {
    // Non-JSON body (e.g. gateway error page); keep fallback message.
  }
  return new MatchApiError(message, response.status, code);
};

export const fetchMatch = async (
  matchId: string,
  playerId?: string | null,
): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}`, {
    cache: 'no-store',
    playerId: playerId ?? null,
  });
  if (!response.ok) {
    throw await toApiError(response, 'Failed to load match');
  }
  const data = (await response.json()) as { match: MatchSnapshot };
  return data.match;
};

export const createInviteMatch = async (
  playerId: string,
  options?: { rated?: boolean; timeControlId?: string },
): Promise<{ match: MatchSnapshot; invitePath: string }> => {
  const response = await authenticatedFetch('/api/matches', {
    method: 'POST',
    headers: jsonHeaders(playerId),
    body: JSON.stringify(options ?? {}),
    playerId,
  });
  if (!response.ok) {
    throw await toApiError(response, 'Failed to create match');
  }
  return response.json();
};

export const joinMatch = async (matchId: string, playerId: string): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}/join`, {
    method: 'POST',
    headers: jsonHeaders(playerId),
    playerId,
  });
  if (!response.ok) {
    throw await toApiError(response, 'Failed to join match');
  }
  const data = (await response.json()) as { match: MatchSnapshot };
  return data.match;
};

export const postMatchMove = async (
  matchId: string,
  playerId: string,
  move: { from: string; to: string; promotion?: string },
): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}/move`, {
    method: 'POST',
    headers: jsonHeaders(playerId),
    body: JSON.stringify(move),
    playerId,
  });
  if (!response.ok) {
    throw await toApiError(response, 'Illegal move');
  }
  const data = (await response.json()) as { match: MatchSnapshot };
  return data.match;
};

export const postMatchResign = async (matchId: string, playerId: string): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}/resign`, {
    method: 'POST',
    headers: jsonHeaders(playerId),
    playerId,
  });
  if (!response.ok) {
    throw await toApiError(response, 'Failed to resign');
  }
  const data = (await response.json()) as { match: MatchSnapshot };
  return data.match;
};
