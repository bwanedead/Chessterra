import type {
  InfluenceSummary,
  SquareInfluenceSummary,
  CanvasInfluenceSummary,
  HeatmapTraceMode,
} from '@/features/chessboard/overlays/types';
import type { ResolvedHeatmapColorProfile } from '@/features/chessboard/overlays/colors/types';

export type HeatmapSchemeId = 'neutral-cancel' | 'contested-mixed' | 'contested-flag';

export interface HeatmapSchemeMetadata {
  id: HeatmapSchemeId;
  label: string;
  description?: string;
  supportedSubSchemes: HeatmapTraceMode[];
  tags?: string[];
}

export interface LegendSwatch {
  label: string;
  color: string;
  variant?: 'solid' | 'segmented' | 'flag';
}

export interface HeatmapSchemeLegend {
  title: string;
  swatches: LegendSwatch[];
  notes?: string;
}

export type OverlayGlow =
  | {
      color: string;
      strength?: number;
    }
  | undefined;

export interface SolidOverlayStyle {
  kind: 'solid';
  color: string;
  intensity: number;
  glow?: OverlayGlow;
  label?: string;
}

export interface SegmentedOverlayStyle {
  kind: 'segmented';
  segments: Array<{ color: string; proportion: number; label?: string }>;
  dividerColor?: string;
  intensity: number;
  glow?: OverlayGlow;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export interface FlagOverlayStyle {
  kind: 'flag';
  color: string;
  intensity: number;
  glow?: OverlayGlow;
  label?: string;
}

export type SquareOverlayStyle = SolidOverlayStyle | SegmentedOverlayStyle | FlagOverlayStyle;

export interface SquareOverlayDescriptor {
  style: SquareOverlayStyle;
  meta?: {
    contested?: {
      totalContributors: number;
      whiteContributors: number;
      blackContributors: number;
    };
    dominantColor?: 'white' | 'black' | 'tie';
    weight?: number;
    count?: number;
  };
}

export interface CanvasOverlayDescriptor {
  id: string;
  fileIndex: number;
  rankIndex: number;
  style: SquareOverlayStyle;
  meta?: SquareOverlayDescriptor['meta'];
}

export interface HeatmapSchemeRenderResult {
  squares: Record<string, SquareOverlayDescriptor>;
  canvas: CanvasOverlayDescriptor[];
  legend?: HeatmapSchemeLegend;
}

export interface HeatmapSchemeRenderContext {
  summary: InfluenceSummary;
  subScheme: HeatmapTraceMode;
  includeBothSides: boolean;
  colorProfile: ResolvedHeatmapColorProfile;
}

export interface HeatmapSchemeDefinition extends HeatmapSchemeMetadata {
  render: (context: HeatmapSchemeRenderContext) => HeatmapSchemeRenderResult;
}

export interface InfluenceAnalysis {
  square: SquareInfluenceSummary;
  whiteWeight: number;
  blackWeight: number;
  whiteCount: number;
  blackCount: number;
  totalWeight: number;
  totalCount: number;
  dominant: 'white' | 'black' | 'tie';
}

export interface CanvasInfluenceAnalysis {
  square: CanvasInfluenceSummary;
  whiteWeight: number;
  blackWeight: number;
  whiteCount: number;
  blackCount: number;
  totalWeight: number;
  totalCount: number;
  dominant: 'white' | 'black' | 'tie';
}
