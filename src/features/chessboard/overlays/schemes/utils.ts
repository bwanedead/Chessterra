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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const WHITE_SCALE = ['#5dd3f6', '#20b0f0', '#008be6', '#0063d1', '#003fa7'];
const BLACK_SCALE = ['#ffb3c1', '#ff708a', '#ff2e56', '#d9003a', '#a8002a'];

const levelIndex = (count: number) => {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  if (count === 4) return 3;
  return 4;
};

export const colorForCount = (color: 'white' | 'black', count: number) =>
  color === 'white' ? WHITE_SCALE[levelIndex(count)] : BLACK_SCALE[levelIndex(count)];

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3 ? sanitized.split('').map((c) => `${c}${c}`).join('') : sanitized;
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

export const lightenHex = (hex: string, amount: number) => {
  const base = hexToRgb(hex);
  const ratio = clamp(amount, 0, 1);
  const mix = (channel: number) => channel * (1 - ratio) + 255 * ratio;
  return rgbToHex(mix(base.r), mix(base.g), mix(base.b));
};

const INTENSITY_STEPS = [0, 0.65, 0.8, 0.9, 0.96, 1];

export const intensityFromCount = (count: number): number => {
  if (count <= 0) {
    return 0;
  }
  const index = Math.min(INTENSITY_STEPS.length - 1, count);
  return INTENSITY_STEPS[index];
};

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
