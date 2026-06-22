import type { MatchSnapshot } from '@/domain/play/match/types';
import { findPlayerByUserId } from '@/domain/play/match/factory';
import type { UserId } from '@/platform/ids';

/**
 * Pending matches are readable via invite link (UUID secret).
 * Active/completed matches require the caller to be a participant.
 */
export const canViewMatch = (
  snapshot: MatchSnapshot,
  actorUserId: UserId | null,
): boolean => {
  if (snapshot.status === 'pending') {
    return true;
  }

  if (!actorUserId) {
    return false;
  }

  return findPlayerByUserId(snapshot, actorUserId) !== null;
};

/** Mutating routes require the actor to be a match participant. */
export const assertActorIsParticipant = (
  snapshot: MatchSnapshot,
  actorUserId: UserId,
): string | null => {
  if (findPlayerByUserId(snapshot, actorUserId) === null) {
    return 'Forbidden: not a match participant';
  }
  return null;
};
