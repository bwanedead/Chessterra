import type { HeatmapSchemeDefinition } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  intensityForMode,
  resolvePieceColor,
  colorForInfluence,
} from '@/features/chessboard/overlays/schemes/utils';

export const neutralCancelScheme: HeatmapSchemeDefinition = {
  id: 'neutral-cancel',
  label: 'Neutral Cancel',
  description: 'Classic overlay: contested squares clear out, leaving only dominant influences visible.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, colorProfile, influenceIntensityMode, friendlyColor }) => {
    const analysisMap = new Map<string, ReturnType<typeof analyzeSquareInfluence>>();
    const squares = summary.squares.reduce<Record<string, ReturnType<typeof buildSolidOverlay>>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      analysisMap.set(square.square, analysis);
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

      const pieceCount = hasWhite ? analysis.whiteCount : analysis.blackCount;
      const weight = hasWhite ? analysis.whiteWeight : analysis.blackWeight;
      const intensity = intensityForMode(pieceCount, influenceIntensityMode);

      if (intensity <= 0) {
        return acc;
      }

      const overlayColor = colorForInfluence(
        colorProfile,
        hasWhite ? 'white' : 'black',
        pieceCount,
        influenceIntensityMode,
        friendlyColor,
      );

      acc[square.square] = buildSolidOverlay({
        color: overlayColor,
        glowColor: palette.accent,
        intensity,
        dominant: hasWhite ? 'white' : 'black',
        weight,
        count: pieceCount,
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
      const pieceCount = hasWhite ? analysis.whiteCount : analysis.blackCount;
      const weight = hasWhite ? analysis.whiteWeight : analysis.blackWeight;
      const intensity = intensityForMode(pieceCount, influenceIntensityMode);

      if (intensity <= 0) {
        return acc;
      }

      const overlayColor = colorForInfluence(
        colorProfile,
        hasWhite ? 'white' : 'black',
        pieceCount,
        influenceIntensityMode,
        friendlyColor,
      );

      acc.push(
        buildCanvasOverlay({
          id: `${entry.fileIndex}:${entry.rankIndex}`,
          fileIndex: entry.fileIndex,
          rankIndex: entry.rankIndex,
          color: overlayColor,
          glowColor: palette.accent,
          intensity,
          dominant: hasWhite ? 'white' : 'black',
          weight,
          count: pieceCount,
        }),
      );
      return acc;
    }, []);

    if (process.env.NODE_ENV === 'development') {
      const contestedSkipped = Array.from(analysisMap.values()).filter(
        (analysis) => analysis.whiteCount > 0 && analysis.blackCount > 0,
      ).length;
      const renderedSquares = Object.entries(squares);
      const sample = renderedSquares.slice(0, 5).map(([id, overlay]) => {
        const analysis = analysisMap.get(id);
        const count = analysis ? analysis.whiteCount + analysis.blackCount : overlay.meta?.count ?? 0;
        return `${id}:${count}@${overlay.style.intensity.toFixed(2)}`;
      });
      console.log('[scheme neutral-cancel]', {
        rendered: renderedSquares.length,
        contestedSkipped,
        sample: sample.join(', '),
      });
    }

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
  glowColor,
  intensity,
  dominant,
  weight,
  count,
}: {
  color: string;
  glowColor?: string;
  intensity: number;
  dominant: 'white' | 'black';
  weight: number;
  count: number;
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
    count,
  },
});

const buildCanvasOverlay = ({
  id,
  fileIndex,
  rankIndex,
  color,
  glowColor,
  intensity,
  dominant,
  weight,
  count,
}: {
  id: string;
  fileIndex: number;
  rankIndex: number;
  color: string;
  glowColor?: string;
  intensity: number;
  dominant: 'white' | 'black';
  weight: number;
  count: number;
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
    count,
  },
});
