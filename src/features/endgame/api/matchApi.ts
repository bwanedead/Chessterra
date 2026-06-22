import type { MatchSnapshot } from '@/domain/play/match/types';
import { authenticatedFetch } from '@/features/auth/authenticatedFetch';

const jsonHeaders = (playerId: string) => ({
  'Content-Type': 'application/json',
  'X-Player-Id': playerId,
});

export const fetchMatch = async (
  matchId: string,
  playerId?: string | null,
): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}`, {
    cache: 'no-store',
    playerId: playerId ?? null,
  });
  if (!response.ok) {
    throw new Error('Failed to load match');
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to create match');
  }
  return data;
};

export const joinMatch = async (matchId: string, playerId: string): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}/join`, {
    method: 'POST',
    headers: jsonHeaders(playerId),
    playerId,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to join match');
  }
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Illegal move');
  }
  return data.match;
};

export const postMatchResign = async (matchId: string, playerId: string): Promise<MatchSnapshot> => {
  const response = await authenticatedFetch(`/api/matches/${matchId}/resign`, {
    method: 'POST',
    headers: jsonHeaders(playerId),
    playerId,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to resign');
  }
  return data.match;
};
