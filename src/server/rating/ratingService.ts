import type { MatchSnapshot } from '@/domain/play/match/types';
import { toRatingBucketId } from '@/domain/play/rating/bucket';
import { createDefaultRating, updateRatings } from '@/domain/play/rating/glicko2';
import type { RatingRecord } from '@/domain/play/rating/types';
import type { UserId } from '@/platform/ids';

const memoryRatings = new Map<string, RatingRecord>();

const ratingKey = (userId: UserId, bucketId: string) => `${userId}::${bucketId}`;

const getOrCreateRating = (userId: UserId, bucketId: string): RatingRecord => {
  const key = ratingKey(userId, bucketId);
  const existing = memoryRatings.get(key);
  if (existing) {
    return existing;
  }
  const created = createDefaultRating(userId, bucketId as never);
  memoryRatings.set(key, created);
  return created;
};

const scoreForColor = (
  snapshot: MatchSnapshot,
  color: 'w' | 'b',
): 0 | 0.5 | 1 => {
  const outcome = snapshot.outcome;
  if (outcome.kind === 'draw' || outcome.kind === 'stalemate') {
    return 0.5;
  }
  if ('winner' in outcome && outcome.winner) {
    return outcome.winner === color ? 1 : 0;
  }
  return 0.5;
};

/** In-memory rating updates until Supabase ratings table is wired. */
export const processCompletedRatedMatch = (snapshot: MatchSnapshot): void => {
  if (!snapshot.rated || snapshot.status !== 'completed') {
    return;
  }

  const white = snapshot.players.find((player) => player.color === 'w')?.userId;
  const black = snapshot.players.find((player) => player.color === 'b')?.userId;
  if (!white || !black) {
    return;
  }

  const bucketId = toRatingBucketId(snapshot.poolKey);
  const whiteRating = getOrCreateRating(white, bucketId);
  const blackRating = getOrCreateRating(black, bucketId);

  const whiteResult = updateRatings({
    playerRating: whiteRating,
    opponentRating: blackRating,
    score: scoreForColor(snapshot, 'w'),
  });

  memoryRatings.set(ratingKey(white, bucketId), whiteResult.player);
  memoryRatings.set(ratingKey(black, bucketId), whiteResult.opponent);
};

export const getMemoryRating = (userId: UserId, bucketId: string): RatingRecord | null =>
  memoryRatings.get(ratingKey(userId, bucketId)) ?? null;
