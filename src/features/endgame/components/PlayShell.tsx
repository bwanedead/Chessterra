'use client';

import { BoardSessionView } from '@/features/board/components/BoardSessionView';
import type { LocalPlayConfig } from '@/domain/endgame/play';
import { DEV_POSITION_LABEL } from '@/domain/endgame/devPosition';
import { useLocalPlaySession } from '../hooks/useLocalPlaySession';
import { PlayClockSlot } from './PlayClockSlot';

export interface PlayShellProps {
  boardSize?: number;
  config?: Partial<LocalPlayConfig>;
}

const phaseLabel = (phase: string, isTerminal: boolean): string => {
  if (isTerminal) {
    return 'Game over';
  }
  if (phase === 'ready') {
    return 'Ready — make a move to start';
  }
  return 'In progress';
};

/** Structural play layout — board, clocks, and status slots for Phase 0. */
export const PlayShell = ({ boardSize = 480, config }: PlayShellProps) => {
  const session = useLocalPlaySession({ config });
  const { matchState, boardState, apply, handleBoardProgress, canPlayerMove, isTerminal, orientation } =
    session;

  const playerColor = session.config.playerColor;
  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4" data-testid="play-shell">
      <header className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Endgame — Phase 0</p>
        <h1 className="text-lg font-semibold text-slate-100">Local play</h1>
        <p className="text-sm text-slate-400">{DEV_POSITION_LABEL}</p>
      </header>

      <PlayClockSlot
        label={opponentColor === 'w' ? 'White' : 'Black'}
        color={opponentColor}
        clock={matchState.clock}
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

      <PlayClockSlot
        label={playerColor === 'w' ? 'White (you)' : 'Black (you)'}
        color={playerColor}
        clock={matchState.clock}
        isPlayer
      />

      <footer className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>{phaseLabel(matchState.phase, isTerminal)}</span>
          <span className="font-mono text-xs text-slate-500">Moves: {matchState.moveCount}</span>
        </div>
        {isTerminal && matchState.endReason ? (
          <p className="mt-2 text-xs text-amber-300/90 capitalize">
            Result: {matchState.endReason.replace('_', ' ')}
          </p>
        ) : null}
      </footer>
    </div>
  );
};
