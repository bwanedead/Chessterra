import { Chess, type Move, type Square as ChessJsSquare } from 'chess.js';
import type { PieceColor, PromotionPieceType } from '@/features/chessboard/types';
import type { ChessEngine, ChessEngineFactory } from './engine';
import type { ChessMove, FenString, GameOutcome, LegalMoveTarget } from './types';

const isPromotionPiece = (value: string | undefined): value is PromotionPieceType =>
  value === 'q' || value === 'r' || value === 'b' || value === 'n';

const toLegalMoveTarget = (move: Move): LegalMoveTarget => ({
  from: move.from,
  to: move.to,
  promotion: isPromotionPiece(move.promotion) ? move.promotion : undefined,
  san: move.san,
});

const mapOutcome = (game: Chess): GameOutcome => {
  if (!game.isGameOver()) {
    return { kind: 'ongoing' };
  }

  if (game.isCheckmate()) {
    const winner: PieceColor = game.turn() === 'w' ? 'b' : 'w';
    return { kind: 'checkmate', winner };
  }

  if (game.isStalemate()) {
    return { kind: 'stalemate' };
  }

  if (game.isDraw()) {
    return { kind: 'draw', reason: 'other' };
  }

  return { kind: 'draw', reason: 'other' };
};

class ChessJsEngine implements ChessEngine {
  private game: Chess;

  constructor(fen?: FenString) {
    this.game = fen ? new Chess(fen) : new Chess();
  }

  load(fen: FenString): void {
    this.game.load(fen);
  }

  fen(): FenString {
    return this.game.fen();
  }

  turn(): PieceColor {
    return this.game.turn();
  }

  move(move: ChessMove): LegalMoveTarget | null {
    try {
      const result = this.game.move({
        from: move.from as ChessJsSquare,
        to: move.to as ChessJsSquare,
        promotion: move.promotion,
      });
      return result ? toLegalMoveTarget(result) : null;
    } catch {
      return null;
    }
  }

  legalMoves(options?: { square?: string }): LegalMoveTarget[] {
    const moves = options?.square
      ? this.game.moves({ square: options.square as ChessJsSquare, verbose: true })
      : this.game.moves({ verbose: true });
    return moves.map(toLegalMoveTarget);
  }

  isCheck(): boolean {
    return this.game.isCheck();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  outcome(): GameOutcome {
    return mapOutcome(this.game);
  }

  clone(): ChessEngine {
    return new ChessJsEngine(this.game.fen());
  }
}

export const chessJsEngineFactory: ChessEngineFactory = {
  create: (fen?: FenString) => new ChessJsEngine(fen),
};

export const createChessEngine = (fen?: FenString): ChessEngine =>
  chessJsEngineFactory.create(fen);
