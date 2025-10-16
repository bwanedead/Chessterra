import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, toSquare, withinBoard, withinCanvas, knightOffsets } from './calculationUtils';

export const computeKnightInfluence = ({ origin, piece }: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);

  const boardTargets: string[] = [];
  const canvasTargets: Array<{ fileIndex: number; rankIndex: number }> = [];

  knightOffsets.forEach(({ df, dr }) => {
    const file = fileIndex + df;
    const rank = rankIndex + dr;
    if (!withinCanvas(file, rank)) {
      return;
    }
    if (withinBoard(file, rank)) {
      boardTargets.push(toSquare(file, rank));
    } else {
      canvasTargets.push({ fileIndex: file, rankIndex: rank });
    }
  });

  return {
    piece,
    origin,
    samples: boardTargets.map((square) => ({ square, weight: 1 })),
    canvasSamples: canvasTargets.map((target) => ({ ...target, weight: 1 })),
  };
};
