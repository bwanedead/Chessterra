'use client';

import { formatClock } from '@/domain/play/time-control/clock';
import type { MatchClockState } from '@/domain/play/time-control/types';
import type { PieceColor } from '@/features/chessboard/types';

export interface PlayClockSlotProps {
  label: string;
  color: PieceColor;
  clock: MatchClockState;
  isPlayer?: boolean;
}

/** Structural clock display — styled GameClock arrives in eg-004. */
export const PlayClockSlot = ({ label, color, clock, isPlayer = false }: PlayClockSlotProps) => {
  const side = color === 'w' ? clock.white : clock.black;
  const isActive = clock.running && clock.activeColor === color && side.remainingMs > 0;

  return (
    <div
      className={[
        'flex items-center justify-between rounded-lg border px-4 py-3 font-mono tabular-nums',
        isActive ? 'border-sky-500/60 bg-sky-950/40' : 'border-slate-700 bg-slate-900/60',
        isPlayer ? 'ring-1 ring-sky-500/30' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-active={isActive}
      data-color={color}
    >
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-lg ${isActive ? 'text-sky-100' : 'text-slate-200'}`}>
        {formatClock(side.remainingMs)}
      </span>
    </div>
  );
};
