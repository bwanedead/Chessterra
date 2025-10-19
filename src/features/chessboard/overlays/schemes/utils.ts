import type {
  InfluenceAnalysis,
  CanvasInfluenceAnalysis,
} from '@/features/chessboard/overlays/schemes/types';
import type {
  SquareInfluenceSummary,
  CanvasInfluenceSummary,
  InfluenceContribution,
} from '@/features/chessboard/overlays/types';
import type { ResolvedHeatmapColorProfile } from '@/features/chessboard/overlays/colors/types';

const colorKey = (color: InfluenceContribution['piece']['color']): 'white' | 'black' =>
  color === 'w' ? 'white' : 'black';

export const analyzeSquareInfluence = (square: SquareInfluenceSummary): InfluenceAnalysis => {
  const whiteWeight = square.white.totalWeight;
  const blackWeight = square.black.totalWeight;
  const whiteCount = square.white.contributions.length;
  const blackCount = square.black.contributions.length;
  const totalWeight = whiteWeight + blackWeight;
  const totalCount = whiteCount + blackCount;

  let dominant: 'white' | 'black' | 'tie' = 'tie';
  if (whiteWeight > blackWeight) {
    dominant = 'white';
  } else if (blackWeight > whiteWeight) {
    dominant = 'black';
  }

  return {
    square,
    whiteWeight,
    blackWeight,
    whiteCount,
    blackCount,
    totalWeight,
    totalCount,
    dominant,
  };
};

export const analyzeCanvasInfluence = (square: CanvasInfluenceSummary): CanvasInfluenceAnalysis => {
  const whiteWeight = square.white.totalWeight;
  const blackWeight = square.black.totalWeight;
  const whiteCount = square.white.contributions.length;
  const blackCount = square.black.contributions.length;
  const totalWeight = whiteWeight + blackWeight;
  const totalCount = whiteCount + blackCount;

  let dominant: 'white' | 'black' | 'tie' = 'tie';
  if (whiteWeight > blackWeight) {
    dominant = 'white';
  } else if (blackWeight > whiteWeight) {
    dominant = 'black';
  }

  return {
    square,
    whiteWeight,
    blackWeight,
    whiteCount,
    blackCount,
    totalWeight,
    totalCount,
    dominant,
  };
};

export const resolvePieceColor = (
  contributions: InfluenceContribution[],
  profile: ResolvedHeatmapColorProfile,
  color: InfluenceContribution['piece']['color'],
): { primary: string; accent: string | undefined; pieceType: InfluenceContribution['piece']['type'] | null } => {
  if (contributions.length === 0) {
    const fallback = profile.pieces[colorKey(color)].p;
    return { primary: fallback.primary, accent: fallback.accent, pieceType: 'p' };
  }

  const sorted = [...contributions].sort((a, b) => b.weight - a.weight);
  const choice = sorted[0];
  const palette = profile.pieces[colorKey(color)][choice.piece.type];
  return {
    primary: palette?.primary ?? profile.pieces[colorKey(color)].p.primary,
    accent: palette?.accent,
    pieceType: choice.piece.type,
  };
};

export const normalizeIntensity = (weight: number, maxWeight: number, floor = 0.35, ceiling = 1) => {
  if (maxWeight <= 0) {
    return 0;
  }

  const ratio = Math.max(0, Math.min(1, weight / maxWeight));
  const span = ceiling - floor;
  return floor + ratio * span;
};
