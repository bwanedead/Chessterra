'use client';

import { useEffect } from 'react';
import type { MatchSnapshot } from '@/domain/play/match/types';
import { createSupabaseBrowserClient } from '@/platform/supabase/client';
import { isSupabaseConfigured } from '@/platform/supabase/env';

interface MatchRealtimeRow {
  snapshot: MatchSnapshot;
}

/** Health of the realtime channel as seen by the client. */
export type MatchRealtimeStatus = 'idle' | 'connected' | 'reconnecting';

/**
 * Subscribes to Supabase Realtime updates for a match row.
 * Falls back silently when Supabase is not configured.
 * Reports channel health via onStatusChange so callers can
 * enable polling fallback and resync after reconnects.
 */
export const useMatchRealtime = (
  matchId: string,
  onUpdate: (snapshot: MatchSnapshot) => void,
  enabled = true,
  onStatusChange?: (status: MatchRealtimeStatus) => void,
): void => {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      onStatusChange?.('idle');
      return undefined;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      onStatusChange?.('idle');
      return undefined;
    }

    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MatchRealtimeRow | null;
          if (row?.snapshot) {
            onUpdate(row.snapshot);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onStatusChange?.('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          onStatusChange?.('reconnecting');
        }
      });

    return () => {
      onStatusChange?.('idle');
      void supabase.removeChannel(channel);
    };
  }, [enabled, matchId, onStatusChange, onUpdate]);
};
