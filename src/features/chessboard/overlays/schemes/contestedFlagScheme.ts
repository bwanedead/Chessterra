import type { HeatmapSchemeDefinition } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  normalizeIntensity,
  resolvePieceColor,
} from '@/features/chessboard/overlays/schemes/utils';

export const contestedFlagScheme: HeatmapSchemeDefinition = {
  id: 'contested-flag',
  label: 'Contested Flag',
  description: 'Marks every contested square with a dedicated highlight so ambiguity disappears.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, colorProfile, includeBothSides }) => {
    const squares = summary.squares.reduce<Record<string, ReturnType<typeof buildSquareOverlay>>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      const contested = analysis.whiteCount > 0 && analysis.blackCount > 0;
      const dominantColor = contested
        ? 'tie'
        : analysis.whiteCount > 0
          ? 'white'
          : analysis.blackCount > 0
            ? 'black'
            : 'tie';

      const weightValue = includeBothSides
        ? Math.abs(analysis.whiteWeight - analysis.blackWeight)
        : analysis.totalWeight;
      const intensity = normalizeIntensity(weightValue, summary.overallMaxWeight, 0.4, 0.9);

      if (analysis.totalWeight === 0 || intensity <= 0) {
        return acc;
      }

      if (contested) {
        acc[square.square] = {
          style: {
            kind: 'flag',
            color: colorProfile.contested.flag,
            intensity,
            glow: colorProfile.contested.glow
              ? {
                  color: colorProfile.contested.glow,
                  strength: 0.55,
                }
              : undefined,
            label: `${analysis.whiteCount}/${analysis.blackCount}`,
          },
          meta: {
            dominantColor: 'tie',
            weight: analysis.totalWeight,
            contested: {
              totalContributors: analysis.totalCount,
              whiteContributors: analysis.whiteCount,
              blackContributors: analysis.blackCount,
            },
          },
        };
        return acc;
      }

      const contributions =
        analysis.whiteCount > 0 ? square.white.contributions : square.black.contributions;
      const palette = resolvePieceColor(contributions, colorProfile, analysis.whiteCount > 0 ? 'w' : 'b');

      acc[square.square] = {
        style: {
          kind: 'solid',
          color: palette.primary,
          intensity,
          glow: palette.accent
            ? {
                color: palette.accent,
                strength: 0.45,
              }
            : undefined,
        },
        meta: {
          dominantColor,
          weight: analysis.totalWeight,
          contested: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
        },
      };

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

      const weightValue = includeBothSides
        ? Math.abs(analysis.whiteWeight - analysis.blackWeight)
        : analysis.totalWeight;
      const intensity = normalizeIntensity(weightValue, summary.overallMaxWeight, 0.35, 0.85);

      if (analysis.totalWeight === 0 || intensity <= 0) {
        return acc;
      }

      if (contested) {
        acc.push(
          buildCanvasOverlay({
            id: `${entry.fileIndex}:${entry.rankIndex}`,
            fileIndex: entry.fileIndex,
            rankIndex: entry.rankIndex,
            style: {
              kind: 'flag',
              color: colorProfile.contested.flag,
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

      acc.push(
        buildCanvasOverlay({
          id: `${entry.fileIndex}:${entry.rankIndex}`,
          fileIndex: entry.fileIndex,
          rankIndex: entry.rankIndex,
          style: {
            kind: 'solid',
            color: palette.primary,
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
          contestedMeta: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
        }),
      );

      return acc;
    }, []);

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

const buildCanvasOverlay = ({
  id,
  fileIndex,
  rankIndex,
  style,
  dominant,
  totalWeight,
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
    contested: contestedMeta,
  },
});
