'use client';

import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { useGameStore } from '@/shared/state/gameStore';
import { useActiveFen } from '@/features/chessboard/hooks/useActiveGame';

export const GameStats = () => {
  const timeline = useGameStore((state) => state.timeline);
  const currentPly = useGameStore((state) => state.currentPly);
  const fen = useActiveFen();
  const chess = useMemo(() => new Chess(fen), [fen]);

  if (timeline.positions.length <= 1) {
    return null;
  }

  const moveLabel = Math.floor((currentPly + 1) / 2);
  const suffix = currentPly % 2 === 0 ? '' : '...';
  const toMove = chess.turn() === 'w' ? 'White' : 'Black';
  const totalMoves = Math.ceil((timeline.positions.length - 1) / 2);

  return (
    <div className="glass-effect p-4 rounded-lg w-full max-w-[480px] mb-8">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Move:</span> {moveLabel}
          {suffix}
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">To Move:</span> {toMove}
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Total Moves:</span> {totalMoves}
        </div>
      </div>
    </div>
  );
};
