import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, queenDirections, rayTrace } from './calculationUtils';

export const computeQueenInfluence = ({
  origin,
  piece,
  scheme,
  boardMatrix,
}: InfluenceParams): InfluenceLayer => {
  const { fileIndex, rankIndex } = fromSquare(origin);
  const { boardSquares, canvasSquares } = rayTrace({
    fromFile: fileIndex,
    fromRank: rankIndex,
    directions: queenDirections,
    scheme,
    boardMatrix,
  });

  return {
    piece,
    origin,
    samples: boardSquares.map((square) => ({ square, weight: 1 })),
    canvasSamples: canvasSquares.map((sample) => ({ ...sample, weight: 1 })),
  };
};
