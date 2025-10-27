import type { HeatmapSchemeDefinition, SquareOverlayDescriptor } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  intensityForMode,
  resolvePieceColor,
  colorForInfluence,
  lightenHex,
} from '@/features/chessboard/overlays/schemes/utils';

export const contestedFlagScheme: HeatmapSchemeDefinition = {
  id: 'contested-flag',
  label: 'Contested Flag',
  description: 'Marks every contested square with a dedicated highlight so ambiguity disappears.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, colorProfile, influenceIntensityMode, friendlyColor }) => {
    const squares = summary.squares.reduce<Record<string, SquareOverlayDescriptor>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      const contested = analysis.whiteCount > 0 && analysis.blackCount > 0;
      const dominantColor = contested
        ? 'tie'
        : analysis.whiteCount > 0
          ? 'white'
          : analysis.blackCount > 0
            ? 'black'
            : 'tie';

      const intensity = contested
        ? intensityForMode(analysis.totalCount, influenceIntensityMode)
        : intensityForMode(analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount, influenceIntensityMode);

      if (analysis.totalCount === 0 || intensity <= 0) {
        return acc;
      }

      if (contested) {
        // Use a high-visibility yellow for contested flags regardless of theme
        const flagColor = '#ffff00';
        const visibleIntensity = Math.max(0.85, intensity);
        acc[square.square] = buildFlagOverlay({
          color: flagColor,
          intensity: visibleIntensity,
          dominant: 'tie',
          weight: analysis.totalWeight,
          count: analysis.totalCount,
          contested: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
          glowColor: colorProfile.contested.glow ?? '#fff176',
          label: `${analysis.whiteCount}/${analysis.blackCount}`,
        });
        return acc;
      }

      const contributions =
        analysis.whiteCount > 0 ? square.white.contributions : square.black.contributions;
      const palette = resolvePieceColor(contributions, colorProfile, analysis.whiteCount > 0 ? 'w' : 'b');
      const overlayColor = colorForInfluence(
        colorProfile,
        analysis.whiteCount > 0 ? 'white' : 'black',
        analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount,
        influenceIntensityMode,
        friendlyColor,
      );

      acc[square.square] = buildSolidOverlay({
        color: overlayColor,
        glowColor: palette.accent,
        intensity,
        dominant: dominantColor === 'tie' ? 'white' : dominantColor, // tie won't be used here
        weight: analysis.totalWeight,
        count: analysis.totalCount,
        contested: {
          totalContributors: analysis.totalCount,
          whiteContributors: analysis.whiteCount,
          blackContributors: analysis.blackCount,
        },
      });

      return acc;
    }, {});

    const canvas = summary.canvasSquares.reduce<ReturnType<typeof buildCanvasOverlay>[]>((acc, entry) => {
      const analysis = analyzeCanvasInfluence(entry);
      const contested = analysis.whiteCount > 0 && analysis.blackCount > 0;
      const dominantColor = contested
        ? 'tie'
        : analysis.whiteCount > 0
          ? 'white'
          : analysis.blackCount > 0
            ? 'black'
            : 'tie';

      const intensity = contested
        ? intensityForMode(analysis.totalCount, influenceIntensityMode)
        : intensityForMode(analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount, influenceIntensityMode);

      if (analysis.totalCount === 0 || intensity <= 0) {
        return acc;
      }

      if (contested) {
        const flagColor = lightenHex(colorProfile.contested.flag, Math.min(0.6, 0.25 + intensity * 0.4));
        acc.push(
          buildCanvasOverlay({
            id: `${entry.fileIndex}:${entry.rankIndex}`,
            fileIndex: entry.fileIndex,
            rankIndex: entry.rankIndex,
            style: {
              kind: 'flag',
              color: flagColor,
              intensity,
              glow: colorProfile.contested.glow
                ? {
                    color: colorProfile.contested.glow,
                    strength: 0.5,
                  }
                : undefined,
              label: `${analysis.whiteCount}/${analysis.blackCount}`,
            },
            dominant: 'tie',
            totalWeight: analysis.totalWeight,
            totalCount: analysis.totalCount,
            contestedMeta: {
              totalContributors: analysis.totalCount,
              whiteContributors: analysis.whiteCount,
              blackContributors: analysis.blackCount,
            },
          }),
        );
        return acc;
      }

      const contributions =
        analysis.whiteCount > 0 ? entry.white.contributions : entry.black.contributions;
      const palette = resolvePieceColor(contributions, colorProfile, analysis.whiteCount > 0 ? 'w' : 'b');
      const overlayColor = colorForInfluence(
        colorProfile,
        analysis.whiteCount > 0 ? 'white' : 'black',
        analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount,
        influenceIntensityMode,
        friendlyColor,
      );

      acc.push(
        buildCanvasOverlay({
          id: `${entry.fileIndex}:${entry.rankIndex}`,
          fileIndex: entry.fileIndex,
          rankIndex: entry.rankIndex,
          style: {
            kind: 'solid',
            color: overlayColor,
            intensity,
            glow: palette.accent
              ? {
                  color: palette.accent,
                  strength: 0.4,
                }
              : undefined,
          },
          dominant: dominantColor,
          totalWeight: analysis.totalWeight,
          totalCount: analysis.totalCount,
          contestedMeta: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
        }),
      );

      return acc;
    }, []);

    if (process.env.NODE_ENV === 'development') {
      const flaggedSquares = Object.values(squares).filter((overlay) => overlay.style.kind === 'flag').length;
      const renderedSquares = Object.keys(squares).length;
      const sampleFlags = Object.entries(squares)
        .filter(([, overlay]) => overlay.style.kind === 'flag')
        .slice(0, 5)
        .map(([id, overlay]) => `${id}:${overlay.style.label ?? ''}@${overlay.style.intensity.toFixed(2)}`);
      console.log('[scheme contested-flag]', {
        rendered: renderedSquares,
        flagged: flaggedSquares,
        sampleFlags: sampleFlags.join(', '),
      });
    }

    return {
      squares,
      canvas,
      legend: {
        title: 'Contested Flag',
        swatches: [
          { label: 'Contested', color: colorProfile.contested.flag, variant: 'flag' },
          { label: 'White influence', color: colorProfile.pieces.white.q.primary },
          { label: 'Black influence', color: colorProfile.pieces.black.q.primary },
        ],
        notes: 'Contested squares always receive the dedicated flag colour.',
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
  contested,
}: {
  color: string;
  glowColor?: string;
  intensity: number;
  dominant: 'white' | 'black';
  weight: number;
  count: number;
  contested?: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
}) => ({
  style: {
    kind: 'solid' as const,
    color,
    intensity,
    glow: glowColor
      ? {
          color: glowColor,
          strength: 0.45,
        }
      : undefined,
  },
  meta: {
    dominantColor: dominant,
    weight,
    count,
    contested,
  },
});

