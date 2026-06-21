import type { GameModeId } from '@/platform/ids';

export type RulesetId = 'standard-fide';

export type PositionProviderKind =
  | 'curated-pool'
  | 'fixed-fen'
  | 'draft-pool'
  | 'standard-start';

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  category: 'endgame' | 'standard' | 'variant';
  ruleset: RulesetId;
  positionProvider: PositionProviderKind;
  /** Time control IDs this mode can be played with */
  supportedTimeControlIds: string[];
  /** Prefix for rating bucket keys, e.g. `endgame-standard` */
  ratingNamespace: string;
  /** Whether rated play is supported */
  rated: boolean;
  /** Sort order in UI */
  order: number;
}
