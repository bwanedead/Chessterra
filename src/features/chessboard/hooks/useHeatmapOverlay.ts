import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { buildBoardMatrix } from '@/features/chessboard/overlays/calculators';
import { generateInfluenceSummary } from '@/features/chessboard/overlays/heatmapEngine';
import {
  getHeatmapScheme,
  type HeatmapSchemeDefinition,
  type HeatmapSchemeId,
  type HeatmapSchemeRenderResult,
  type SquareOverlayDescriptor,
  type CanvasOverlayDescriptor,
} from '@/features/chessboard/overlays/schemes';
import { resolveColorProfile, type HeatmapColorOverrides, type HeatmapColorProfileId } from '@/features/chessboard/overlays/colors';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import { buildToggleId } from '@/features/chessboard/state/heatmapSettingsContext';

export interface UseHeatmapOverlayOptions {
  fen: string;
  orientation: 'white' | 'black';
  activeToggleIds: string[];
  schemeId: HeatmapSchemeId;
  subScheme: HeatmapTraceMode;
  includeBothSides: boolean;
  colorProfileId: HeatmapColorProfileId;
  colorOverrides?: HeatmapColorOverrides | null;
  highlightChecks: boolean;
}

export interface HeatmapOverlayOutput {
  squares: Record<string, SquareOverlayDescriptor>;
  canvas: CanvasOverlayDescriptor[];
  scheme: HeatmapSchemeDefinition | null;
  render: HeatmapSchemeRenderResult | null;
  activePieceCount: number;
  hasOverlay: boolean;
  colorProfileId: HeatmapColorProfileId;
}

export const useHeatmapOverlay = ({
  fen,
  orientation,
  activeToggleIds,
  schemeId,
  subScheme,
  includeBothSides,
  colorProfileId,
  colorOverrides,
  highlightChecks,
}: UseHeatmapOverlayOptions): HeatmapOverlayOutput => {
  const toggleSet = useMemo(() => new Set(activeToggleIds), [activeToggleIds]);

  const gameState = useMemo(() => {
    const game = new Chess(fen);
    const matrix = buildBoardMatrix(game);
    if (toggleSet.size === 0) {
      return {
        game,
        matrix,
        activePieces: [] as Array<{ square: string; piece: ChessPieceDescriptor }>,
      };
    }

    const activePieces = Object.entries(matrix)
      .filter(([, descriptor]) => toggleSet.has(buildToggleId(descriptor)))
      .map(([square, piece]) => ({ square, piece }));

    return { game, matrix, activePieces };
  }, [fen, toggleSet]);

  if (process.env.NODE_ENV === 'development') {

    console.log(
      `heatmap-active-pieces toggles=${toggleSet.size} active=${gameState.activePieces.length} sample=${gameState.activePieces
        .slice(0, 3)
        .map((entry) => entry.square)
        .join(',')}`,
    );
  }

  const scheme = useMemo(() => getHeatmapScheme(schemeId), [schemeId]);

  const colorProfile = useMemo(
    () => resolveColorProfile(colorProfileId, colorOverrides ?? undefined),
    [colorOverrides, colorProfileId],
  );

  const renderResult = useMemo(() => {
    const summary =
      gameState.activePieces.length === 0
        ? null
        : generateInfluenceSummary({
            fen,
            orientation,
            activePieces: gameState.activePieces,
            traceMode: subScheme,
          });

    if (!summary) {
      if (process.env.NODE_ENV === 'development') {

        console.log(`heatmap-summary empty active=${gameState.activePieces.length}`);
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {

      console.log(
        `heatmap-summary squares=${summary.squares.length} canvas=${summary.canvasSquares.length} maxWeight=${summary.overallMaxWeight}`,
      );
    }

    return scheme.render({
      summary,
      subScheme,
      includeBothSides,
      colorProfile,
    });
  }, [colorProfile, fen, gameState.activePieces, includeBothSides, orientation, scheme, subScheme]);

  const highlightedResult = useMemo(() => {
    const baseSquares = renderResult ? { ...renderResult.squares } : {};
    const baseCanvas = renderResult ? renderResult.canvas.slice() : [];

    if (highlightChecks) {
      const highlights: Array<{ square: string; type: 'check' | 'mate'; color: 'w' | 'b' }> = [];
      const { game } = gameState;
      const turn = game.turn() as 'w' | 'b';
      const chessApi = game as unknown as {
        isCheckmate?: () => boolean;
        in_checkmate?: () => boolean;
        inCheck?: () => boolean;
        in_check?: () => boolean;
      };
      const isCheckmate = chessApi.isCheckmate
        ? chessApi.isCheckmate()
        : chessApi.in_checkmate
          ? chessApi.in_checkmate()
          : false;
      const isInCheck = chessApi.inCheck
        ? chessApi.inCheck()
        : chessApi.in_check
          ? chessApi.in_check()
          : false;
      const findKingSquare = (color: 'w' | 'b') => {
        const entry = Object.entries(gameState.matrix).find(
          ([, descriptor]) => descriptor.type === 'k' && descriptor.color === color,
        );
        return entry ? entry[0] : null;
      };

      if (isCheckmate) {
        const square = findKingSquare(turn);
        if (square) {
          highlights.push({ square, type: 'mate', color: turn });
        }
      } else if (isInCheck) {
        const square = findKingSquare(turn);
        if (square) {
          highlights.push({ square, type: 'check', color: turn });
        }
      }

      if (highlights.length > 0) {
        highlights.forEach(({ square, type, color }) => {
          const colorToken = type === 'mate' ? colorProfile.check.checkmate : colorProfile.check.inCheck;
          baseSquares[square] = {
            style: {
              kind: 'flag',
              color: colorToken,
              intensity: type === 'mate' ? 1 : 0.9,
              glow: {
                color: colorToken,
                strength: type === 'mate' ? 0.8 : 0.6,
              },
              label: type === 'mate' ? 'Mate' : 'Check',
            },
            meta: {
              dominantColor: color === 'w' ? 'white' : 'black',
            },
          };
        });
      }
    }

    if (renderResult || Object.keys(baseSquares).length > 0 || baseCanvas.length > 0) {
      return {
        squares: baseSquares,
        canvas: baseCanvas,
        legend: renderResult?.legend,
      };
    }

    return null;
  }, [colorProfile, gameState, highlightChecks, renderResult]);

  if (process.env.NODE_ENV === 'development') {
    const squareCount = Object.keys(highlightedResult?.squares ?? {}).length;
    const canvasCount = highlightedResult?.canvas.length ?? 0;

    console.log(
      `heatmap-overlay activePieces=${gameState.activePieces.length} squares=${squareCount} canvas=${canvasCount} scheme=${scheme.id} sub=${subScheme} includeBoth=${includeBothSides}`,
    );
  }

  return {
    squares: highlightedResult?.squares ?? {},
    canvas: highlightedResult?.canvas ?? [],
    scheme,
    render: highlightedResult,
    activePieceCount: gameState.activePieces.length,
    hasOverlay: Boolean(
      highlightedResult && (Object.keys(highlightedResult.squares).length > 0 || highlightedResult.canvas.length > 0),
    ),
    colorProfileId,
  };
};
