import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { InfluenceParams } from './calculationUtils';
import { fromSquare, bishopDirections, rayTrace } from './calculationUtils';

export const computeBishopInfluence = ({
  origin,
  piece,
  traceMode,
  scheme,
  boardMatrix,
}: InfluenceParams): InfluenceLayer => {
  const resolvedTraceMode = traceMode ?? scheme ?? 'line-of-sight';
  const { fileIndex, rankIndex } = fromSquare(origin);
  const { boardSquares, canvasSquares } = rayTrace({
    fromFile: fileIndex,
    fromRank: rankIndex,
    directions: bishopDirections,
    traceMode: resolvedTraceMode,
    boardMatrix,
  });

  return {
    piece,
    origin,
    samples: boardSquares.map((square) => ({ square, weight: 1 })),
    canvasSamples: canvasSquares.map((sample) => ({ ...sample, weight: 1 })),
  };
};
