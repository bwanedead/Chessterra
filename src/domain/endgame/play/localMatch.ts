import type { PieceColor } from '@/features/chessboard/types';
import type { RuleOutcome } from '@/domain/board-core/types';
import {
  commitMoveClock,
  createMatchClock,
  detectFlagFall,
  startClock,
  stopClock,
  tickClock,
} from '@/domain/play/time-control/clock';
import { getTimeControl } from '@/domain/play/time-control/registry';
import type { LocalMatchEndReason, LocalMatchState, LocalPlayConfig } from './types';

export type LocalMatchEvent =
  | { type: 'START'; at: number; activeColor: PieceColor }
  | { type: 'MOVE_COMMITTED'; mover: PieceColor; at: number; outcome: RuleOutcome }
  | { type: 'CLOCK_TICK'; at: number }
  | { type: 'RESIGN'; color: PieceColor }
  | { type: 'RESET'; config: LocalPlayConfig; at: number; activeColor: PieceColor };

const mapEndReason = (outcome: RuleOutcome): LocalMatchEndReason => {
  if (outcome.kind === 'ongoing') {
    return null;
  }
  if (outcome.reason === 'checkmate') return 'checkmate';
  if (outcome.reason === 'stalemate') return 'stalemate';
  if (outcome.reason === 'timeout') return 'timeout';
  if (outcome.reason === 'resignation') return 'resignation';
  if (outcome.reason === 'aborted') return 'aborted';
  if (outcome.kind === 'terminal') return 'draw';
  return 'draw';
};

export const createLocalMatchState = (
  config: LocalPlayConfig,
  activeColor: PieceColor = 'w',
): LocalMatchState => {
  const timeControl = getTimeControl(config.timeControlId);
  if (!timeControl) {
    throw new Error(`Unknown time control: ${config.timeControlId}`);
  }

  return {
    phase: 'ready',
    rulesetId: config.rulesetId,
    timeControlId: config.timeControlId,
    startingFen: config.fen,
    playerColor: config.playerColor,
    opponentKind: config.opponentKind,
    clock: createMatchClock(timeControl, activeColor),
    outcome: { kind: 'ongoing' },
    endReason: null,
    moveCount: 0,
  };
};

export const reduceLocalMatch = (
  state: LocalMatchState,
  event: LocalMatchEvent,
): LocalMatchState => {
  switch (event.type) {
    case 'START':
      return {
        ...state,
        phase: 'active',
        clock: startClock(state.clock, event.at),
      };

    case 'MOVE_COMMITTED': {
      const clock = commitMoveClock(state.clock, event.mover, event.at);
      const terminal = event.outcome.kind === 'terminal';
      return {
        ...state,
        phase: terminal ? 'completed' : 'active',
        moveCount: state.moveCount + 1,
        clock: terminal ? stopClock(clock) : clock,
        outcome: event.outcome,
        endReason: mapEndReason(event.outcome),
      };
    }

    case 'CLOCK_TICK': {
      if (state.phase !== 'active' || !state.clock.running) {
        return state;
      }
      const clock = tickClock(state.clock, event.at);
      const flag = detectFlagFall(clock);
      if (!flag) {
        return { ...state, clock };
      }
      const winner: PieceColor = flag === 'w' ? 'b' : 'w';
      return {
        ...state,
        phase: 'completed',
        clock: stopClock(clock),
        outcome: { kind: 'terminal', winner, reason: 'timeout' },
        endReason: 'timeout',
      };
    }

    case 'RESIGN': {
      const winner: PieceColor = event.color === 'w' ? 'b' : 'w';
      return {
        ...state,
        phase: 'completed',
        clock: stopClock(state.clock),
        outcome: { kind: 'terminal', winner, reason: 'resignation' },
        endReason: 'resignation',
      };
    }

    case 'RESET':
      return createLocalMatchState(event.config, event.activeColor);

    default:
      return state;
  }
};
