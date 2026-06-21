'use client';

import type { MatchClockState } from '@/domain/play/time-control/types';
import type { LocalMatchEndReason } from '@/domain/endgame/play';
import type { PieceColor } from '@/features/chessboard/types';
import {
  resolveClockDisplayState,
  type ClockDisplayOptions,
} from '../lib/clockDisplay';

export interface GameClockProps {
  label: string;
  color: PieceColor;
  clock: MatchClockState;
  isPlayer?: boolean;
  isTerminal?: boolean;
  endReason?: LocalMatchEndReason;
  winner?: PieceColor;
  lowTimeThresholdMs?: number;
}

const shellClassByPhase: Record<string, string> = {
  idle: 'border-slate-700/80 bg-slate-900/70',
  active: 'border-sky-500/70 bg-sky-950/50 shadow-[0_0_20px_rgba(14,165,233,0.12)]',
  low: 'border-rose-500/80 bg-rose-950/40 shadow-[0_0_24px_rgba(244,63,94,0.2)]',
  flagged: 'border-rose-600 bg-rose-950/60',
};

const timeClassByPhase: Record<string, string> = {
  idle: 'text-slate-200',
  active: 'text-sky-50',
  low: 'text-rose-100 animate-pulse',
  flagged: 'text-rose-200',
};

/** Phase 0 clock display — active highlight, low-time pulse, flag fall styling. */
export const GameClock = ({
  label,
  color,
  clock,
  isPlayer = false,
  isTerminal = false,
  endReason = null,
  winner,
  lowTimeThresholdMs,
}: GameClockProps) => {
  const displayOptions: ClockDisplayOptions = {
    lowTimeThresholdMs,
    isTerminal,
    endReason,
    winner,
  };

  const display = resolveClockDisplayState(label, color, clock, displayOptions);

  return (
    <div
      className={[
        'flex items-center justify-between rounded-xl border px-4 py-3 transition-colors duration-200',
        shellClassByPhase[display.phase],
        isPlayer ? 'ring-1 ring-sky-500/25' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`game-clock-${color}`}
      data-active={display.isActive}
      data-phase={display.phase}
      data-color={color}
      aria-live={display.phase === 'low' || display.phase === 'flagged' ? 'polite' : 'off'}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs uppercase tracking-wide text-slate-400">{display.label}</span>
        {display.phase === 'flagged' ? (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-300">
            Flag
          </span>
        ) : null}
      </div>
      <span
        className={[
          'font-mono text-xl tabular-nums tracking-tight',
          timeClassByPhase[display.phase],
        ].join(' ')}
      >
        {display.formattedTime}
      </span>
    </div>
  );
};
