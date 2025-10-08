import { useMemo } from 'react';
import type { BoardSquare } from '@/features/chessboard/types';
import { buildBoardSquares } from '@/lib/chessboard/boardState';

interface UseBoardSquaresParams {
  fen: string;
  orientation: 'white' | 'black';
  boardSize: number;
}

interface UseBoardSquaresResult {
  squares: BoardSquare[];
  piecePixelSize: number;
}

export const useBoardSquares = ({
  fen,
  orientation,
  boardSize,
}: UseBoardSquaresParams): UseBoardSquaresResult => {
  const squares = useMemo(() => buildBoardSquares(fen, orientation), [fen, orientation]);
  const piecePixelSize = Math.max(24, Math.floor((boardSize / 8) * 0.9));

  return { squares, piecePixelSize };
};

