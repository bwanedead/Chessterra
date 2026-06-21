import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchRepository } from './types';

interface MatchRow {
  id: string;
  pool_key: MatchSnapshot['poolKey'];
  status: MatchSnapshot['status'];
  snapshot: MatchSnapshot;
  rated: boolean;
}

const parseSnapshot = (row: Pick<MatchRow, 'snapshot'>): MatchSnapshot => row.snapshot;

export const createSupabaseMatchRepository = (supabase: SupabaseClient): MatchRepository => ({
  async get(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select('snapshot')
      .eq('id', matchId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return parseSnapshot(data as Pick<MatchRow, 'snapshot'>);
  },

  async save(snapshot) {
    const { error } = await supabase.from('matches').upsert(
      {
        id: snapshot.id,
        pool_key: snapshot.poolKey,
        status: snapshot.status,
        snapshot,
        rated: snapshot.rated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      throw new Error(`Failed to save match: ${error.message}`);
    }

    await supabase.from('match_events').insert({
      match_id: snapshot.id,
      event_type: `status:${snapshot.status}`,
      payload: {
        status: snapshot.status,
        ply: snapshot.moves.length,
        outcome: snapshot.outcome,
      },
    });
  },

  async appendEvent(matchId, eventType, payload) {
    const { error } = await supabase.from('match_events').insert({
      match_id: matchId,
      event_type: eventType,
      payload,
    });

    if (error) {
      throw new Error(`Failed to append match event: ${error.message}`);
    }
  },
});
