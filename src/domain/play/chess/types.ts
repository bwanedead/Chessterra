import type { PieceColor, PieceType, PromotionPieceType } from '@/features/chessboard/types';

export type Square = string;
export type FenString = string;

export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: PromotionPieceType;
  san?: string;
  captured?: PieceType;
}

export type GameOutcome =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: PieceColor }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: DrawReason }
  | { kind: 'resignation'; winner: PieceColor }
  | { kind: 'timeout'; winner: PieceColor }
  | { kind: 'aborted' };

export type DrawReason =
  | 'fifty-move'
  | 'threefold'
  | 'insufficient-material'
  | 'agreement'
  | 'other';

export interface LegalMoveTarget {
  from: Square;
  to: Square;
  promotion?: PromotionPieceType;
  san: string;
}
