import type { HeatmapSchemeDefinition } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  normalizeIntensity,
  resolvePieceColor,
} from '@/features/chessboard/overlays/schemes/utils';

const MIN_SEGMENT = 0.05;

export const contestedMixedScheme: HeatmapSchemeDefinition = {
  id: 'contested-mixed',
  label: 'Contested Mix',
  description:
    'Shows contested squares as segmented bars that reflect each side’s piece count and dominant influence.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, colorProfile }) => {
    const squares = summary.squares.reduce<Record<string, ReturnType<typeof buildSquareOverlay>>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      const intensity = normalizeIntensity(analysis.totalWeight, summary.overallMaxWeight, 0.35, 0.95);

      if (analysis.whiteCount === 0 && analysis.blackCount === 0) {
        return acc;
      }

      if (analysis.whiteCount === 0 || analysis.blackCount === 0) {
        const colorInfo = resolvePieceColor(
          analysis.whiteCount > 0 ? square.white.contributions : square.black.contributions,
          colorProfile,
          analysis.whiteCount > 0 ? 'w' : 'b',
        );
        acc[square.square] = buildSquareOverlay({
          mode: 'solid',
          color: colorInfo.primary,
          intensity,
          glow: colorInfo.accent,
          dominant: analysis.whiteCount > 0 ? 'white' : 'black',
          totalWeight: analysis.totalWeight,
          contestedMeta: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
        });
        return acc;
      }

      const whitePalette = resolvePieceColor(square.white.contributions, colorProfile, 'w');
      const blackPalette = resolvePieceColor(square.black.contributions, colorProfile, 'b');

      acc[square.square] = buildSquareOverlay({
        mode: 'segmented',
        intensity,
        white: {
          color: whitePalette.primary,
          count: analysis.whiteCount,
        },
        black: {
          color: blackPalette.primary,
          count: analysis.blackCount,
        },
        dividerColor: colorProfile.contested.divider,
        glow: colorProfile.contested.glow,
        totalWeight: analysis.totalWeight,
        contestedMeta: {
          totalContributors: analysis.totalCount,
          whiteContributors: analysis.whiteCount,
          blackContributors: analysis.blackCount,
        },
      });
      return acc;
    }, {});

    const canvas = summary.canvasSquares.reduce<ReturnType<typeof buildCanvasOverlay>[]>((acc, square) => {
      const analysis = analyzeCanvasInfluence(square);
      const intensity = normalizeIntensity(analysis.totalWeight, summary.overallMaxWeight, 0.3, 0.9);

      if (analysis.whiteCount === 0 && analysis.blackCount === 0) {
        return acc;
      }

      if (analysis.whiteCount === 0 || analysis.blackCount === 0) {
        const colorInfo = resolvePieceColor(
          analysis.whiteCount > 0 ? square.white.contributions : square.black.contributions,
          colorProfile,
          analysis.whiteCount > 0 ? 'w' : 'b',
        );
        acc.push(
          buildCanvasOverlay({
            id: `${square.fileIndex}:${square.rankIndex}`,
            fileIndex: square.fileIndex,
            rankIndex: square.rankIndex,
            mode: 'solid',
            color: colorInfo.primary,
            intensity,
            glow: colorInfo.accent,
            dominant: analysis.whiteCount > 0 ? 'white' : 'black',
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

      const whitePalette = resolvePieceColor(square.white.contributions, colorProfile, 'w');
      const blackPalette = resolvePieceColor(square.black.contributions, colorProfile, 'b');

      acc.push(
        buildCanvasOverlay({
          id: `${square.fileIndex}:${square.rankIndex}`,
          fileIndex: square.fileIndex,
          rankIndex: square.rankIndex,
          mode: 'segmented',
          intensity,
          white: {
            color: whitePalette.primary,
            count: analysis.whiteCount,
          },
          black: {
            color: blackPalette.primary,
            count: analysis.blackCount,
          },
          dividerColor: colorProfile.contested.divider,
          glow: colorProfile.contested.glow,
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
        title: 'Contested Mix',
        swatches: [
          { label: 'White share', color: colorProfile.pieces.white.q.primary, variant: 'segmented' },
          { label: 'Black share', color: colorProfile.pieces.black.q.primary, variant: 'segmented' },
        ],
        notes: 'Segments scale with the number of attacking pieces (counts, not weights).',
      },
    };
  },
};

const buildSquareOverlay = ({
  mode,
  color,
  intensity,
  glow,
  dominant,
  white,
  black,
  dividerColor,
  totalWeight,
  contestedMeta,
}: {
  mode: 'solid';
  color: string;
  intensity: number;
  glow?: string;
  dominant: 'white' | 'black';
  totalWeight: number;
  contestedMeta: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
} | {
  mode: 'segmented';
  intensity: number;
  glow?: string;
  white: { color: string; count: number };
  black: { color: string; count: number };
  dividerColor?: string;
  totalWeight: number;
  contestedMeta: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
}) => {
  if (mode === 'solid') {
    return {
      style: {
        kind: 'solid' as const,
        color,
        intensity,
        glow: glow
          ? {
              color: glow,
              strength: 0.45,
            }
          : undefined,
      },
      meta: {
        dominantColor: dominant,
        weight: totalWeight,
        contested: contestedMeta,
      },
    };
  }

  const total = white.count + black.count;
  const whiteRatio = total === 0 ? 0 : Math.max(MIN_SEGMENT, white.count / total);
  const blackRatio = total === 0 ? 0 : Math.max(MIN_SEGMENT, black.count / total);
  const normalizer = whiteRatio + blackRatio;

  return {
    style: {
      kind: 'segmented' as const,
      segments: [
        { color: white.color, proportion: whiteRatio / normalizer, label: `${white.count}` },
        { color: black.color, proportion: blackRatio / normalizer, label: `${black.count}` },
      ],
      dividerColor,
      intensity,
      glow: glow
        ? {
            color: glow,
            strength: 0.5,
          }
        : undefined,
      orientation: 'horizontal',
      label: `${white.count}:${black.count}`,
    },
    meta: {
      contested: contestedMeta,
      weight: totalWeight,
      dominantColor:
        white.count === black.count ? 'tie' : white.count > black.count ? 'white' : 'black',
    },
  };
};

const buildCanvasOverlay = ({
  id,
  fileIndex,
  rankIndex,
  mode,
  color,
  intensity,
  glow,
  dominant,
  white,
  black,
  dividerColor,
  totalWeight,
  contestedMeta,
}: {
  id: string;
  fileIndex: number;
  rankIndex: number;
  mode: 'solid';
  color: string;
  intensity: number;
  glow?: string;
  dominant: 'white' | 'black';
  totalWeight: number;
  contestedMeta: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
} | {
  id: string;
  fileIndex: number;
  rankIndex: number;
  mode: 'segmented';
  intensity: number;
  glow?: string;
  white: { color: string; count: number };
  black: { color: string; count: number };
  dividerColor?: string;
  totalWeight: number;
  contestedMeta: {
    totalContributors: number;
    whiteContributors: number;
    blackContributors: number;
  };
}) => {
  if (mode === 'solid') {
    return {
      id,
      fileIndex,
      rankIndex,
      style: {
        kind: 'solid' as const,
        color,
        intensity,
        glow: glow
          ? {
              color: glow,
              strength: 0.4,
            }
          : undefined,
      },
      meta: {
        dominantColor: dominant,
        weight: totalWeight,
        contested: contestedMeta,
      },
    };
  }

  const total = white.count + black.count;
  const whiteRatio = total === 0 ? 0 : Math.max(MIN_SEGMENT, white.count / total);
  const blackRatio = total === 0 ? 0 : Math.max(MIN_SEGMENT, black.count / total);
  const normalizer = whiteRatio + blackRatio;

  return {
    id,
    fileIndex,
    rankIndex,
    style: {
      kind: 'segmented' as const,
      segments: [
        { color: white.color, proportion: whiteRatio / normalizer, label: `${white.count}` },
        { color: black.color, proportion: blackRatio / normalizer, label: `${black.count}` },
      ],
      dividerColor,
      intensity,
      glow: glow
        ? {
            color: glow,
            strength: 0.45,
          }
        : undefined,
      orientation: 'horizontal',
      label: `${white.count}:${black.count}`,
    },
    meta: {
      contested: contestedMeta,
      weight: totalWeight,
      dominantColor:
        white.count === black.count ? 'tie' : white.count > black.count ? 'white' : 'black',
    },
  };
};
