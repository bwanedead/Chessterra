import { asMatchId, asUserId, type PositionId, type UserId } from '@/platform/ids';
import type { FenString } from '../chess/types';
import { createMatchClock } from '../time-control/clock';
import { getTimeControl } from '../time-control/registry';
import type { MatchmakingPoolKey } from '../matchmaking/types';
import type { MatchSnapshot } from './types';

export interface CreatePendingMatchInput {
  id: string;
  hostUserId: string;
  startingFen: FenString;
  positionId: PositionId | null;
  poolKey: MatchmakingPoolKey;
  rated?: boolean;
}

export const createPendingMatch = (input: CreatePendingMatchInput): MatchSnapshot => {
  const timeControl = getTimeControl(input.poolKey.timeControlId);
  if (!timeControl) {
    throw new Error(`Unknown time control: ${input.poolKey.timeControlId}`);
  }

  const now = new Date().toISOString();

  return {
    id: asMatchId(input.id),
    poolKey: input.poolKey,
    status: 'pending',
    players: [
      { userId: asUserId(input.hostUserId), slot: 'white', color: 'w' },
      { userId: null, slot: 'black', color: 'b' },
    ],
    startingFen: input.startingFen,
    currentFen: input.startingFen,
    positionId: input.positionId,
    clock: createMatchClock(timeControl, 'w'),
    moves: [],
    outcome: { kind: 'ongoing' },
    rated: input.rated ?? input.poolKey.rated,
    createdAt: now,
    startedAt: null,
    endedAt: null,
  };
};

export const joinMatchAsBlack = (
  snapshot: MatchSnapshot,
  guestUserId: UserId,
): MatchSnapshot => {
  if (snapshot.status !== 'pending') {
    throw new Error('Match is not joinable');
  }

  const blackPlayer = snapshot.players.find((player) => player.slot === 'black');
  if (!blackPlayer || blackPlayer.userId !== null) {
    throw new Error('Black slot is already taken');
  }

  return {
    ...snapshot,
    players: snapshot.players.map((player) =>
      player.slot === 'black' ? { ...player, userId: guestUserId } : player,
    ),
  };
};

export const findPlayerByUserId = (snapshot: MatchSnapshot, userId: UserId) =>
  snapshot.players.find((player) => player.userId === userId) ?? null;
