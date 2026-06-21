'use client';

import { useEffect } from 'react';
import type { MatchSnapshot } from '@/domain/play/match/types';
import { createSupabaseBrowserClient } from '@/platform/supabase/client';
import { isSupabaseConfigured } from '@/platform/supabase/env';

interface MatchRealtimeRow {
  snapshot: MatchSnapshot;
}

/**
 * Subscribes to Supabase Realtime updates for a match row.
 * Falls back silently when Supabase is not configured.
 */
export const useMatchRealtime = (
  matchId: string,
  onUpdate: (snapshot: MatchSnapshot) => void,
  enabled = true,
): void => {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      return undefined;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
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
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, matchId, onUpdate]);
};
