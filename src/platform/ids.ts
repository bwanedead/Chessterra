/** Branded ID types — prevents mixing entity identifiers at compile time. */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type MatchId = Brand<string, 'MatchId'>;
export type GameModeId = Brand<string, 'GameModeId'>;
export type TimeControlId = Brand<string, 'TimeControlId'>;
export type RatingBucketId = Brand<string, 'RatingBucketId'>;
export type PositionId = Brand<string, 'PositionId'>;
export type QueueTicketId = Brand<string, 'QueueTicketId'>;

export const asUserId = (value: string): UserId => value as UserId;
export const asMatchId = (value: string): MatchId => value as MatchId;
export const asGameModeId = (value: string): GameModeId => value as GameModeId;
export const asTimeControlId = (value: string): TimeControlId => value as TimeControlId;
export const asRatingBucketId = (value: string): RatingBucketId => value as RatingBucketId;
export const asPositionId = (value: string): PositionId => value as PositionId;
export const asQueueTicketId = (value: string): QueueTicketId => value as QueueTicketId;
