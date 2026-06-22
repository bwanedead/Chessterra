import type { PieceColor } from '@/features/chessboard/types';
import type { ChessMove, FenString } from '../chess/types';
import type { MatchClockState } from '../time-control/types';

export type MatchEvent =
  | { type: 'MATCH_CREATED'; startingFen: FenString; positionId?: string }
  | { type: 'PLAYER_JOINED'; userId: string; slot: 'white' | 'black' }
  | { type: 'MATCH_STARTED'; at: string }
  | { type: 'MOVE_COMMITTED'; move: ChessMove; san: string; fen: FenString; mover: PieceColor; clock: MatchClockState }
  | { type: 'CLOCK_TICK'; clock: MatchClockState; flagColor: PieceColor | null }
  | { type: 'RESIGN'; color: PieceColor }
  | { type: 'ABORT' }
  | { type: 'DRAW_OFFERED'; color: PieceColor }
  | { type: 'DRAW_ACCEPTED' };

export interface MatchReducerContext {
  now: string;
  clockNow: number;
}
