import { asMatchId } from '@/platform/ids';
import type {
  MatchmakingConfig,
  PairingCandidate,
  PairingResult,
  QueueTicket,
} from './types';
import { DEFAULT_MATCHMAKING_CONFIG } from './types';
import { poolKeysEqual } from './pool';

const ratingDistance = (a: QueueTicket, b: QueueTicket): number =>
  Math.abs(a.rating - b.rating);

export const ratingWindowForWait = (
  waitMs: number,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): number => {
  const grown = config.initialRatingWindow + (waitMs / 1000) * config.windowGrowthPerSecond;
  return Math.min(config.maxRatingWindow, grown);
};

export const findPairing = (
  incoming: QueueTicket,
  queue: QueueTicket[],
  now: number,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): PairingResult | null => {
  const waitMs = now - incoming.enqueuedAt;
  const window = ratingWindowForWait(waitMs, config);

  const candidates: PairingCandidate[] = queue
    .filter(
      (ticket) =>
        ticket.userId !== incoming.userId &&
        poolKeysEqual(ticket.poolKey, incoming.poolKey),
    )
    .map((ticket) => ({
      ticket,
      waitMs: now - ticket.enqueuedAt,
    }))
    .filter(({ ticket }) => ratingDistance(incoming, ticket) <= window)
    .sort((a, b) => ratingDistance(incoming, a.ticket) - ratingDistance(incoming, b.ticket));

  const best = candidates[0]?.ticket;
  if (!best) {
    return null;
  }

  const whiteFirst = incoming.enqueuedAt <= best.enqueuedAt ? incoming : best;
  const blackSecond = whiteFirst === incoming ? best : incoming;

  return {
    white: whiteFirst,
    black: blackSecond,
    poolKey: incoming.poolKey,
    matchId: asMatchId(crypto.randomUUID()),
  };
};

export const shouldOfferBotBackfill = (
  waitMs: number,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): boolean => waitMs >= config.maxWaitMs;