const buildFlagOverlay = ({
  color,
  glowColor,
  intensity,
  label,
  dominant,
  weight,
  count,
  contested,
}: {
  color: string;
  glowColor?: string;
  intensity: number;
  label?: string;
  dominant: 'white' | 'black' | 'tie';
  weight: number;
  count: number;
  contested?: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
}) => ({
  style: {
    kind: 'flag' as const,
    color,
    intensity,
    glow: glowColor
      ? {
          color: glowColor,
          strength: 0.55,
        }
      : undefined,
    label,
  },
  meta: {
    dominantColor: dominant,
    weight,
    count,
    contested,
  },
});

const buildCanvasOverlay = ({
  id,
  fileIndex,
  rankIndex,
  style,
  dominant,
  totalWeight,
  totalCount,
  contestedMeta,
}: {
  id: string;
  fileIndex: number;
  rankIndex: number;
  style: {
    kind: 'solid' | 'flag';
    color: string;
    intensity: number;
    glow?: {
      color: string;
      strength?: number;
    };
    label?: string;
  };
  dominant: 'white' | 'black' | 'tie';
  totalWeight: number;
  totalCount: number;
  contestedMeta: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
}) => ({
  id,
  fileIndex,
  rankIndex,
  style,
  meta: {
    dominantColor: dominant,
    weight: totalWeight,
    count: totalCount,
    contested: contestedMeta,
  },
});

