import { Chess } from 'chess.js';
import type {
  CanvasSquareInfluence,
  InfluenceLayer,
  InfluenceRequest,
  InfluenceSummary,
  OverlayRequest,
  OverlayResult,
  SquareInfluence,
  HeatmapTraceMode,
} from '@/features/chessboard/overlays/types';
import { computeInfluenceLayer, buildBoardMatrix } from '@/features/chessboard/overlays/calculators';

type MutableAggregate = {
  totalWeight: number;
  contributions: Array<{ origin: string; piece: InfluenceLayer['piece']; weight: number }>;
};

interface MutableAccumulator {
  white: MutableAggregate;
  black: MutableAggregate;
}

const createAggregate = (): MutableAggregate => ({
  totalWeight: 0,
  contributions: [],
});

const createAccumulator = (): MutableAccumulator => ({
  white: createAggregate(),
  black: createAggregate(),
});

const cloneAggregate = (aggregate: MutableAggregate) => ({
  totalWeight: aggregate.totalWeight,
  contributions: aggregate.contributions.map((sample) => ({
    origin: sample.origin,
    piece: sample.piece,
    weight: sample.weight,
  })),
});

const resolveTraceMode = (input: { traceMode?: HeatmapTraceMode; scheme?: HeatmapTraceMode }): HeatmapTraceMode =>
  input.traceMode ?? input.scheme ?? 'line-of-sight';

export const generateInfluenceSummary = (request: InfluenceRequest): InfluenceSummary => {
  if (request.activePieces.length === 0) {
    return {
      squares: [],
      canvasSquares: [],
      maxSquareWeight: 0,
      maxCanvasWeight: 0,
      overallMaxWeight: 0,
    };
  }

  const traceMode = resolveTraceMode(request);
  const game = new Chess(request.fen);
  const boardMatrix = buildBoardMatrix(game);

  const layers: InfluenceLayer[] = request.activePieces.map(({ square, piece }) =>
    computeInfluenceLayer({
      origin: square,
      piece,
      traceMode,
      boardMatrix,
    }),
  );

  const boardAccumulator: Record<string, MutableAccumulator> = {};
  const canvasAccumulator: Record<string, MutableAccumulator> = {};

  const addContribution = (
    accumulator: MutableAccumulator,
    color: InfluenceLayer['piece']['color'],
    origin: string,
    weight: number,
    piece: InfluenceLayer['piece'],
  ) => {
    const aggregate = color === 'w' ? accumulator.white : accumulator.black;
    aggregate.totalWeight += weight;
    aggregate.contributions.push({ origin, piece, weight });
  };

  layers.forEach((layer) => {
    layer.samples.forEach(({ square, weight }) => {
      const bucket = boardAccumulator[square] ?? createAccumulator();
      addContribution(bucket, layer.piece.color, layer.origin, weight, layer.piece);
      boardAccumulator[square] = bucket;
    });

    layer.canvasSamples.forEach(({ fileIndex, rankIndex, weight }) => {
      const key = `${fileIndex}:${rankIndex}`;
      const bucket = canvasAccumulator[key] ?? createAccumulator();
      addContribution(bucket, layer.piece.color, layer.origin, weight, layer.piece);
      canvasAccumulator[key] = bucket;
    });
  });

  let maxSquareWeight = 0;
  let maxCanvasWeight = 0;

  const squares = Object.entries(boardAccumulator).map(([square, aggregates]) => {
    const white = cloneAggregate(aggregates.white);
    const black = cloneAggregate(aggregates.black);
    const combined = white.totalWeight + black.totalWeight;
    maxSquareWeight = Math.max(maxSquareWeight, white.totalWeight, black.totalWeight, combined);
    return {
      square,
      white,
      black,
    };
  });

  const canvasSquares = Object.entries(canvasAccumulator).map(([key, aggregates]) => {
    const [fileIndexRaw, rankIndexRaw] = key.split(':');
    const fileIndex = Number(fileIndexRaw);
    const rankIndex = Number(rankIndexRaw);
    const white = cloneAggregate(aggregates.white);
    const black = cloneAggregate(aggregates.black);
    const combined = white.totalWeight + black.totalWeight;
    maxCanvasWeight = Math.max(maxCanvasWeight, white.totalWeight, black.totalWeight, combined);
    return {
      fileIndex,
      rankIndex,
      white,
      black,
    };
  });

  const overallMaxWeight = Math.max(maxSquareWeight, maxCanvasWeight);

  return {
    squares,
    canvasSquares,
    maxSquareWeight,
    maxCanvasWeight,
    overallMaxWeight,
  };
};

/**
 * @deprecated Prefer `generateInfluenceSummary` plus scheme renderers.
 */
export const generateHeatmap = (request: OverlayRequest): OverlayResult => {
  const traceMode = resolveTraceMode(request);

  const summary = generateInfluenceSummary({
    fen: request.fen,
    orientation: request.orientation,
    activePieces: request.activePieces,
    traceMode,
  });

  const toLegacySquare = (entry: InfluenceSummary['squares'][number]): SquareInfluence => {
    const whiteWeight = entry.white.totalWeight;
    const blackWeight = entry.black.totalWeight;
    const combinedWeight = request.includeBothSides ? whiteWeight - blackWeight : whiteWeight + blackWeight;

    let dominant: 'white' | 'black' | 'tie' = 'tie';
    if (request.includeBothSides) {
      dominant = combinedWeight > 0 ? 'white' : combinedWeight < 0 ? 'black' : 'tie';
    } else if (whiteWeight !== blackWeight) {
      dominant = whiteWeight > blackWeight ? 'white' : 'black';
    }

    return {
      square: entry.square,
      whiteWeight,
      blackWeight,
      combinedWeight,
      dominant,
    };
  };

  const toLegacyCanvas = (entry: InfluenceSummary['canvasSquares'][number]): CanvasSquareInfluence => {
    const whiteWeight = entry.white.totalWeight;
    const blackWeight = entry.black.totalWeight;
    const combinedWeight = request.includeBothSides ? whiteWeight - blackWeight : whiteWeight + blackWeight;

    let dominant: 'white' | 'black' | 'tie' = 'tie';
    if (request.includeBothSides) {
      dominant = combinedWeight > 0 ? 'white' : combinedWeight < 0 ? 'black' : 'tie';
    } else if (whiteWeight !== blackWeight) {
      dominant = whiteWeight > blackWeight ? 'white' : 'black';
    }

    return {
      fileIndex: entry.fileIndex,
      rankIndex: entry.rankIndex,
      whiteWeight,
      blackWeight,
      combinedWeight,
      dominant,
    };
  };

  const squaresLegacy = summary.squares.map(toLegacySquare);
  const canvasLegacy = summary.canvasSquares.map(toLegacyCanvas);

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

  squaresLegacy.forEach(evaluateWeights);
  canvasLegacy.forEach(evaluateWeights);

  if (!Number.isFinite(maxWeight)) {
    maxWeight = 0;
  }
  if (!Number.isFinite(minWeight)) {
    minWeight = 0;
  }

  return {
    squares: squaresLegacy,
    canvasSquares: canvasLegacy,
    maxWeight,
    minWeight,
  };
};
