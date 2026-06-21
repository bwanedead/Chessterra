import { applyPatches } from '@/domain/board-core/graph';
import { syncFenCodec } from '@/domain/board-core/fenCodec';
import type { ApplyResult, BoardSnapshot } from '@/domain/board-core/types';
import { getRuleset } from '@/domain/board-rules/registry';
import type {
  BoardSessionConfig,
  BoardSessionState,
  ProgressMessage,
  SessionListener,
} from './types';

export class BoardSession {
  private state: BoardSessionState;

  private listeners = new Set<SessionListener>();

  constructor(config: BoardSessionConfig) {
    const ruleset = getRuleset(config.rulesetId);
    if (!ruleset) {
      throw new Error(`Unknown ruleset: ${config.rulesetId}`);
    }

    const snapshot = config.snapshot
      ? ruleset.normalizeSnapshot(config.snapshot)
      : ruleset.createInitial!({ fen: config.fen, snapshot: config.snapshot });

    this.state = {
      rulesetId: config.rulesetId,
      snapshot,
      history: [],
      outcome: { kind: 'ongoing' },
      revision: 0,
    };
  }

  getState(): BoardSessionState {
    return this.state;
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  apply(message: ProgressMessage): ApplyResult {
    const ruleset = getRuleset(this.state.rulesetId);
    if (!ruleset) {
      return { ok: false, error: `Unknown ruleset: ${this.state.rulesetId}` };
    }

    if (this.state.outcome.kind === 'terminal' && message.type !== 'load') {
      return { ok: false, error: 'Game is already terminal' };
    }

    let nextSnapshot: BoardSnapshot | null = null;
    let appliedMove;
    let outcome = this.state.outcome;

    switch (message.type) {
      case 'load':
        nextSnapshot = ruleset.normalizeSnapshot(message.snapshot);
        outcome = { kind: 'ongoing' };
        break;

      case 'move': {
        const result = ruleset.applyMove(this.state.snapshot.graph, {
          from: message.from,
          to: message.to,
          promotion: message.promotion,
        });
        if (!result) {
          return { ok: false, error: 'Illegal move' };
        }
        nextSnapshot = syncFenCodec({
          ...this.state.snapshot,
          graph: result.graph,
        });
        appliedMove = result.applied;
        outcome = result.outcome;
        break;
      }

      case 'notation': {
        if (!ruleset.applyNotation) {
          return { ok: false, error: 'Notation not supported for this ruleset' };
        }
        const result = ruleset.applyNotation(this.state.snapshot.graph, message.value);
        if (!result) {
          return { ok: false, error: 'Illegal notation' };
        }
        nextSnapshot = syncFenCodec({
          ...this.state.snapshot,
          graph: result.graph,
        });
        appliedMove = result.applied;
        outcome = result.outcome;
        break;
      }

      case 'patch': {
        const graph = applyPatches(this.state.snapshot.graph, message.patches);
        nextSnapshot = syncFenCodec({
          ...this.state.snapshot,
          graph,
        });
        break;
      }

      case 'set-meta': {
        const graph = {
          ...this.state.snapshot.graph,
          meta: { ...this.state.snapshot.graph.meta, [message.key]: message.value },
        };
        nextSnapshot = syncFenCodec({
          ...this.state.snapshot,
          graph,
        });
        break;
      }

      default:
        return { ok: false, error: 'Unknown message type' };
    }

    if (!nextSnapshot) {
      return { ok: false, error: 'Failed to produce snapshot' };
    }

    const historyEntry = {
      index: this.state.history.length,
      message,
      applied: appliedMove,
      san: appliedMove?.san,
    };

    this.state = {
      ...this.state,
      snapshot: nextSnapshot,
      history: message.type === 'load' ? [] : [...this.state.history, historyEntry],
      outcome,
      revision: this.state.revision + 1,
    };

    this.emit();

    return {
      ok: true,
      snapshot: nextSnapshot,
      appliedMove,
      outcome,
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const createBoardSession = (config: BoardSessionConfig): BoardSession =>
  new BoardSession(config);
