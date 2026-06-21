'use client';

import { BoardSessionView } from '@/features/board/components/BoardSessionView';
import type { LocalPlayConfig } from '@/domain/endgame/play';
import { getPoolEntry } from '@/domain/endgame/pool';
import type { PieceColor } from '@/features/chessboard/types';
import { useBotOpponent } from '../hooks/useBotOpponent';
import { useLocalPlaySession } from '../hooks/useLocalPlaySession';
import { GameClock } from './GameClock';
import { GameResultModal } from './GameResultModal';

export interface PlayShellProps {
  boardSize?: number;
  config?: Partial<LocalPlayConfig>;
}

const phaseLabel = (phase: string, isTerminal: boolean): string => {
  if (isTerminal) {
    return 'Game over';
  }
  if (phase === 'ready') {
    return 'Ready — make a move to start the clock';
  }
  return 'In progress';
};

const resultLabel = (
  endReason: string | null,
  winner: PieceColor | undefined,
  playerColor: PieceColor,
): string | null => {
  if (!endReason) {
    return null;
  }
  if (endReason === 'timeout') {
    const loser = winner === 'w' ? 'Black' : winner === 'b' ? 'White' : 'Side';
    return `${loser} lost on time`;
  }
  if (endReason === 'checkmate' && winner) {
    const winnerLabel = winner === playerColor ? 'You win' : 'You lose';
    return `${winnerLabel} — checkmate`;
  }
  return endReason.replace(/_/g, ' ');
};

/** Structural play layout — board, clocks, and status slots for Phase 0. */
export const PlayShell = ({ boardSize = 480, config }: PlayShellProps) => {
  const session = useLocalPlaySession({ config });
  useBotOpponent(session);
  const {
    config: playConfig,
    matchState,
    boardState,
    apply,
    handleBoardProgress,
    canPlayerMove,
    isTerminal,
    orientation,
    reset,
    resign,
  } = session;

  const playerColor = playConfig.playerColor;
  const opponentColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
  const poolEntry = playConfig.positionId ? getPoolEntry(playConfig.positionId) : null;
  const positionLabel =
    poolEntry?.note ??
    (poolEntry
      ? `${poolEntry.materialSignature} (${poolEntry.pieceCount} pieces)`
      : 'Curated endgame position');
  const matchWinner =
    matchState.outcome.kind === 'terminal' ? (matchState.outcome.winner as PieceColor | undefined) : undefined;

  const clockProps = {
    clock: matchState.clock,
    isTerminal,
    endReason: matchState.endReason,
    winner: matchWinner,
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4" data-testid="play-shell">
      <header className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Endgame — Phase 0</p>
        <h1 className="text-lg font-semibold text-slate-100">Local play</h1>
        <p className="text-sm text-slate-400">{positionLabel}</p>
        {poolEntry ? (
          <p className="font-mono text-xs text-slate-500">{poolEntry.id}</p>
        ) : null}
      </header>

      <GameClock
        label={opponentColor === 'w' ? 'White' : 'Black'}
        color={opponentColor}
        {...clockProps}
      />

      <div
        className="relative mx-auto aspect-square w-full max-w-[480px]"
        style={{ width: boardSize, height: boardSize }}
      >
        <BoardSessionView
          state={boardState}
          apply={apply}
          boardSize={boardSize}
          orientation={orientation}
          playerColor={canPlayerMove ? playerColor : null}
          themeId="endgame-slate"
          moveMode={canPlayerMove}
          onProgress={handleBoardProgress}
        />
      </div>

      <GameClock
        label={playerColor === 'w' ? 'White (you)' : 'Black (you)'}
        color={playerColor}
        isPlayer
        {...clockProps}
      />

      <footer className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>{phaseLabel(matchState.phase, isTerminal)}</span>
          <span className="font-mono text-xs text-slate-500">Moves: {matchState.moveCount}</span>
        </div>
        {!isTerminal && matchState.phase !== 'ready' ? (
          <button
            type="button"
            onClick={resign}
            className="mt-3 text-xs text-rose-400/90 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Resign
          </button>
        ) : null}
        {isTerminal && matchState.endReason ? (
          <p className="mt-2 text-xs capitalize text-amber-300/90">
            {resultLabel(matchState.endReason, matchWinner, playerColor)}
          </p>
        ) : null}
      </footer>

      <GameResultModal
        open={isTerminal}
        endReason={matchState.endReason}
        winner={matchWinner}
        playerColor={playerColor}
        moveCount={matchState.moveCount}
        onRematch={reset}
      />
    </div>
  );
};
