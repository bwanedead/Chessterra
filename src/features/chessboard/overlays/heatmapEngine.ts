import { Chess } from 'chess.js';
import type { OverlayRequest, OverlayResult, InfluenceLayer } from '@/features/chessboard/overlays/types';
import { computeInfluenceLayer, buildBoardMatrix } from '@/features/chessboard/overlays/calculators';

export const generateHeatmap = (request: OverlayRequest): OverlayResult => {
  if (request.activePieces.length === 0) {
    return {
      squares: [],
      maxWeight: 0,
      minWeight: 0,
    };
  }

  const game = new Chess(request.fen);
  const boardMatrix = buildBoardMatrix(game);

  const layers: InfluenceLayer[] = request.activePieces.map(({ square, piece }) =>
    computeInfluenceLayer({
      origin: square,
      piece,
      scheme: request.scheme,
      boardMatrix,
    }),
  );

  const accumulator: Record<
    string,
    {
      white: number;
      black: number;
    }
  > = {};

  layers.forEach((layer) => {
    layer.samples.forEach(({ square, weight }) => {
      const bucket = accumulator[square] ?? { white: 0, black: 0 };
      if (layer.piece.color === 'w') {
        bucket.white += weight;
      } else {
        bucket.black += weight;
      }
      accumulator[square] = bucket;
    });
  });

  const squares = Object.entries(accumulator).map(([square, weights]) => {
    const combinedWeight = request.includeBothSides
      ? weights.white - weights.black
      : weights.white + weights.black;

    let dominant: 'white' | 'black' | 'tie' = 'tie';
    if (request.includeBothSides) {
      dominant = combinedWeight > 0 ? 'white' : combinedWeight < 0 ? 'black' : 'tie';
    } else if (weights.white !== weights.black) {
      dominant = weights.white > weights.black ? 'white' : 'black';
    }

    return {
      square,
      whiteWeight: weights.white,
      blackWeight: weights.black,
      combinedWeight,
      dominant,
    };
  });

  if (squares.length === 0) {
    return {
      squares: [],
      maxWeight: 0,
      minWeight: 0,
    };
  }

  let maxWeight = Number.NEGATIVE_INFINITY;
  let minWeight = Number.POSITIVE_INFINITY;

  squares.forEach((entry) => {
    if (request.includeBothSides) {
      maxWeight = Math.max(maxWeight, Math.abs(entry.combinedWeight));
      minWeight = Math.min(minWeight, entry.combinedWeight);
    } else {
      maxWeight = Math.max(maxWeight, entry.whiteWeight, entry.blackWeight, entry.combinedWeight);
      minWeight = Math.min(minWeight, entry.whiteWeight, entry.blackWeight, entry.combinedWeight);
    }
  });

  return {
    squares,
    maxWeight: Number.isFinite(maxWeight) ? maxWeight : 0,
    minWeight: Number.isFinite(minWeight) ? minWeight : 0,
  };
};
