'use client';

import { useCallback, useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';

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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 py-12">
      <div
        className="relative h-full w-full max-w-lg"
        style={{ width: `${BOARD_SIZE}px`, height: `${BOARD_SIZE}px` }}
      >
        <CustomChessboard fen={fen} orientation="white" moveMode boardSize={BOARD_SIZE} onMove={handleMove} />
      </div>
    </main>
  );
}
