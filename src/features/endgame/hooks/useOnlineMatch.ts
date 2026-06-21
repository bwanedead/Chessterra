'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MatchSnapshot } from '@/domain/play/match/types';
import { findPlayerByUserId } from '@/domain/play/match/factory';
import type { PieceColor } from '@/features/chessboard/types';
import { asUserId } from '@/platform/ids';
import { fetchMatch, joinMatch, postMatchMove, postMatchResign } from '../api/matchApi';

const POLL_MS = 1500;

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

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMatch(matchId);
      setMatch(next);
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void refresh();
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
        setError(joinError instanceof Error ? joinError.message : 'Failed to join match');
      });
  }, [autoJoin, joinAttempted, match, matchId, playerId]);

  useEffect(() => {
    if (!match || match.status === 'completed' || match.status === 'aborted') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [match, refresh]);

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
        setError(moveError instanceof Error ? moveError.message : 'Move failed');
        return false;
      }
    },
    [matchId, playerId],
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
      setError(resignError instanceof Error ? resignError.message : 'Resign failed');
    }
  }, [matchId, playerId]);

  return {
    match,
    player,
    loading,
    error,
    canMove,
    activeColor,
    isTerminal,
    refresh,
    commitMove,
    resign,
  };
};
