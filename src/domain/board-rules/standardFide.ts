import { Chess } from 'chess.js';
import type { PieceColor, PromotionPieceType } from '@/features/chessboard/types';
import { createChessEngine } from '@/domain/play/chess/chessJsEngine';
import { graphFromFen, syncFenCodec, getFenFromSnapshot } from '@/domain/board-core/fenCodec';
import type { BoardGraph, BoardSnapshot, MoveIntent } from '@/domain/board-core/types';
import { registerRuleset } from './registry';
import type { RulesetConfig, RulesetDefinition } from './types';

const STANDARD_PIECES = ['p', 'n', 'b', 'r', 'q', 'k'] as const;

const pieceRules = Object.fromEntries(
  STANDARD_PIECES.map((kind) => [
    kind,
    {
      kind,
      label: kind.toUpperCase(),
      movementProfile: `standard-${kind}`,
    },
  ]),
);

const mapOutcome = (engine: ReturnType<typeof createChessEngine>) => {
  const outcome = engine.outcome();
  if (outcome.kind === 'ongoing') {
    return { kind: 'ongoing' as const };
  }
  if (outcome.kind === 'checkmate' && 'winner' in outcome) {
    return { kind: 'terminal' as const, winner: outcome.winner, reason: 'checkmate' };
  }
  if (outcome.kind === 'stalemate') {
    return { kind: 'terminal' as const, reason: 'stalemate' };
  }
  if (outcome.kind === 'draw') {
    return { kind: 'terminal' as const, reason: outcome.reason };
  }
  return { kind: 'terminal' as const, reason: outcome.kind };
};

const graphFromEngineFen = (fen: string): BoardGraph =>
  graphFromFen(fen, 'standard-fide').graph;

const isPromotionPiece = (value: string | undefined): value is PromotionPieceType =>
  value === 'q' || value === 'r' || value === 'b' || value === 'n';

export const standardFideRuleset: RulesetDefinition = {
  id: 'standard-fide',
  label: 'Standard FIDE Chess',
  topologyId: 'grid-8x8',
  turnOrder: ['w', 'b'],
  pieceRules,

  createInitial(config: RulesetConfig) {
    if (config.snapshot) {
      return this.normalizeSnapshot(config.snapshot);
    }
    const fen =
      config.fen ??
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return graphFromFen(fen, 'standard-fide');
  },

  normalizeSnapshot(snapshot: BoardSnapshot) {
    const fen =
      getFenFromSnapshot(snapshot) ??
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return syncFenCodec(graphFromFen(fen, snapshot.rulesetId));
  },

  getActivePlayer(graph: BoardGraph) {
    return (graph.meta.activeColor as PieceColor | undefined) ?? null;
  },

  legalMoves(graph: BoardGraph, fromNodeId?: string) {
    const fen = getFenFromSnapshot({ version: 1, rulesetId: 'standard-fide', graph });
    if (!fen) {
      return [];
    }
    const engine = createChessEngine(fen);
    return engine.legalMoves(fromNodeId ? { square: fromNodeId } : undefined).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
    }));
  },

  applyMove(graph: BoardGraph, intent: MoveIntent) {
    const fen = getFenFromSnapshot({ version: 1, rulesetId: 'standard-fide', graph });
    if (!fen) {
      return null;
    }
    const engine = createChessEngine(fen);
    const result = engine.move({
      from: intent.from,
      to: intent.to,
      promotion: isPromotionPiece(intent.promotion) ? intent.promotion : undefined,
    });
    if (!result) {
      return null;
    }
    const nextGraph = graphFromEngineFen(engine.fen());
    return {
      graph: nextGraph,
      applied: {
        intent,
        san: result.san,
      },
      outcome: mapOutcome(engine),
    };
  },

  applyNotation(graph: BoardGraph, notation: string) {
    const fen = getFenFromSnapshot({ version: 1, rulesetId: 'standard-fide', graph });
    if (!fen) {
      return null;
    }
    const game = new Chess(fen);
    try {
      const sanMove = game.move(notation);
      if (!sanMove) {
        return null;
      }
      const nextGraph = graphFromEngineFen(game.fen());
      const freshEngine = createChessEngine(game.fen());
      return {
        graph: nextGraph,
        applied: {
          intent: {
            from: sanMove.from,
            to: sanMove.to,
            promotion: isPromotionPiece(sanMove.promotion ?? undefined)
              ? sanMove.promotion
              : undefined,
          },
          san: sanMove.san,
        },
        outcome: mapOutcome(freshEngine),
      };
    } catch {
      return null;
    }
  },
};

registerRuleset(standardFideRuleset);
