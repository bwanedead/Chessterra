import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, toSquare, withinBoard, knightOffsets } from './calculationUtils';

export const computeKnightInfluence = ({ origin, piece }: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);

  const targets = knightOffsets
    .map(({ df, dr }) => ({
      file: fileIndex + df,
      rank: rankIndex + dr,
    }))
    .filter(({ file, rank }) => withinBoard(file, rank))
    .map(({ file, rank }) => toSquare(file, rank));

  return {
    piece,
    origin,
    samples: targets.map((square) => ({ square, weight: 1 })),
  };
};

