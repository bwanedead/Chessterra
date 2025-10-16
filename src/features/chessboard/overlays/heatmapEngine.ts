import { Chess } from 'chess.js';
import type {
  OverlayRequest,
  OverlayResult,
  InfluenceLayer,
  CanvasSquareInfluence,
} from '@/features/chessboard/overlays/types';
import { computeInfluenceLayer, buildBoardMatrix } from '@/features/chessboard/overlays/calculators';

export const generateHeatmap = (request: OverlayRequest): OverlayResult => {
  if (request.activePieces.length === 0) {
    return {
      squares: [],
      canvasSquares: [],
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

  const boardAccumulator: Record<
    string,
    {
      white: number;
      black: number;
    }
  > = {};

  const canvasAccumulator: Record<
    string,
    {
      white: number;
      black: number;
    }
  > = {};

  layers.forEach((layer) => {
    layer.samples.forEach(({ square, weight }) => {
      const bucket = boardAccumulator[square] ?? { white: 0, black: 0 };
      if (layer.piece.color === 'w') {
        bucket.white += weight;
      } else {
        bucket.black += weight;
      }
      boardAccumulator[square] = bucket;
    });

    layer.canvasSamples.forEach(({ fileIndex, rankIndex, weight }) => {
      const key = `${fileIndex}:${rankIndex}`;
      const bucket = canvasAccumulator[key] ?? { white: 0, black: 0 };
      if (layer.piece.color === 'w') {
        bucket.white += weight;
      } else {
        bucket.black += weight;
      }
      canvasAccumulator[key] = bucket;
    });
  });

  const squares = Object.entries(boardAccumulator).map(([square, weights]) => {
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

  const canvasSquares: CanvasSquareInfluence[] = Object.entries(canvasAccumulator).map(([key, weights]) => {
    const [fileIndexRaw, rankIndexRaw] = key.split(':');
    const fileIndex = Number(fileIndexRaw);
    const rankIndex = Number(rankIndexRaw);

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
      fileIndex,
      rankIndex,
      whiteWeight: weights.white,
      blackWeight: weights.black,
      combinedWeight,
      dominant,
    };
  });

  if (squares.length === 0 && canvasSquares.length === 0) {
    return {
      squares: [],
      canvasSquares: [],
      maxWeight: 0,
      minWeight: 0,
    };
  }

  let maxWeight = Number.NEGATIVE_INFINITY;
  let minWeight = Number.POSITIVE_INFINITY;

  const evaluateWeights = (entry: {
    whiteWeight: number;
    blackWeight: number;
    combinedWeight: number;
  }) => {
    if (request.includeBothSides) {
      maxWeight = Math.max(maxWeight, Math.abs(entry.combinedWeight));
      minWeight = Math.min(minWeight, entry.combinedWeight);
    } else {
      maxWeight = Math.max(maxWeight, entry.whiteWeight, entry.blackWeight, entry.combinedWeight);
      minWeight = Math.min(minWeight, entry.whiteWeight, entry.blackWeight, entry.combinedWeight);
    }
  };

  squares.forEach(evaluateWeights);
  canvasSquares.forEach(evaluateWeights);

  return {
    squares,
    canvasSquares,
    maxWeight: Number.isFinite(maxWeight) ? maxWeight : 0,
    minWeight: Number.isFinite(minWeight) ? minWeight : 0,
  };
};
