import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, bishopDirections, rayTrace } from './calculationUtils';

export const computeBishopInfluence = ({
  origin,
  piece,
  scheme,
  boardMatrix,
}: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);
  const squares = rayTrace({
    fromFile: fileIndex,
    fromRank: rankIndex,
    directions: bishopDirections,
    scheme,
    boardMatrix,
  });

  return {
    piece,
    origin,
    samples: squares.map((square) => ({ square, weight: 1 })),
  };
};
