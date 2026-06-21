'use client';

import type { MatchClockState } from '@/domain/play/time-control/types';
import type { LocalMatchEndReason } from '@/domain/endgame/play';
import type { PieceColor } from '@/features/chessboard/types';
import { GameClock } from './GameClock';

export interface GameClockPairProps {
  clock: MatchClockState;
  playerColor: PieceColor;
  isTerminal?: boolean;
  endReason?: LocalMatchEndReason;
  winner?: PieceColor;
}

/** Standard vertical clock stack — opponent above board, player below. */
export const GameClockPair = ({
  clock,
  playerColor,
  isTerminal = false,
  endReason = null,
  winner,
}: GameClockPairProps) => {
  const opponentColor: PieceColor = playerColor === 'w' ? 'b' : 'w';

  return (
    <>
      <GameClock
        label={opponentColor === 'w' ? 'White' : 'Black'}
        color={opponentColor}
        clock={clock}
        isTerminal={isTerminal}
        endReason={endReason}
        winner={winner}
      />
      <GameClock
        label={playerColor === 'w' ? 'White (you)' : 'Black (you)'}
        color={playerColor}
        clock={clock}
        isPlayer
        isTerminal={isTerminal}
        endReason={endReason}
        winner={winner}
      />
    </>
  );
};
