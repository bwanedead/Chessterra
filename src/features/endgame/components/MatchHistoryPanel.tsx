'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MatchHistoryEntry, MatchResultForPlayer } from '@/domain/play/match/history';
import { fetchMatchHistory } from '../api/historyApi';
import { describeMatchError } from '../lib/matchErrorMessages';

const RESULT_STYLE: Record<MatchResultForPlayer, { label: string; className: string }> = {
  win: { label: 'Win', className: 'bg-emerald-500/10 text-emerald-400' },
  loss: { label: 'Loss', className: 'bg-rose-500/10 text-rose-400' },
  draw: { label: 'Draw', className: 'bg-slate-500/10 text-slate-300' },
  aborted: { label: 'Aborted', className: 'bg-slate-600/10 text-slate-500' },
};

const formatOpponent = (opponentUserId: string | null): string => {
  if (!opponentUserId) {
    return 'Unknown';
  }
  if (opponentUserId.startsWith('guest-')) {
    return 'Guest';
  }
  return `Player ${opponentUserId.slice(0, 8)}`;
};

const formatEndedAt = (endedAt: string | null): string => {
  if (!endedAt) {
    return '—';
  }
  const date = new Date(endedAt);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export interface MatchHistoryPanelProps {
  playerId: string | null;
}

export const MatchHistoryPanel = ({ playerId }: MatchHistoryPanelProps) => {
  const [entries, setEntries] = useState<MatchHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      return;
    }
    let cancelled = false;
    fetchMatchHistory(playerId)
      .then((matches) => {
        if (!cancelled) {
          setEntries(matches);
          setError(null);
        }
      })
      .catch((historyError) => {
        if (!cancelled) {
          setError(describeMatchError(historyError, 'Failed to load match history'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  if (!playerId) {
    return (
      <p className="text-center text-sm text-slate-400">
        Sign in (or play a game as guest) to see your match history.
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-rose-400">{error}</p>;
  }

  if (!entries) {
    return <p className="text-center text-sm text-slate-400">Loading history…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-3 text-center text-sm text-slate-400">
        <p>No completed games yet.</p>
        <Link
          href="/play"
          className="inline-block rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100"
        >
          Play your first game
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2" data-testid="match-history-list">
      {entries.map((entry) => {
        const result = RESULT_STYLE[entry.result];
        return (
          <li key={entry.matchId}>
            <Link
              href={`/match/${entry.matchId}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-slate-600"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${result.className}`}
                >
                  {result.label}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">
                    vs {formatOpponent(entry.opponentUserId)}
                    <span className="ml-2 text-xs text-slate-500">
                      as {entry.playerColor === 'w' ? 'White' : 'Black'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.outcomeKind} · {entry.moveCount} moves · {entry.timeControlId}
                    {entry.rated ? ' · rated' : ''}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{formatEndedAt(entry.endedAt)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
