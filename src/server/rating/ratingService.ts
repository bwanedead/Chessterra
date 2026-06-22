import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchEvent } from '@/domain/play/match/events';
import { toRatingBucketId } from '@/domain/play/rating/bucket';
import { createDefaultRating, updateRatings } from '@/domain/play/rating/glicko2';
import type { RatingRecord } from '@/domain/play/rating/types';
import { asRatingBucketId, type UserId } from '@/platform/ids';
import { createSupabaseServiceClient } from '@/platform/supabase/service';
import { createSupabaseRatingStore } from './supabaseRatingStore';

const memoryRatings = new Map<string, RatingRecord>();

const ratingKey = (userId: UserId, bucketId: string) => `${userId}::${bucketId}`;

const loadMemoryRating = (userId: UserId, bucketId: string): RatingRecord => {
  const key = ratingKey(userId, bucketId);
  const existing = memoryRatings.get(key);
  if (existing) {
    return existing;
  }
  const created = createDefaultRating(userId, asRatingBucketId(bucketId));
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

const toRatingUpdatedEvent = (record: RatingRecord, bucketId: string): MatchEvent => ({
  type: 'RATING_UPDATED',
  userId: record.userId,
  bucketId,
  rating: record.rating,
  ratingDeviation: record.ratingDeviation,
  gamesPlayed: record.gamesPlayed,
  provisional: record.provisional,
});

export type RatingAuditCallback = (event: MatchEvent) => Promise<void>;

export interface CompletedRatingUpdate {
  records: RatingRecord[];
  events: MatchEvent[];
}

/** Builds rating updates for a completed rated match without persisting them. */
export const buildCompletedRatedMatchUpdate = async (
  snapshot: MatchSnapshot,
): Promise<CompletedRatingUpdate | null> => {
  if (!snapshot.rated || snapshot.status !== 'completed') {
    return null;
  }

  const white = snapshot.players.find((player) => player.color === 'w')?.userId;
  const black = snapshot.players.find((player) => player.color === 'b')?.userId;
  if (!white || !black) {
    return null;
  }

  const bucketId = toRatingBucketId(snapshot.poolKey);
  const serviceClient = createSupabaseServiceClient();

  if (serviceClient) {
    const store = createSupabaseRatingStore(serviceClient);
    const whiteRating = await store.getOrCreate(white, bucketId);
    const blackRating = await store.getOrCreate(black, bucketId);

    const whiteResult = updateRatings({
      playerRating: whiteRating,
      opponentRating: blackRating,
      score: scoreForColor(snapshot, 'w'),
    });

    return {
      records: [whiteResult.player, whiteResult.opponent],
      events: [
        toRatingUpdatedEvent(whiteResult.player, bucketId),
        toRatingUpdatedEvent(whiteResult.opponent, bucketId),
      ],
    };
  }

  const whiteRating = loadMemoryRating(white, bucketId);
  const blackRating = loadMemoryRating(black, bucketId);

  const whiteResult = updateRatings({
    playerRating: whiteRating,
    opponentRating: blackRating,
    score: scoreForColor(snapshot, 'w'),
  });

  return {
    records: [whiteResult.player, whiteResult.opponent],
    events: [
      toRatingUpdatedEvent(whiteResult.player, bucketId),
      toRatingUpdatedEvent(whiteResult.opponent, bucketId),
    ],
  };
};

/** Persists prepared rating records (Supabase when configured, else in-memory). */
export const persistCompletedRatingUpdate = async (
  update: CompletedRatingUpdate | null,
): Promise<void> => {
  if (!update) {
    return;
  }

  const serviceClient = createSupabaseServiceClient();
  if (serviceClient) {
    const store = createSupabaseRatingStore(serviceClient);
    await Promise.all(update.records.map((record) => store.save(record)));
    return;
  }

  for (const record of update.records) {
    memoryRatings.set(ratingKey(record.userId, record.bucketId), record);
  }
};

/** Updates ratings after a completed rated match (Supabase when configured, else in-memory). */
export const processCompletedRatedMatch = async (
  snapshot: MatchSnapshot,
  onAudit?: RatingAuditCallback,
): Promise<void> => {
  const update = await buildCompletedRatedMatchUpdate(snapshot);
  await persistCompletedRatingUpdate(update);

  if (onAudit && update) {
    for (const event of update.events) {
      await onAudit(event);
    }
  }
};

export const getMemoryRating = (userId: UserId, bucketId: string): RatingRecord | null =>
  memoryRatings.get(ratingKey(userId, bucketId)) ?? null;
