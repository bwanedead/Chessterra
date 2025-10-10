'use client';

import { useCallback, useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { HeatmapBoard } from '@/features/chessboard/components/HeatmapBoard';

const BOARD_SIZE = 480;

export default function Home() {
  const [fen, setFen] = useState(() => new Chess().fen());

  const handleMove = useCallback((sourceSquare: string, targetSquare: string) => {
    const game = new Chess(fen);
    const piece = game.get(sourceSquare as Square);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare.endsWith('8')) || (piece.color === 'b' && targetSquare.endsWith('1')));

    let move;
    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare,
        ...(isPromotion ? { promotion: 'q' as const } : {}),
      });
    } catch (error) {
      console.warn('Ignoring invalid move attempt', error);
      return false;
    }

    if (!move) {
      return false;
    }

    setFen(game.fen());
    return true;
  }, [fen]);

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-950 px-6 pb-20 pt-24"
      style={{ paddingTop: '120px' }}
    >
      <div className="w-full max-w-6xl">
        <HeatmapBoard
          fen={fen}
          orientation="white"
          moveMode
          boardSize={BOARD_SIZE}
          onMove={handleMove}
        />
      </div>
    </main>
  );
}
