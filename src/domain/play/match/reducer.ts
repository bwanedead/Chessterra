import type { PieceColor } from '@/features/chessboard/types';
import { createChessEngine } from '../chess/chessJsEngine';
import type { GameOutcome } from '../chess/types';
import { detectFlagFall } from '../time-control/clock';
import type { MatchEvent, MatchReducerContext } from './events';
import type { MatchSnapshot, MoveRecord } from './types';

export const reduceMatch = (
  state: MatchSnapshot,
  event: MatchEvent,
  context: MatchReducerContext,
): MatchSnapshot => {
  switch (event.type) {
    case 'MATCH_CREATED':
      return {
        ...state,
        startingFen: event.startingFen,
        currentFen: event.startingFen,
        positionId: event.positionId ? (event.positionId as MatchSnapshot['positionId']) : null,
      };

    case 'PLAYER_JOINED':
      return state;

    case 'MATCH_STARTED':
      return {
        ...state,
        status: 'active',
        startedAt: event.at,
        clock: { ...state.clock, running: true },
      };

    case 'MOVE_COMMITTED': {
      const engine = createChessEngine(event.fen);
      const outcome = engine.outcome();
      const moveRecord: MoveRecord = {
        ply: state.moves.length + 1,
        san: event.san,
        from: event.move.from,
        to: event.move.to,
        fen: event.fen,
        clockWhiteMs: event.clock.white.remainingMs,
        clockBlackMs: event.clock.black.remainingMs,
        createdAt: context.now,
      };

      return {
        ...state,
        currentFen: event.fen,
        clock: event.clock,
        moves: [...state.moves, moveRecord],
        outcome,
        status: outcome.kind === 'ongoing' ? 'active' : 'completed',
        endedAt: outcome.kind === 'ongoing' ? null : context.now,
      };
    }

    case 'CLOCK_TICK': {
      const flagColor = event.flagColor ?? detectFlagFall(event.clock);
      if (!flagColor) {
        return { ...state, clock: event.clock };
      }
      const winner: PieceColor = flagColor === 'w' ? 'b' : 'w';
      const outcome: GameOutcome = { kind: 'timeout', winner };
      return {
        ...state,
        clock: event.clock,
        outcome,
        status: 'completed',
        endedAt: context.now,
      };
    }

    case 'RESIGN': {
      const winner: PieceColor = event.color === 'w' ? 'b' : 'w';
      return {
        ...state,
        outcome: { kind: 'resignation', winner },
        status: 'completed',
        endedAt: context.now,
        clock: { ...state.clock, running: false },
      };
    }

    case 'ABORT':
      return {
        ...state,
        outcome: { kind: 'aborted' },
        status: 'aborted',
        endedAt: context.now,
        clock: { ...state.clock, running: false },
      };

    case 'DRAW_ACCEPTED':
      return {
        ...state,
        outcome: { kind: 'draw', reason: 'agreement' },
        status: 'completed',
        endedAt: context.now,
        clock: { ...state.clock, running: false },
      };

    default:
      return state;
  }
};
