import type { ChessPieceDescriptor } from '@/features/chessboard/types';

export type HeatmapScheme = 'absolute' | 'line-of-sight';

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

export interface OverlayRequest {
  fen: string;
  orientation: 'white' | 'black';
  activePieces: Array<{ square: string; piece: ChessPieceDescriptor }>;
  scheme: HeatmapScheme;
  includeBothSides: boolean;
}

export interface SquareInfluence {
  square: string;
  whiteWeight: number;
  blackWeight: number;
  combinedWeight: number;
  dominant: 'white' | 'black' | 'tie';
}

export interface OverlayResult {
  squares: SquareInfluence[];
  canvasSquares: CanvasSquareInfluence[];
  maxWeight: number;
  minWeight: number;
}

export interface CanvasSquareInfluence {
  fileIndex: number;
  rankIndex: number;
  whiteWeight: number;
  blackWeight: number;
  combinedWeight: number;
  dominant: 'white' | 'black' | 'tie';
}
