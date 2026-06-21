import type { RatingBucketId, UserId } from '@/platform/ids';
import type { RatingRecord, RatingUpdateInput, RatingUpdateResult } from './types';
import {
  DEFAULT_RATING,
  DEFAULT_RD,
  DEFAULT_VOLATILITY,
  PROVISIONAL_GAME_THRESHOLD,
} from './types';

export const createDefaultRating = (
  userId: UserId,
  bucketId: RatingBucketId,
): RatingRecord => ({
  userId,
  bucketId,
  rating: DEFAULT_RATING,
  ratingDeviation: DEFAULT_RD,
  volatility: DEFAULT_VOLATILITY,
  gamesPlayed: 0,
  provisional: true,
  updatedAt: new Date().toISOString(),
});

/**
 * Simplified Glicko-2-inspired update for foundation layer.
 * Replace with full Glicko-2 implementation when rating service ships.
 */
export const updateRatings = (input: RatingUpdateInput): RatingUpdateResult => {
  const kPlayer = input.playerRating.provisional ? 40 : 20;
  const kOpponent = input.opponentRating.provisional ? 40 : 20;

  const expectedPlayer =
    1 / (1 + 10 ** ((input.opponentRating.rating - input.playerRating.rating) / 400));
  const expectedOpponent = 1 - expectedPlayer;

  const playerRating = clampRating(
    input.playerRating.rating + kPlayer * (input.score - expectedPlayer),
  );
  const opponentRating = clampRating(
    input.opponentRating.rating + kOpponent * (1 - input.score - expectedOpponent),
  );

  const now = new Date().toISOString();

  return {
    player: {
      ...input.playerRating,
      rating: playerRating,
      ratingDeviation: shrinkRd(input.playerRating.ratingDeviation),
      gamesPlayed: input.playerRating.gamesPlayed + 1,
      provisional: input.playerRating.gamesPlayed + 1 < PROVISIONAL_GAME_THRESHOLD,
      updatedAt: now,
    },
    opponent: {
      ...input.opponentRating,
      rating: opponentRating,
      ratingDeviation: shrinkRd(input.opponentRating.ratingDeviation),
      gamesPlayed: input.opponentRating.gamesPlayed + 1,
      provisional: input.opponentRating.gamesPlayed + 1 < PROVISIONAL_GAME_THRESHOLD,
      updatedAt: now,
    },
  };
};

const clampRating = (value: number): number =>
  Math.max(100, Math.min(3000, Math.round(value)));

const shrinkRd = (rd: number): number => Math.max(30, rd * 0.98);
