import { MatchApiError } from '../api/matchApi';

/**
 * Maps raw API/network failures to user-friendly copy.
 * Keeps server wording for illegal-move detail (already human-readable).
 */
export const describeMatchError = (error: unknown, fallback: string): string => {
  if (error instanceof MatchApiError) {
    switch (error.code) {
      case 'version_conflict':
        return 'The game updated before your action landed — the board has been refreshed, try again.';
      case 'forbidden':
        return 'You are not a participant in this match.';
      case 'rated_requires_auth':
        return 'Rated games require a signed-in account.';
      case 'not_found':
        return 'Match not found — it may have expired or the link is wrong.';
      case 'rate_limited':
        return 'Too many requests — take a breath and try again shortly.';
      default:
        break;
    }
    if (error.status === 401) {
      return 'Session expired — sign in again (or continue as guest) to keep playing.';
    }
    return error.message || fallback;
  }

  // fetch() rejects with TypeError on network failure.
  if (error instanceof TypeError) {
    return 'Connection problem — check your network. We will keep retrying.';
  }

  return error instanceof Error && error.message ? error.message : fallback;
};

export const isVersionConflict = (error: unknown): boolean =>
  error instanceof MatchApiError && error.code === 'version_conflict';

export const isNetworkError = (error: unknown): boolean => error instanceof TypeError;
