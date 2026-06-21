import type { AppliedMove, BoardPatch, BoardSnapshot, RuleOutcome } from '@/domain/board-core/types';

/** Minimal progression messages — network-friendly, append-only friendly */
export type ProgressMessage =
  | { type: 'load'; snapshot: BoardSnapshot }
  | { type: 'move'; from: string; to: string; promotion?: string }
  | { type: 'notation'; value: string; codec?: 'san' | 'uci' }
  | { type: 'patch'; patches: BoardPatch[] }
  | { type: 'set-meta'; key: string; value: unknown };

export interface SessionMoveRecord {
  index: number;
  message: ProgressMessage;
  applied?: AppliedMove;
  san?: string;
}

export interface BoardSessionState {
  rulesetId: string;
  snapshot: BoardSnapshot;
  history: SessionMoveRecord[];
  outcome: RuleOutcome;
  revision: number;
}

export type SessionListener = (state: BoardSessionState) => void;

export interface BoardSessionConfig {
  rulesetId: string;
  fen?: string;
  snapshot?: BoardSnapshot;
}
