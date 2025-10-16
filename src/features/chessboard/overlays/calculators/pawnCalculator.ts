import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, withinBoard, withinCanvas, toSquare } from './calculationUtils';

export const computePawnInfluence = ({
  origin,
  piece,
}: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);
  const direction = piece.color === 'w' ? 1 : -1;
  const boardTargets: string[] = [];
  const canvasTargets: Array<{ fileIndex: number; rankIndex: number }> = [];

  const candidateA = { file: fileIndex + 1, rank: rankIndex + direction };
  const candidateB = { file: fileIndex - 1, rank: rankIndex + direction };

  if (withinCanvas(candidateA.file, candidateA.rank)) {
    if (withinBoard(candidateA.file, candidateA.rank)) {
      boardTargets.push(toSquare(candidateA.file, candidateA.rank));
    } else {
      canvasTargets.push({ fileIndex: candidateA.file, rankIndex: candidateA.rank });
    }
  }

  if (withinCanvas(candidateB.file, candidateB.rank)) {
    if (withinBoard(candidateB.file, candidateB.rank)) {
      boardTargets.push(toSquare(candidateB.file, candidateB.rank));
    } else {
      canvasTargets.push({ fileIndex: candidateB.file, rankIndex: candidateB.rank });
    }
  }

  return {
    piece,
    origin,
    samples: boardTargets.map((square) => ({ square, weight: 1 })),
    canvasSamples: canvasTargets.map((target) => ({ ...target, weight: 1 })),
  };
};
