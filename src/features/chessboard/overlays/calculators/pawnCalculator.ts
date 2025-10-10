import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, withinBoard, toSquare } from './calculationUtils';

export const computePawnInfluence = ({
  origin,
  piece,
}: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);
  const direction = piece.color === 'w' ? 1 : -1;
  const targets: string[] = [];

  const candidateA = { file: fileIndex + 1, rank: rankIndex + direction };
  const candidateB = { file: fileIndex - 1, rank: rankIndex + direction };

  if (withinBoard(candidateA.file, candidateA.rank)) {
    targets.push(toSquare(candidateA.file, candidateA.rank));
  }

  if (withinBoard(candidateB.file, candidateB.rank)) {
    targets.push(toSquare(candidateB.file, candidateB.rank));
  }

  return {
    piece,
    origin,
    samples: targets.map((square) => ({ square, weight: 1 })),
  };
};

