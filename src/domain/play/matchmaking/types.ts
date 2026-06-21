import type { MatchId, QueueTicketId, UserId } from '@/platform/ids';
import type { RatingBucketKey } from '../rating/types';

export interface MatchmakingPoolKey extends RatingBucketKey {
  rated: boolean;
}

export interface QueueTicket {
  id: QueueTicketId;
  userId: UserId;
  poolKey: MatchmakingPoolKey;
  rating: number;
  ratingDeviation: number;
  enqueuedAt: number;
}

export interface PairingCandidate {
  ticket: QueueTicket;
  waitMs: number;
}

export interface PairingResult {
  white: QueueTicket;
  black: QueueTicket;
  poolKey: MatchmakingPoolKey;
  matchId: MatchId;
}

export interface MatchmakingConfig {
  initialRatingWindow: number;
  windowGrowthPerSecond: number;
  maxRatingWindow: number;
  maxWaitMs: number;
}

export const DEFAULT_MATCHMAKING_CONFIG: MatchmakingConfig = {
  initialRatingWindow: 100,
  windowGrowthPerSecond: 5,
  maxRatingWindow: 400,
  maxWaitMs: 120_000,
};
