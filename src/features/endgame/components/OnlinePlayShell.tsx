'use client';

import { useEffect } from 'react';
import '@/domain/board-rules';
import { graphFromFen } from '@/domain/board-core/fenCodec';
import { BoardSessionView } from '@/features/board/components/BoardSessionView';
import { useBoardSession } from '@/features/board/hooks/useBoardSession';
import { GameClock } from './GameClock';
import { GameResultModal } from './GameResultModal';
import { useOnlineMatch } from '../hooks/useOnlineMatch';

export interface OnlinePlayShellProps {
  matchId: string;
  playerId: string | null;
  boardSize?: number;
}

const CONNECTION_BADGE: Record<string, { label: string; className: string }> = {
  realtime: { label: 'Live', className: 'bg-emerald-500/10 text-emerald-400' },
  polling: { label: 'Syncing', className: 'bg-sky-500/10 text-sky-400' },
  reconnecting: { label: 'Reconnecting…', className: 'bg-amber-500/10 text-amber-400' },
};

export const OnlinePlayShell = ({ matchId, playerId, boardSize = 480 }: OnlinePlayShellProps) => {
  const online = useOnlineMatch({ matchId, playerId });
  const {
    match,
    player,
    loading,
    error,
    canMove,
    isTerminal,
    connectionMode,
    refresh,
    commitMove,
    resign,
    clearError,
  } = online;

  const startingFen = match?.currentFen ?? '8/8/8/8/8/8/8/8 w - - 0 1';
  const { state, apply } = useBoardSession({
    rulesetId: 'standard-fide',
    fen: startingFen,
  });

  useEffect(() => {
    if (!match?.currentFen) {
      return;
    }
    apply({
      type: 'load',
      snapshot: graphFromFen(match.currentFen, 'standard-fide'),
    });
  }, [apply, match?.currentFen, match?.moves.length]);

  if (loading && !match) {
    return <p className="text-center text-slate-400">Loading match…</p>;
  }

  if (!match) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 text-center">
        <p className="text-rose-400">{error ?? 'Match not found'}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const badge = CONNECTION_BADGE[connectionMode] ?? CONNECTION_BADGE.polling;

  const orientation = player?.color === 'b' ? 'black' : 'white';
  const playerColor = player?.color ?? 'w';
  const opponentColor = playerColor === 'w' ? 'b' : 'w';
  const matchWinner =
    match.outcome.kind !== 'ongoing' && 'winner' in match.outcome
      ? match.outcome.winner
      : undefined;

  const handleProgress = async (payload: {
    message: { type: string; from?: string; to?: string; promotion?: string };
  }) => {
    if (payload.message.type !== 'move' || !payload.message.from || !payload.message.to) {
      return;
    }
    const okMove = await commitMove(
      payload.message.from,
      payload.message.to,
      payload.message.promotion,
    );
    if (!okMove && match) {
      apply({
        type: 'load',
        snapshot: graphFromFen(match.currentFen, 'standard-fide'),
      });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4" data-testid="online-play-shell">
      <header className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Online match</p>
        <h1 className="text-lg font-semibold text-slate-100">
          {match.status === 'pending' ? 'Waiting for opponent…' : 'Endgame duel'}
        </h1>
        <p className="font-mono text-xs text-slate-500 break-all">{match.id}</p>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
          data-testid="connection-badge"
        >
          {badge.label}
        </span>
      </header>

      {error ? (
        <div
          className="flex items-start justify-between gap-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
            className="shrink-0 text-rose-400/70 hover:text-rose-200"
          >
            ×
          </button>
        </div>
      ) : null}

      <GameClock label={opponentColor === 'w' ? 'White' : 'Black'} color={opponentColor} clock={match.clock} />

      <div className="relative mx-auto aspect-square" style={{ width: boardSize, height: boardSize }}>
        <BoardSessionView
          state={state}
          apply={apply}
          boardSize={boardSize}
          orientation={orientation}
          playerColor={canMove ? playerColor : null}
          themeId="endgame-slate"
          moveMode={canMove}
          onProgress={handleProgress}
        />
      </div>

      <GameClock
        label={player ? `${playerColor === 'w' ? 'White' : 'Black'} (you)` : 'You'}
        color={playerColor}
        clock={match.clock}
        isPlayer
        isTerminal={isTerminal}
      />

      <footer className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="capitalize">{match.status}</span>
          <span className="font-mono text-xs text-slate-500">Moves: {match.moves.length}</span>
        </div>
        {match.status === 'active' ? (
          <button
            type="button"
            onClick={() => void resign()}
            className="mt-3 text-xs text-rose-400/90 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Resign
          </button>
        ) : null}
      </footer>

      <GameResultModal
        open={isTerminal}
        endReason={
          match.outcome.kind === 'checkmate'
            ? 'checkmate'
            : match.outcome.kind === 'stalemate'
              ? 'stalemate'
              : match.outcome.kind === 'timeout'
                ? 'timeout'
                : match.outcome.kind === 'resignation'
                  ? 'resignation'
                  : match.outcome.kind === 'draw'
                    ? 'draw'
                    : match.outcome.kind === 'aborted'
                      ? 'aborted'
                      : null
        }
        winner={matchWinner}
        playerColor={playerColor}
        moveCount={match.moves.length}
        onRematch={() => window.location.assign('/play')}
      />
    </div>
  );
};
