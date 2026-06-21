'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';
import { useBoardInteraction } from '@/features/chessboard/interaction';
import type { LastMove } from '@/features/chessboard/interaction/types';
import type { PieceColor } from '@/features/chessboard/types';
import { createChessEngine } from '@/domain/play/chess';
import type { FenString } from '@/domain/play/chess/types';

export interface PlayBoardProps {
  fen: FenString;
  orientation?: 'white' | 'black';
  boardSize: number;
  playerColor?: PieceColor | null;
  themeId?: string;
  moveMode?: boolean;
  onFenChange?: (fen: FenString, lastMove: LastMove) => void;
}

export const PlayBoard = ({
  fen,
  orientation = 'white',
  boardSize,
  playerColor = 'w',
  themeId = 'endgame-slate',
  moveMode = true,
  onFenChange,
}: PlayBoardProps) => {
  const [currentFen, setCurrentFen] = useState(fen);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);

  useEffect(() => {
    setCurrentFen(fen);
  }, [fen]);

  const engine = useMemo(() => createChessEngine(currentFen), [currentFen]);

  const handleMove = useCallback(
    (from: string, to: string): boolean => {
      const nextEngine = createChessEngine(currentFen);
      const result = nextEngine.move({ from, to });
      if (!result) {
        return false;
      }
      const nextFen = nextEngine.fen();
      const move: LastMove = { from, to };
      setCurrentFen(nextFen);
      setLastMove(move);
      onFenChange?.(nextFen, move);
      return true;
    },
    [currentFen, onFenChange],
  );

  const { interaction, handleSquareActivate } = useBoardInteraction({
    engine,
    playerColor: playerColor ?? null,
    onMove: handleMove,
    lastMove,
  });

  return (
    <CustomChessboard
      fen={currentFen}
      orientation={orientation}
      moveMode={moveMode}
      boardSize={boardSize}
      onMove={handleMove}
      themeId={themeId}
      interactionHighlights={interaction.highlights}
      onSquareActivate={(square, pieceColor) =>
        handleSquareActivate(square, Boolean(pieceColor), pieceColor)
      }
    />
  );
};
