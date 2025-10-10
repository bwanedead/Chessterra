import { useMemo } from 'react';
import { Chess } from 'chess.js';
import type { HeatmapScheme, OverlayResult } from '@/features/chessboard/overlays/types';
import { generateHeatmap } from '@/features/chessboard/overlays/heatmapEngine';
import { buildBoardMatrix } from '@/features/chessboard/overlays/calculators';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';

const colorWhite = { r: 59, g: 130, b: 246 };
const colorBlack = { r: 239, g: 68, b: 68 };
const colorNeutral = { r: 156, g: 163, b: 175 };

export interface UseHeatmapOverlayOptions {
  fen: string;
  orientation: 'white' | 'black';
  activeToggleIds: string[];
  scheme: HeatmapScheme;
  includeBothSides: boolean;
}

export interface HeatmapOverlayOutput {
  overlays: Record<string, { color: string; opacity: number }>;
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

    const maxWeight = overlayResult.maxWeight || 1;

    return overlayResult.squares.reduce<Record<string, { color: string; opacity: number }>>((acc, square) => {
      const magnitude = includeBothSides
        ? Math.abs(square.combinedWeight)
        : Math.max(square.whiteWeight, square.blackWeight, square.combinedWeight);
      if (magnitude <= 0) {
        return acc;
      }

      const alpha = Math.min(magnitude / maxWeight, 1);
      let color = colorNeutral;
      if (square.dominant === 'white') {
        color = colorWhite;
      } else if (square.dominant === 'black') {
        color = colorBlack;
      }

      acc[square.square] = {
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
        opacity: alpha,
      };
      return acc;
    }, {});
  }, [includeBothSides, overlayResult]);

  return {
    overlays,
    result: overlayResult,
    activePieceCount: activePieces.length,
    hasOverlay: Boolean(overlayResult && overlayResult.squares.length > 0),
  };
};

const buildToggleId = (piece: ChessPieceDescriptor) => `${piece.color}-${piece.type}`;

