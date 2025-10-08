import { Chess } from 'chess.js';
import type { Piece } from 'chess.js';
import type { BoardSquare, ChessPieceDescriptor } from '@/features/chessboard/types';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const toPieceDescriptor = (piece: Piece | null | undefined): ChessPieceDescriptor | undefined => {
  if (!piece) {
    return undefined;
  }

  return { color: piece.color, type: piece.type };
};

export const getSquareColor = (fileIndex: number, rankIndex: number): 'light' | 'dark' =>
  (fileIndex + rankIndex) % 2 === 0 ? 'dark' : 'light';

export const buildBoardSquares = (fen: string, orientation: 'white' | 'black'): BoardSquare[] => {
  const game = new Chess(fen);
  const board = game.board();
  const squares: BoardSquare[] = [];

  for (let row = 0; row < 8; row += 1) {
    const rankIndex = orientation === 'white' ? row : 7 - row;
    const rank = orientation === 'white' ? 8 - row : row + 1;

    for (let col = 0; col < 8; col += 1) {
      const fileMatrixIndex = orientation === 'white' ? col : 7 - col;
      const displayFileIndex = orientation === 'white' ? col : 7 - col;
      const piece = board[rankIndex][fileMatrixIndex];
      const fileChar = FILES[displayFileIndex];
      const squareId = `${fileChar}${rank}`;
      const isDark = getSquareColor(fileChar.charCodeAt(0) - 97, rank - 1);

      squares.push({
        id: squareId,
        color: isDark,
        piece: toPieceDescriptor(piece),
      });
    }
  }

  return squares;
};

