'use client';

import type { LocalMatchEndReason } from '@/domain/endgame/play';
import type { PieceColor } from '@/features/chessboard/types';
import { buildPlayResultCopy } from '../lib/playResult';

export interface GameResultModalProps {
  open: boolean;
  endReason: LocalMatchEndReason;
  winner?: PieceColor;
  playerColor: PieceColor;
  moveCount: number;
  onRematch: () => void;
}

/** Phase 0 result overlay — rematch resets to DEV_START_FEN via session.reset(). */
export const GameResultModal = ({
  open,
  endReason,
  winner,
  playerColor,
  moveCount,
  onRematch,
}: GameResultModalProps) => {
  if (!open || !endReason) {
    return null;
  }

  const copy = buildPlayResultCopy(endReason, winner, playerColor);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-result-headline"
      data-testid="game-result-modal"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-slate-500">Game result</p>
        <h2 id="game-result-headline" className="mt-2 text-2xl font-semibold text-slate-50">
          {copy.headline}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{copy.detail}</p>
        <p className="mt-4 text-xs text-slate-500">{moveCount} moves played</p>
        <button
          type="button"
          onClick={onRematch}
          className="mt-6 w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Rematch
        </button>
      </div>
    </div>
  );
};
