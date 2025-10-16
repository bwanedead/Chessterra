import { useMemo } from 'react';
import { Chess } from 'chess.js';
import type { HeatmapScheme, OverlayResult } from '@/features/chessboard/overlays/types';
import { generateHeatmap } from '@/features/chessboard/overlays/heatmapEngine';
import { buildBoardMatrix } from '@/features/chessboard/overlays/calculators';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';

const WHITE_SCALE = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a', '#1e40af', '#1e293b'] as const;
const BLACK_SCALE = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'] as const;
const NEUTRAL_SCALE = ['#6366f1', '#4338ca', '#312e81', '#1e1b4b', '#111827', '#0f172a'] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface UseHeatmapOverlayOptions {
  fen: string;
  orientation: 'white' | 'black';
  activeToggleIds: string[];
  scheme: HeatmapScheme;
  includeBothSides: boolean;
}

export interface HeatmapOverlayEntry {
  color: string;
  magnitude: number;
  maxWeight: number;
  strength: number;
}

export interface CanvasHeatmapOverlayEntry extends HeatmapOverlayEntry {
  id: string;
  fileIndex: number;
  rankIndex: number;
}

export interface HeatmapOverlayOutput {
  overlays: Record<string, HeatmapOverlayEntry>;
  canvasOverlays: CanvasHeatmapOverlayEntry[];
  result: OverlayResult | null;
  activePieceCount: number;
  hasOverlay: boolean;
}

export const useHeatmapOverlay = ({
  fen,
  orientation,
  activeToggleIds,
  scheme,
  includeBothSides,
}: UseHeatmapOverlayOptions): HeatmapOverlayOutput => {
  const toggleSet = useMemo(() => new Set(activeToggleIds), [activeToggleIds]);

  const activePieces = useMemo(() => {
    if (toggleSet.size === 0) {
      return [];
    }

    const game = new Chess(fen);
    const matrix = buildBoardMatrix(game);
    return Object.entries(matrix)
      .filter(([, descriptor]) => toggleSet.has(buildToggleId(descriptor)))
      .map(([square, piece]) => ({ square, piece }));
  }, [fen, toggleSet]);

  const overlayResult = useMemo(() => {
    if (activePieces.length === 0) {
      return null;
    }

    return generateHeatmap({
      fen,
      orientation,
      activePieces,
      scheme,
      includeBothSides,
    });
  }, [activePieces, fen, includeBothSides, orientation, scheme]);

  const overlays = useMemo(() => {
    if (!overlayResult || overlayResult.squares.length === 0) {
      return {};
    }

    return overlayResult.squares.reduce<Record<string, HeatmapOverlayEntry>>((acc, square) => {
      const magnitude = includeBothSides
        ? Math.abs(square.combinedWeight)
        : Math.max(square.whiteWeight, square.blackWeight, square.combinedWeight);
      if (magnitude <= 0) {
        return acc;
      }

      const magnitudeLevel = Math.max(1, Math.round(magnitude));

      let palette = NEUTRAL_SCALE;
      if (square.dominant === 'white') {
        palette = WHITE_SCALE;
      } else if (square.dominant === 'black') {
        palette = BLACK_SCALE;
      }

      const index = Math.min(palette.length - 1, magnitudeLevel - 1);
      const intensityBase = 0.6 + Math.min(magnitudeLevel - 1, palette.length - 1) * 0.08;
      const strength = clamp(intensityBase, 0.45, 0.85);
      acc[square.square] = {
        color: palette[index],
        magnitude,
        maxWeight: magnitudeLevel,
        strength,
      };
      return acc;
    }, {});
  }, [includeBothSides, overlayResult]);

  const canvasOverlays = useMemo(() => {
    if (!overlayResult || overlayResult.canvasSquares.length === 0) {
      return [];
    }

    return overlayResult.canvasSquares.reduce<CanvasHeatmapOverlayEntry[]>((acc, square) => {
      const magnitude = includeBothSides
        ? Math.abs(square.combinedWeight)
        : Math.max(square.whiteWeight, square.blackWeight, square.combinedWeight);
      if (magnitude <= 0) {
        return acc;
      }

      const magnitudeLevel = Math.max(1, Math.round(magnitude));

      let palette = NEUTRAL_SCALE;
      if (square.dominant === 'white') {
        palette = WHITE_SCALE;
      } else if (square.dominant === 'black') {
        palette = BLACK_SCALE;
      }

      const index = Math.min(palette.length - 1, magnitudeLevel - 1);
      const intensityBase = 0.6 + Math.min(magnitudeLevel - 1, palette.length - 1) * 0.08;
      const strength = clamp(intensityBase, 0.45, 0.85);
      acc.push({
        id: `${square.fileIndex}:${square.rankIndex}`,
        fileIndex: square.fileIndex,
        rankIndex: square.rankIndex,
        color: palette[index],
        magnitude,
        maxWeight: magnitudeLevel,
        strength,
      });
      return acc;
    }, []);
  }, [includeBothSides, overlayResult]);

  return {
    overlays,
    canvasOverlays,
    result: overlayResult,
    activePieceCount: activePieces.length,
    hasOverlay: Boolean(
      overlayResult && (overlayResult.squares.length > 0 || overlayResult.canvasSquares.length > 0),
    ),
  };
};

const buildToggleId = (piece: ChessPieceDescriptor) => `${piece.color}-${piece.type}`;
