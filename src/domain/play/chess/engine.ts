import type { PieceColor } from '@/features/chessboard/types';
import type { ChessMove, FenString, GameOutcome, LegalMoveTarget } from './types';

/** Abstraction over chess rule engines — swap chess.js for server-native later. */
export interface ChessEngine {
  load(fen: FenString): void;
  fen(): FenString;
  turn(): PieceColor;
  move(move: ChessMove): LegalMoveTarget | null;
  legalMoves(options?: { square?: string }): LegalMoveTarget[];
  isCheck(): boolean;
  isGameOver(): boolean;
  outcome(): GameOutcome;
  clone(): ChessEngine;
}

export interface ChessEngineFactory {
  create(fen?: FenString): ChessEngine;
}
