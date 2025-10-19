import type { Chess } from 'chess.js';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';

export type BoardMatrix = Record<string, ChessPieceDescriptor>;

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const CANVAS_BORDER = 3;
export const CANVAS_SIZE = 8 + CANVAS_BORDER * 2;

export const knightOffsets: Array<{ df: number; dr: number }> = [
  { df: 1, dr: 2 },
  { df: 2, dr: 1 },
  { df: 2, dr: -1 },
  { df: 1, dr: -2 },
  { df: -1, dr: -2 },
  { df: -2, dr: -1 },
  { df: -2, dr: 1 },
  { df: -1, dr: 2 },
];

export const kingOffsets: Array<{ df: number; dr: number }> = [
  { df: 1, dr: 0 },
  { df: 1, dr: 1 },
  { df: 0, dr: 1 },
  { df: -1, dr: 1 },
  { df: -1, dr: 0 },
  { df: -1, dr: -1 },
  { df: 0, dr: -1 },
  { df: 1, dr: -1 },
];

export const rookDirections: Array<{ df: number; dr: number }> = [
  { df: 1, dr: 0 },
  { df: -1, dr: 0 },
  { df: 0, dr: 1 },
  { df: 0, dr: -1 },
];

export const bishopDirections: Array<{ df: number; dr: number }> = [
  { df: 1, dr: 1 },
  { df: 1, dr: -1 },
  { df: -1, dr: 1 },
  { df: -1, dr: -1 },
];

export const queenDirections = [...rookDirections, ...bishopDirections];

export const withinBoard = (fileIndex: number, rankIndex: number) =>
  fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8;

export const withinCanvas = (fileIndex: number, rankIndex: number) =>
  fileIndex >= -CANVAS_BORDER &&
  fileIndex < 8 + CANVAS_BORDER &&
  rankIndex >= -CANVAS_BORDER &&
  rankIndex < 8 + CANVAS_BORDER;

export const toSquare = (fileIndex: number, rankIndex: number) => `${FILES[fileIndex]}${rankIndex + 1}`;

export const fromSquare = (square: string) => {
  const fileChar = square[0] as (typeof FILES)[number];
  const rankChar = square[1];
  const fileIndex = FILES.indexOf(fileChar);
  const rankIndex = Number(rankChar) - 1;
  return { fileIndex, rankIndex };
};

export interface InfluenceParams {
  origin: string;
  piece: ChessPieceDescriptor;
  traceMode?: HeatmapTraceMode;
  scheme?: HeatmapTraceMode;
  boardMatrix: BoardMatrix;
}

export const buildBoardMatrix = (game: Chess): BoardMatrix => {
  const board = game.board();
  const matrix: BoardMatrix = {};

  for (let rankIdx = 0; rankIdx < 8; rankIdx += 1) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx += 1) {
      const piece = board[rankIdx][fileIdx];
      if (piece) {
        const square = toSquare(fileIdx, 7 - rankIdx);
        matrix[square] = { color: piece.color, type: piece.type };
      }
    }
  }

  return matrix;
};

export const rayTrace = ({
  fromFile,
  fromRank,
  directions,
  traceMode,
  boardMatrix,
}: {
  fromFile: number;
  fromRank: number;
  directions: Array<{ df: number; dr: number }>;
  traceMode?: HeatmapTraceMode;
  boardMatrix: BoardMatrix;
}) => {
  const resolvedTraceMode = traceMode ?? 'line-of-sight';
  const boardSquares: string[] = [];
  const canvasSquares: Array<{ fileIndex: number; rankIndex: number }> = [];

  directions.forEach(({ df, dr }) => {
    let file = fromFile + df;
    let rank = fromRank + dr;
    let blocked = false;

    while (withinCanvas(file, rank)) {
      const isOnBoard = withinBoard(file, rank);
      if (isOnBoard) {
        const square = toSquare(file, rank);
        boardSquares.push(square);

        const occupant = boardMatrix[square];
        if (occupant) {
          blocked = true;
          if (resolvedTraceMode === 'absolute') {
            let nextFile = file + df;
            let nextRank = rank + dr;
            while (withinCanvas(nextFile, nextRank)) {
              if (withinBoard(nextFile, nextRank)) {
                boardSquares.push(toSquare(nextFile, nextRank));
              } else {
                canvasSquares.push({ fileIndex: nextFile, rankIndex: nextRank });
              }
              nextFile += df;
              nextRank += dr;
            }
          }
        }

        if (blocked) {
          break;
        }
      } else {
        canvasSquares.push({ fileIndex: file, rankIndex: rank });
      }

      file += df;
      rank += dr;
    }
  });

  return { boardSquares, canvasSquares };
};
