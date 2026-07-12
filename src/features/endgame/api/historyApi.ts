import type { MatchHistoryEntry } from '@/domain/play/match/history';
import { authenticatedFetch } from '@/features/auth/authenticatedFetch';
import { MatchApiError } from './matchApi';

export const fetchMatchHistory = async (
  playerId: string,
  limit = 50,
): Promise<MatchHistoryEntry[]> => {
  const response = await authenticatedFetch(`/api/me/matches?limit=${limit}`, {
    cache: 'no-store',
    playerId,
  });
  if (!response.ok) {
    let message = 'Failed to load match history';
    let code: string | null = null;
    try {
      const data = (await response.json()) as { error?: unknown; code?: unknown };
      if (typeof data.error === 'string') {
        message = data.error;
      }
      if (typeof data.code === 'string') {
        code = data.code;
      }
    } catch {
      // Non-JSON body; keep fallback.
    }
    throw new MatchApiError(message, response.status, code);
  }
  const data = (await response.json()) as { matches: MatchHistoryEntry[] };
  return data.matches;
};
