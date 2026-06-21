import type { MatchId, PositionId, UserId } from '@/platform/ids';
import type { PieceColor } from '@/features/chessboard/types';
import type { FenString, GameOutcome } from '../chess/types';
import type { MatchClockState } from '../time-control/types';
import type { MatchmakingPoolKey } from '../matchmaking/types';

export type MatchStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'aborted';

export type PlayerSlot = 'white' | 'black';

export interface MatchPlayer {
  userId: UserId | null;
  slot: PlayerSlot;
  color: PieceColor;
}

export interface MoveRecord {
  ply: number;
  san: string;
  from: string;
  to: string;
  fen: FenString;
  clockWhiteMs: number;
  clockBlackMs: number;
  createdAt: string;
}

export interface MatchSnapshot {
  id: MatchId;
  poolKey: MatchmakingPoolKey;
  status: MatchStatus;
  players: MatchPlayer[];
  startingFen: FenString;
  currentFen: FenString;
  positionId: PositionId | null;
  clock: MatchClockState;
  moves: MoveRecord[];
  outcome: GameOutcome;
  rated: boolean;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}
