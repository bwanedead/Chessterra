import type { PositionId } from '@/platform/ids';
import type { PieceColor } from '@/features/chessboard/types';
import type { RuleOutcome } from '@/domain/board-core/types';
import type { MatchClockState } from '@/domain/play/time-control/types';

export type LocalMatchPhase = 'ready' | 'active' | 'completed';

export type LocalMatchEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'timeout'
  | 'resignation'
  | 'aborted'
  | null;

export interface LocalMatchState {
  phase: LocalMatchPhase;
  rulesetId: string;
  timeControlId: string;
  startingFen: string;
  positionId?: PositionId;
  playerColor: PieceColor;
  opponentKind: 'bot' | 'human' | 'none';
  clock: MatchClockState;
  outcome: RuleOutcome;
  endReason: LocalMatchEndReason;
  moveCount: number;
}

export interface LocalPlayConfig {
  rulesetId: string;
  fen: string;
  positionId?: PositionId;
  timeControlId: string;
  playerColor: PieceColor;
  opponentKind: LocalMatchState['opponentKind'];
}

export const DEFAULT_PHASE0_PLAY_CONFIG: LocalPlayConfig = {
  rulesetId: 'standard-fide',
  fen: '', // filled from DEV_START_FEN at call site to avoid circular import
  timeControlId: 'blitz_3_2',
  playerColor: 'w',
  opponentKind: 'bot',
};
