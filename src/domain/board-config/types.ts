import type { BoardPatch } from '@/domain/board-core/types';

export const BOARD_VARIANT_CONFIG_VERSION = 1 as const;

/** Agent-emittable variant description — paste via `config apply` */
export interface BoardVariantConfig {
  version: typeof BOARD_VARIANT_CONFIG_VERSION;
  label?: string;
  description?: string;
  rulesetId?: string;
  themeId?: string;
  setup: BoardVariantSetup;
}

export interface BoardVariantSetup {
  fen?: string;
  meta?: Record<string, unknown>;
  pieces?: BoardVariantPiece[];
  nodeTags?: Record<string, string[]>;
  nodeAttrs?: Record<string, Record<string, unknown>>;
  patches?: BoardPatch[];
}

export interface BoardVariantPiece {
  square: string;
  owner: string;
  kind: string;
  attrs?: Record<string, unknown>;
}
