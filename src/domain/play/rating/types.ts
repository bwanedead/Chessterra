import type { RatingBucketId, UserId } from '@/platform/ids';

export interface RatingBucketKey {
  gameModeId: string;
  timeControlId: string;
  /** Optional subdivision, e.g. `piece-tier-5` or material signature */
  subdivision?: string;
}

export interface RatingRecord {
  userId: UserId;
  bucketId: RatingBucketId;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  gamesPlayed: number;
  provisional: boolean;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: UserId;
  displayName: string;
  rating: number;
  gamesPlayed: number;
  provisional: boolean;
}

export interface RatingUpdateInput {
  playerRating: RatingRecord;
  opponentRating: RatingRecord;
  score: 0 | 0.5 | 1;
}

export interface RatingUpdateResult {
  player: RatingRecord;
  opponent: RatingRecord;
}

export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const DEFAULT_VOLATILITY = 0.06;
export const PROVISIONAL_GAME_THRESHOLD = 20;
