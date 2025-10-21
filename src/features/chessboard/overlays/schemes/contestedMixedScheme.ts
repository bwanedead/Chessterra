import type { HeatmapSchemeDefinition } from '@/features/chessboard/overlays/schemes/types';
import {
  analyzeSquareInfluence,
  analyzeCanvasInfluence,
  intensityFromCount,
  resolvePieceColor,
  colorForCount,
} from '@/features/chessboard/overlays/schemes/utils';

const MIN_SEGMENT = 0.05;

export const contestedMixedScheme: HeatmapSchemeDefinition = {
  id: 'contested-mixed',
  label: 'Contested Mix',
  description:
    'Shows contested squares as segmented bars that reflect each side’s piece count and dominant influence.',
  supportedSubSchemes: ['line-of-sight', 'absolute'],
  render: ({ summary, colorProfile }) => {
    const squareAnalysis = new Map<string, ReturnType<typeof analyzeSquareInfluence>>();
    const squares = summary.squares.reduce<Record<string, ReturnType<typeof buildSquareOverlay>>>((acc, square) => {
      const analysis = analyzeSquareInfluence(square);
      squareAnalysis.set(square.square, analysis);
      if (analysis.totalCount === 0) {
        return acc;
      }

      const contested = analysis.whiteCount > 0 && analysis.blackCount > 0;

      if (!contested) {
        const colorInfo = resolvePieceColor(
          analysis.whiteCount > 0 ? square.white.contributions : square.black.contributions,
          colorProfile,
          analysis.whiteCount > 0 ? 'w' : 'b',
        );
        const pieceCount = analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount;
        const intensity = intensityFromCount(pieceCount);
        const overlayColor = colorForCount(analysis.whiteCount > 0 ? 'white' : 'black', pieceCount);
        acc[square.square] = buildSquareOverlay({
          mode: 'solid',
          color: overlayColor,
          intensity,
          glow: colorInfo.accent,
          dominant: analysis.whiteCount > 0 ? 'white' : 'black',
          totalWeight: analysis.totalWeight,
          totalCount: analysis.totalCount,
          contestedMeta: {
            totalContributors: analysis.totalCount,
            whiteContributors: analysis.whiteCount,
            blackContributors: analysis.blackCount,
          },
        });
        return acc;
      }

      const intensity = intensityFromCount(analysis.totalCount);
      const whiteColor = colorForCount('white', analysis.whiteCount);
      const blackColor = colorForCount('black', analysis.blackCount);

      acc[square.square] = buildSquareOverlay({
        mode: 'segmented',
        intensity,
        white: {
          color: whiteColor,
          count: analysis.whiteCount,
        },
        black: {
          color: blackColor,
          count: analysis.blackCount,
        },
        dividerColor: colorProfile.contested.divider,
        glow: colorProfile.contested.glow,
        totalWeight: analysis.totalWeight,
        totalCount: analysis.totalCount,
        contestedMeta: {
          totalContributors: analysis.totalCount,
          whiteContributors: analysis.whiteCount,
          blackContributors: analysis.blackCount,
        },
      });
      return acc;
    }, {});

    const canvas = summary.canvasSquares.reduce<ReturnType<typeof buildCanvasOverlay>[]>((acc, entry) => {
      const analysis = analyzeCanvasInfluence(entry);
      if (analysis.totalCount === 0) {
        return acc;
      }

      const contested = analysis.whiteCount > 0 && analysis.blackCount > 0;

      if (!contested) {
        const colorInfo = resolvePieceColor(
          analysis.whiteCount > 0 ? entry.white.contributions : entry.black.contributions,
          colorProfile,
          analysis.whiteCount > 0 ? 'w' : 'b',
        );
        const pieceCount = analysis.whiteCount > 0 ? analysis.whiteCount : analysis.blackCount;
        const intensity = intensityFromCount(pieceCount);
        const overlayColor = colorForCount(analysis.whiteCount > 0 ? 'white' : 'black', pieceCount);
        acc.push(
          buildCanvasOverlay({
            id: `${entry.fileIndex}:${entry.rankIndex}`,
            fileIndex: entry.fileIndex,
            rankIndex: entry.rankIndex,
            mode: 'solid',
            color: overlayColor,
            intensity,
            glow: colorInfo.accent,
            dominant: analysis.whiteCount > 0 ? 'white' : 'black',
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

      const intensity = intensityFromCount(analysis.totalCount);
      const whiteColor = colorForCount('white', analysis.whiteCount);
      const blackColor = colorForCount('black', analysis.blackCount);

      acc.push(
        buildCanvasOverlay({
          id: `${entry.fileIndex}:${entry.rankIndex}`,
          fileIndex: entry.fileIndex,
          rankIndex: entry.rankIndex,
          mode: 'segmented',
          intensity,
          white: {
            color: whiteColor,
            count: analysis.whiteCount,
          },
          black: {
            color: blackColor,
            count: analysis.blackCount,
          },
          dividerColor: colorProfile.contested.divider,
          glow: colorProfile.contested.glow,
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
      const totalRendered = Object.keys(squares).length;
      const segmentedCount = Object.values(squares).filter((overlay) => overlay.style.kind === 'segmented').length;
      const contestedSquares = Array.from(squareAnalysis.values()).filter((entry) => entry.whiteCount > 0 && entry.blackCount > 0).length;
      const sampleSegments = Object.entries(squares)
        .filter(([, overlay]) => overlay.style.kind === 'segmented')
        .slice(0, 3)
        .map(([id, overlay]) => {
          if (overlay.style.kind !== 'segmented') {
            return `${id}:n/a`;
          }
          const breakdown = squareAnalysis.get(id);
          const whiteCount =
            breakdown?.whiteCount ?? overlay.meta.contested.whiteContributors ?? 0;
          const blackCount =
            breakdown?.blackCount ?? overlay.meta.contested.blackContributors ?? 0;
          const intensityLabel = overlay.style.intensity.toFixed(2);
          return `${id}: w${whiteCount}/b${blackCount} @ ${intensityLabel}`;
        });
      const sampleSolids = Object.entries(squares)
        .filter(([, overlay]) => overlay.style.kind === 'solid')
        .slice(0, 3)
        .map(([id, overlay]) => {
          const breakdown = squareAnalysis.get(id);
          if (overlay.style.kind !== 'solid') {
            return `${id}:n/a`;
          }
          const count = breakdown?.totalCount ?? overlay.meta.count ?? 0;
          const intensityLabel = overlay.style.intensity.toFixed(2);
          return `${id}: ${overlay.meta.dominantColor} ${count} @ ${intensityLabel}`;
        });
      const segmentLog = sampleSegments.length > 0 ? sampleSegments.join(' | ') : '(none)';
      const solidLog = sampleSolids.length > 0 ? sampleSolids.join(' | ') : '(none)';
      console.log(
        `[scheme contested-mixed] rendered=${totalRendered} segmented=${segmentedCount} contested=${contestedSquares} segments=${segmentLog} solids=${solidLog}`,
      );
    }
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
  totalCount,
  contestedMeta,
}: {
  mode: 'solid';
  color: string;
  intensity: number;
  glow?: string;
  dominant: 'white' | 'black';
  totalWeight: number;
  totalCount: number;
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
  totalCount: number;
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
        count: totalCount,
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
        { color: black.color, proportion: blackRatio / normalizer, label: `${black.count}` },
        { color: white.color, proportion: whiteRatio / normalizer, label: `${white.count}` },
      ],
      dividerColor,
      intensity,
      glow: glow
        ? {
            color: glow,
            strength: 0.5,
          }
        : undefined,
      orientation: 'vertical',
      label: `${white.count}:${black.count}`,
    },
    meta: {
      contested: contestedMeta,
      weight: totalWeight,
      count: totalCount,
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
  totalCount,
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
  totalCount: number;
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
  totalCount: number;
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
        { color: black.color, proportion: blackRatio / normalizer, label: `${black.count}` },
        { color: white.color, proportion: whiteRatio / normalizer, label: `${white.count}` },
      ],
      dividerColor,
      intensity,
      glow: glow
        ? {
            color: glow,
            strength: 0.45,
          }
        : undefined,
      orientation: 'vertical',
      label: `${white.count}:${black.count}`,
    },
    meta: {
      contested: contestedMeta,
      weight: totalWeight,
      count: totalCount,
      dominantColor:
        white.count === black.count ? 'tie' : white.count > black.count ? 'white' : 'black',
    },
  };
};
