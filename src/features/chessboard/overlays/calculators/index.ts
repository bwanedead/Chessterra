import type { InfluenceLayer } from '@/features/chessboard/overlays/types';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { BoardMatrix, InfluenceParams } from './calculationUtils';
import { computePawnInfluence } from './pawnCalculator';
import { computeKnightInfluence } from './knightCalculator';
import { computeKingInfluence } from './kingCalculator';
import { computeBishopInfluence } from './bishopCalculator';
import { computeRookInfluence } from './rookCalculator';
import { computeQueenInfluence } from './queenCalculator';

export { buildBoardMatrix, fromSquare, toSquare } from './calculationUtils';

type Calculator = (params: InfluenceParams) => InfluenceLayer;

const calculators: Record<ChessPieceDescriptor['type'], Calculator> = {
  p: computePawnInfluence,
  n: computeKnightInfluence,
  b: computeBishopInfluence,
  r: computeRookInfluence,
  q: computeQueenInfluence,
  k: computeKingInfluence,
};

export const computeInfluenceLayer = (params: InfluenceParams): InfluenceLayer => {
  const calculator = calculators[params.piece.type];
  return calculator(params);
};

export type { BoardMatrix, InfluenceParams };

