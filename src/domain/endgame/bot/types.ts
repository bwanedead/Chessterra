import type { PieceColor } from '@/features/chessboard/types';

export interface BotMove {
  from: string;
  to: string;
  promotion?: string;
}

/** Pluggable bot adapter — swap random-legal for Stockfish WASM in a later slice. */
export interface BotAdapter {
  id: string;
  label: string;
  pickMove(fen: string, color: PieceColor): BotMove | null;
}
