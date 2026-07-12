import type { UserId } from '@/platform/ids';
import type { PieceColor } from '@/features/chessboard/types';
import type { GameOutcome } from '../chess/types';
import type { MatchSnapshot } from './types';

export type MatchResultForPlayer = 'win' | 'loss' | 'draw' | 'aborted';

/** Participant-scoped summary of a completed match — safe to return to that player. */
export interface MatchHistoryEntry {
  matchId: string;
  playerColor: PieceColor;
  opponentUserId: string | null;
  result: MatchResultForPlayer;
  outcomeKind: GameOutcome['kind'];
  rated: boolean;
  timeControlId: string;
  gameModeId: string;
  moveCount: number;
  endedAt: string | null;
  startedAt: string | null;
}

const resultForPlayer = (outcome: GameOutcome, playerColor: PieceColor): MatchResultForPlayer => {
  if (outcome.kind === 'aborted') {
    return 'aborted';
  }
  if (outcome.kind === 'draw' || outcome.kind === 'stalemate') {
    return 'draw';
  }
  if ('winner' in outcome && outcome.winner) {
    return outcome.winner === playerColor ? 'win' : 'loss';
  }
  return 'draw';
};

/**
 * Builds a history entry from the viewer's perspective.
 * Returns null when the viewer was not a participant — callers must not
 * surface other players' matches.
 */
export const toMatchHistoryEntry = (
  snapshot: MatchSnapshot,
  viewerUserId: UserId,
): MatchHistoryEntry | null => {
  const viewer = snapshot.players.find((player) => player.userId === viewerUserId);
  if (!viewer) {
    return null;
  }

  const opponent = snapshot.players.find((player) => player.userId !== viewerUserId);

  return {
    matchId: snapshot.id,
    playerColor: viewer.color,
    opponentUserId: opponent?.userId ?? null,
    result: resultForPlayer(snapshot.outcome, viewer.color),
    outcomeKind: snapshot.outcome.kind,
    rated: snapshot.rated,
    timeControlId: snapshot.poolKey.timeControlId,
    gameModeId: snapshot.poolKey.gameModeId,
    moveCount: snapshot.moves.length,
    endedAt: snapshot.endedAt,
    startedAt: snapshot.startedAt,
  };
};
