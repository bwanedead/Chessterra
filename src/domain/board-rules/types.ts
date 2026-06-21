import type {
  AppliedMove,
  BoardGraph,
  BoardSnapshot,
  LegalMove,
  MoveIntent,
  PieceKind,
  PlayerId,
  RuleOutcome,
  RulesetId,
} from '@/domain/board-core/types';

export interface PieceRuleDefinition {
  kind: PieceKind;
  label: string;
  /** Movement profile id for custom generators (future) */
  movementProfile?: string;
  attrs?: Record<string, unknown>;
}

export interface RulesetDefinition {
  id: RulesetId;
  label: string;
  topologyId: string;
  turnOrder: PlayerId[];
  pieceRules: Record<PieceKind, PieceRuleDefinition>;
  /** Create initial snapshot from config payload */
  createInitial?(config: RulesetConfig): BoardSnapshot;
  /** Load snapshot — validate + normalize */
  normalizeSnapshot(snapshot: BoardSnapshot): BoardSnapshot;
  getActivePlayer(graph: BoardGraph): PlayerId | null;
  legalMoves(graph: BoardGraph, fromNodeId?: string): LegalMove[];
  applyMove(graph: BoardGraph, intent: MoveIntent): {
    graph: BoardGraph;
    applied: AppliedMove;
    outcome: RuleOutcome;
  } | null;
  applyNotation?(graph: BoardGraph, notation: string): {
    graph: BoardGraph;
    applied: AppliedMove;
    outcome: RuleOutcome;
  } | null;
}

export interface RulesetConfig {
  fen?: string;
  snapshot?: BoardSnapshot;
  custom?: Record<string, unknown>;
}

export interface RulesetCodec {
  id: string;
  encode(snapshot: BoardSnapshot): string | null;
  decode(payload: string, rulesetId: RulesetId): BoardSnapshot | null;
}
