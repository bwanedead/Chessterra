import type { LocalMatchEndReason } from '@/domain/endgame/play';
import type { PieceColor } from '@/features/chessboard/types';

export interface PlayResultCopy {
  headline: string;
  detail: string;
}

export const buildPlayResultCopy = (
  endReason: LocalMatchEndReason,
  winner: PieceColor | undefined,
  playerColor: PieceColor,
): PlayResultCopy => {
  if (!endReason) {
    return { headline: 'Game over', detail: '' };
  }

  const playerWon = winner === playerColor;
  const playerLost = winner !== undefined && winner !== playerColor;

  switch (endReason) {
    case 'checkmate':
      return {
        headline: playerWon ? 'Victory' : playerLost ? 'Defeat' : 'Checkmate',
        detail: playerWon ? 'You delivered checkmate.' : playerLost ? 'You were checkmated.' : 'Checkmate.',
      };
    case 'stalemate':
      return { headline: 'Draw', detail: 'Stalemate.' };
    case 'draw':
      return { headline: 'Draw', detail: 'The game ended in a draw.' };
    case 'timeout':
      return {
        headline: playerWon ? 'Victory on time' : playerLost ? 'Lost on time' : 'Time out',
        detail: playerWon ? 'Your opponent ran out of time.' : playerLost ? 'You ran out of time.' : 'Flag fall.',
      };
    case 'resignation':
      return {
        headline: playerWon ? 'Victory' : 'Defeat',
        detail: playerWon ? 'Your opponent resigned.' : 'You resigned.',
      };
    case 'aborted':
      return { headline: 'Game aborted', detail: 'The game was aborted.' };
    default:
      return { headline: 'Game over', detail: endReason };
  }
};
