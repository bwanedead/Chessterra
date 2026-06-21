import type { TimeControlId } from '@/platform/ids';
import type { PieceColor } from '@/features/chessboard/types';

export type TimeControlKind = 'fischer' | 'simple' | 'correspondence' | 'unlimited';

export interface TimeControlDefinition {
  id: TimeControlId;
  label: string;
  kind: TimeControlKind;
  initialMs: number;
  incrementMs: number;
  /** Reserved for Phase 2+ time bank */
  reserveMs?: number;
  order: number;
}

export interface PlayerClock {
  remainingMs: number;
  incrementMs: number;
  lastTickAt: number | null;
}

export interface MatchClockState {
  white: PlayerClock;
  black: PlayerClock;
  activeColor: PieceColor;
  running: boolean;
}

export type ClockEndReason = 'timeout';

export interface ClockTickResult {
  state: MatchClockState;
  flagFall: PieceColor | null;
}
