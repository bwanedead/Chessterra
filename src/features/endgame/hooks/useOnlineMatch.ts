'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchSnapshot } from '@/domain/play/match/types';
import { findPlayerByUserId } from '@/domain/play/match/factory';
import type { PieceColor } from '@/features/chessboard/types';
import { asUserId } from '@/platform/ids';
import { isSupabaseConfigured } from '@/platform/supabase/env';
import { fetchMatch, joinMatch, postMatchMove, postMatchResign } from '../api/matchApi';
import { describeMatchError, isVersionConflict } from '../lib/matchErrorMessages';
import { useMatchRealtime, type MatchRealtimeStatus } from './useMatchRealtime';

const POLL_MS = 1500;

/** How the client is currently kept in sync with server truth. */
export type MatchConnectionMode = 'realtime' | 'polling' | 'reconnecting';

export interface UseOnlineMatchOptions {
  matchId: string;
  playerId: string | null;
  autoJoin?: boolean;
}

export const useOnlineMatch = ({ matchId, playerId, autoJoin = true }: UseOnlineMatchOptions) => {
  const [match, setMatch] = useState<MatchSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<MatchRealtimeStatus>('idle');
  const previousRealtimeStatus = useRef<MatchRealtimeStatus>('idle');

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMatch(matchId, playerId);
      setMatch(next);
      setError(null);
    } catch (refreshError) {
      setError(describeMatchError(refreshError, 'Failed to refresh match'));
    } finally {
      setLoading(false);
    }
  }, [matchId, playerId]);

  const handleRealtimeUpdate = useCallback((snapshot: MatchSnapshot) => {
    setMatch(snapshot);
    setError(null);
    setLoading(false);
  }, []);

  const handleRealtimeStatus = useCallback(
    (status: MatchRealtimeStatus) => {
      // Updates can be missed while the channel is down; resync on recovery.
      if (status === 'connected' && previousRealtimeStatus.current === 'reconnecting') {
        void refresh();
      }
      previousRealtimeStatus.current = status;
      setRealtimeStatus(status);
    },
    [refresh],
  );

  const realtimeEnabled =
    isSupabaseConfigured() && Boolean(playerId && !playerId.startsWith('guest-'));

  useMatchRealtime(matchId, handleRealtimeUpdate, realtimeEnabled, handleRealtimeStatus);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Resync when the tab regains focus or the browser comes back online.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    const handleOnline = () => void refresh();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [refresh]);

  useEffect(() => {
    if (!autoJoin || !playerId || !match || joinAttempted) {
      return;
    }

    const self = playerId ? findPlayerByUserId(match, asUserId(playerId)) : null;
    if (self || match.status !== 'pending') {
      return;
    }

    setJoinAttempted(true);
    void joinMatch(matchId, playerId)
      .then(setMatch)
      .catch((joinError) => {
        setError(describeMatchError(joinError, 'Failed to join match'));
      });
  }, [autoJoin, joinAttempted, match, matchId, playerId]);

  // Poll whenever realtime is unavailable (guests, Supabase unset) or unhealthy.
  const usePolling = !realtimeEnabled || realtimeStatus !== 'connected';

  useEffect(() => {
    if (!match || match.status === 'completed' || match.status === 'aborted') {
      return undefined;
    }

    if (!usePolling) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [match, refresh, usePolling]);

  const connectionMode: MatchConnectionMode = !realtimeEnabled
    ? 'polling'
    : realtimeStatus === 'connected'
      ? 'realtime'
      : 'reconnecting';

  const player = useMemo(() => {
    if (!match || !playerId) {
      return null;
    }
    return findPlayerByUserId(match, asUserId(playerId));
  }, [match, playerId]);

  const activeColor: PieceColor = match?.currentFen.split(' ')[1] === 'b' ? 'b' : 'w';
  const isTerminal = match?.status === 'completed' || match?.status === 'aborted';
  const canMove = Boolean(
    player && match?.status === 'active' && !isTerminal && player.color === activeColor,
  );

  const commitMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      if (!playerId) {
        return false;
      }
      try {
        const next = await postMatchMove(matchId, playerId, { from, to, promotion });
        setMatch(next);
        setError(null);
        return true;
      } catch (moveError) {
        // Stale snapshot: pull latest board so the player can retry immediately.
        if (isVersionConflict(moveError)) {
          void refresh();
        }
        setError(describeMatchError(moveError, 'Move failed'));
        return false;
      }
    },
    [matchId, playerId, refresh],
  );

  const resign = useCallback(async () => {
    if (!playerId) {
      return;
    }
    try {
      const next = await postMatchResign(matchId, playerId);
      setMatch(next);
      setError(null);
    } catch (resignError) {
      if (isVersionConflict(resignError)) {
        void refresh();
      }
      setError(describeMatchError(resignError, 'Resign failed'));
    }
  }, [matchId, playerId, refresh]);

  const clearError = useCallback(() => setError(null), []);

  return {
    match,
    player,
    loading,
    error,
    canMove,
    activeColor,
    isTerminal,
    connectionMode,
    refresh,
    commitMove,
    resign,
    clearError,
  };
};
