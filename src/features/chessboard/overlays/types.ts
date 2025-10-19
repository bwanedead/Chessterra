import type { ChessPieceDescriptor } from '@/features/chessboard/types';

export type HeatmapTraceMode = 'absolute' | 'line-of-sight';

/**
 * Temporary alias maintained while legacy code paths migrate to the new naming.
 * Remove once all callers have switched to `HeatmapTraceMode`.
 */
export type HeatmapScheme = HeatmapTraceMode;

export interface InfluenceSample {
  square: string;
  weight: number;
}

export interface CanvasInfluenceSample {
  fileIndex: number;
  rankIndex: number;
  weight: number;
}

export interface InfluenceLayer {
  piece: ChessPieceDescriptor;
  origin: string;
  samples: InfluenceSample[];
  canvasSamples: CanvasInfluenceSample[];
}

export interface InfluenceRequest {
  fen: string;
  orientation: 'white' | 'black';
  activePieces: Array<{ square: string; piece: ChessPieceDescriptor }>;
  traceMode: HeatmapTraceMode;
  /**
   * @deprecated Use `traceMode`.
   */
  scheme?: HeatmapTraceMode;
}

export interface InfluenceContribution {
  piece: ChessPieceDescriptor;
  origin: string;
  weight: number;
}

export interface InfluenceAggregate {
  totalWeight: number;
  contributions: InfluenceContribution[];
}

export interface SquareInfluenceSummary {
  square: string;
  white: InfluenceAggregate;
  black: InfluenceAggregate;
}

export interface CanvasInfluenceSummary {
  fileIndex: number;
  rankIndex: number;
  white: InfluenceAggregate;
  black: InfluenceAggregate;
}

export interface InfluenceSummary {
  squares: SquareInfluenceSummary[];
  canvasSquares: CanvasInfluenceSummary[];
  maxSquareWeight: number;
  maxCanvasWeight: number;
  /**
   * Combined maximum across board and canvas samples.
   */
  overallMaxWeight: number;
}

/**
 * Legacy overlay request still used by the UI while the new scheme architecture is being built.
 * @deprecated Migrate callers to consume `InfluenceSummary` and scheme renderers.
 */
export interface OverlayRequest extends InfluenceRequest {
  includeBothSides: boolean;
}

/**
 * @deprecated Replaced by scheme-specific overlays. Retained temporarily for compatibility.
 */
export interface SquareInfluence {
  square: string;
  whiteWeight: number;
  blackWeight: number;
  combinedWeight: number;
  dominant: 'white' | 'black' | 'tie';
}

/**
 * @deprecated Replaced by scheme-specific overlays. Retained temporarily for compatibility.
 */
export interface CanvasSquareInfluence {
  fileIndex: number;
  rankIndex: number;
  whiteWeight: number;
  blackWeight: number;
  combinedWeight: number;
  dominant: 'white' | 'black' | 'tie';
}

/**
 * @deprecated Replaced by scheme-specific overlays. Retained temporarily for compatibility.
 */
export interface OverlayResult {
  squares: SquareInfluence[];
  canvasSquares: CanvasSquareInfluence[];
  maxWeight: number;
  minWeight: number;
}
