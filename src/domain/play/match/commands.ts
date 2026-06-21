import type { Result } from '@/platform/result';
import { err, ok } from '@/platform/result';
import type { UserId } from '@/platform/ids';
import type { PieceColor } from '@/features/chessboard/types';
import { createChessEngine } from '../chess/chessJsEngine';
import type { ChessMove, FenString } from '../chess/types';
import { commitMoveClock } from '../time-control/clock';
import { findPlayerByUserId } from './factory';
import type { MatchEvent } from './events';
import { reduceMatch } from './reducer';
import type { MatchSnapshot } from './types';

const readActiveColor = (fen: FenString): PieceColor => {
  const parts = fen.split(' ');
  return parts[1] === 'b' ? 'b' : 'w';
};

export const applyMatchMove = (
  snapshot: MatchSnapshot,
  actorUserId: UserId,
  move: ChessMove,
  clockNow: number,
): Result<MatchSnapshot, string> => {
  if (snapshot.status !== 'active') {
    return err('Match is not active');
  }

  const player = findPlayerByUserId(snapshot, actorUserId);
  if (!player) {
    return err('Player is not in this match');
  }

  const activeColor = readActiveColor(snapshot.currentFen);
  if (player.color !== activeColor) {
    return err('Not your turn');
  }

  const engine = createChessEngine(snapshot.currentFen);
  const applied = engine.move(move);
  if (!applied) {
    return err('Illegal move');
  }

  const nextFen = engine.fen();
  const nextClock = commitMoveClock(snapshot.clock, player.color, clockNow);
  const event: MatchEvent = {
    type: 'MOVE_COMMITTED',
    move: { from: applied.from, to: applied.to, promotion: applied.promotion },
    san: applied.san,
    fen: nextFen,
    mover: player.color,
    clock: nextClock,
  };

  const now = new Date().toISOString();
  const next = reduceMatch(snapshot, event, { now, clockNow });
  return ok(next);
};

export const applyMatchResign = (
  snapshot: MatchSnapshot,
  actorUserId: UserId,
): Result<MatchSnapshot, string> => {
  if (snapshot.status !== 'active') {
    return err('Match is not active');
  }

  const player = findPlayerByUserId(snapshot, actorUserId);
  if (!player) {
    return err('Player is not in this match');
  }

  const now = new Date().toISOString();
  const next = reduceMatch(
    snapshot,
    { type: 'RESIGN', color: player.color },
    { now, clockNow: Date.now() },
  );
  return ok(next);
};

export const startJoinedMatch = (snapshot: MatchSnapshot): MatchSnapshot => {
  const now = new Date().toISOString();
  return reduceMatch(
    snapshot,
    { type: 'MATCH_STARTED', at: now },
    { now, clockNow: Date.now() },
  );
};
