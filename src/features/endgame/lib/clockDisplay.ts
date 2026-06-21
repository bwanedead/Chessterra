import { formatClock } from '@/domain/play/time-control/clock';
import type { MatchClockState } from '@/domain/play/time-control/types';
import type { LocalMatchEndReason } from '@/domain/endgame/play';
import type { PieceColor } from '@/features/chessboard/types';

export const LOW_TIME_THRESHOLD_MS = 10_000;

export type ClockDisplayPhase = 'idle' | 'active' | 'low' | 'flagged';

export interface ClockDisplayState {
  label: string;
  formattedTime: string;
  phase: ClockDisplayPhase;
  isActive: boolean;
  remainingMs: number;
}

export interface ClockDisplayOptions {
  lowTimeThresholdMs?: number;
  isTerminal?: boolean;
  endReason?: LocalMatchEndReason;
  winner?: PieceColor;
}

export const resolveClockDisplayState = (
  label: string,
  color: PieceColor,
  clock: MatchClockState,
  options: ClockDisplayOptions = {},
): ClockDisplayState => {
  const {
    lowTimeThresholdMs = LOW_TIME_THRESHOLD_MS,
    isTerminal = false,
    endReason = null,
    winner,
  } = options;

  const side = color === 'w' ? clock.white : clock.black;
  const isActive = clock.running && clock.activeColor === color && !isTerminal;
  const lostOnTime = isTerminal && endReason === 'timeout' && winner !== undefined && winner !== color;
  const flagged = lostOnTime || (isTerminal && side.remainingMs <= 0 && endReason === 'timeout');

  let phase: ClockDisplayPhase = 'idle';
  if (flagged) {
    phase = 'flagged';
  } else if (isActive && side.remainingMs <= lowTimeThresholdMs) {
    phase = 'low';
  } else if (isActive) {
    phase = 'active';
  }

  return {
    label,
    formattedTime: formatClock(side.remainingMs),
    phase,
    isActive,
    remainingMs: side.remainingMs,
  };
};
