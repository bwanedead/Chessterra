import type { HeatmapSchemeDefinition } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  normalizeIntensity,
  resolvePieceColor,
} from '@/features/chessboard/overlays/schemes/utils';

export const neutralCancelScheme: HeatmapSchemeDefinition = {
  id: 'neutral-cancel',
  label: 'Neutral Cancel',
  description: 'Classic overlay: contested squares clear out, leaving only dominant influences visible.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, includeBothSides, colorProfile }) => {
    const squares = summary.squares.reduce<Record<string, ReturnType<typeof buildSolidOverlay>>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      const hasWhite = analysis.whiteCount > 0;
      const hasBlack = analysis.blackCount > 0;
      if (hasWhite && hasBlack) {
        return acc;
      }

      const activeColor = hasWhite ? 'w' : hasBlack ? 'b' : null;
      if (!activeColor) {
        return acc;
      }

      const palette = resolvePieceColor(
        hasWhite ? square.white.contributions : square.black.contributions,
        colorProfile,
        activeColor,
      );

      const weight = hasWhite ? analysis.whiteWeight : analysis.blackWeight;
      const intensity = includeBothSides
        ? normalizeIntensity(Math.abs(analysis.whiteWeight - analysis.blackWeight), summary.overallMaxWeight, 0.4)
        : normalizeIntensity(weight, summary.overallMaxWeight, 0.4);

      if (intensity <= 0) {
        return acc;
      }

      acc[square.square] = buildSolidOverlay({
        color: palette.primary,
        intensity,
        glowColor: palette.accent,
        dominant: hasWhite ? 'white' : 'black',
        weight,
      });
      return acc;
    }, {});

    const canvas = summary.canvasSquares.reduce<ReturnType<typeof buildCanvasOverlay>[]>((acc, entry) => {
      const analysis = analyzeCanvasInfluence(entry);
      const hasWhite = analysis.whiteCount > 0;
      const hasBlack = analysis.blackCount > 0;
      if (hasWhite && hasBlack) {
        return acc;
      }

      const activeColor = hasWhite ? 'w' : hasBlack ? 'b' : null;
      if (!activeColor) {
        return acc;
      }

      const palette = resolvePieceColor(
        hasWhite ? entry.white.contributions : entry.black.contributions,
        colorProfile,
        activeColor,
      );
      const weight = hasWhite ? analysis.whiteWeight : analysis.blackWeight;
      const intensity = includeBothSides
        ? normalizeIntensity(Math.abs(analysis.whiteWeight - analysis.blackWeight), summary.overallMaxWeight, 0.35)
        : normalizeIntensity(weight, summary.overallMaxWeight, 0.35);

      if (intensity <= 0) {
        return acc;
      }

      acc.push(
        buildCanvasOverlay({
          id: `${entry.fileIndex}:${entry.rankIndex}`,
          fileIndex: entry.fileIndex,
          rankIndex: entry.rankIndex,
          color: palette.primary,
          intensity,
          glowColor: palette.accent,
          dominant: hasWhite ? 'white' : 'black',
          weight,
        }),
      );
      return acc;
    }, []);

    return {
      squares,
      canvas,
      legend: {
        title: 'Neutral Cancel Scheme',
        swatches: [
          { label: 'White influence', color: colorProfile.pieces.white.q.primary },
          { label: 'Black influence', color: colorProfile.pieces.black.q.primary },
        ],
        notes: 'Contested squares are left empty.',
      },
    };
  },
};

const buildSolidOverlay = ({
  color,
  intensity,
  glowColor,
  dominant,
  weight,
}: {
  color: string;
  intensity: number;
  glowColor?: string;
  dominant: 'white' | 'black';
  weight: number;
}) => ({
  style: {
    kind: 'solid' as const,
    color,
    intensity,
    glow: glowColor
      ? {
          color: glowColor,
          strength: 0.5,
        }
      : undefined,
  },
  meta: {
    dominantColor: dominant,
    weight,
  },
});

const buildCanvasOverlay = ({
  id,
  fileIndex,
  rankIndex,
  color,
  intensity,
  glowColor,
  dominant,
  weight,
}: {
  id: string;
  fileIndex: number;
  rankIndex: number;
  color: string;
  intensity: number;
  glowColor?: string;
  dominant: 'white' | 'black';
  weight: number;
}) => ({
  id,
  fileIndex,
  rankIndex,
  style: {
    kind: 'solid' as const,
    color,
    intensity,
    glow: glowColor
      ? {
          color: glowColor,
          strength: 0.4,
        }
      : undefined,
  },
  meta: {
    dominantColor: dominant,
    weight,
  },
});
