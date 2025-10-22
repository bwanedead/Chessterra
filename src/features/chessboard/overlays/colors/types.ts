import type { ChessPieceDescriptor } from '@/features/chessboard/types';

export type HeatmapColorProfileId = 'classic' | 'muted' | 'contrast';

export type PieceType = ChessPieceDescriptor['type'];

export interface PieceColorConfig {
  /**
   * Primary fill colour used for overlays representing this piece.
   */
  primary: string;
  /**
   * Optional accent used for borders, glows, or legends.
   */
  accent?: string;
}

export interface ContestedColorConfig {
  /**
   * Divider colour for segmented contested overlays.
   */
  divider: string;
  /**
   * Highlight colour for contested-flag style overlays.
   */
  flag: string;
  /**
   * Optional glow tint for contested overlays.
   */
  glow?: string;
}

export interface CheckHighlightConfig {
  inCheck: string;
  checkmate: string;
  looming?: string;
}

export interface HeatmapColorProfileDefinition {
  id: HeatmapColorProfileId;
  label: string;
  description?: string;
  pieces: {
    white: Record<PieceType, PieceColorConfig>;
    black: Record<PieceType, PieceColorConfig>;
  };
  heatmap: {
    white: { base: string; target: string };
    black: { base: string; target: string };
  };
  contested: ContestedColorConfig;
  check: CheckHighlightConfig;
}

export interface HeatmapColorOverrides {
  pieces?: {
    white?: Partial<Record<PieceType, PieceColorConfig | string>>;
    black?: Partial<Record<PieceType, PieceColorConfig | string>>;
  };
  contested?: Partial<ContestedColorConfig>;
  check?: Partial<CheckHighlightConfig>;
}

export type ResolvedHeatmapColorProfile = HeatmapColorProfileDefinition;
