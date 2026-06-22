import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchEvent } from '@/domain/play/match/events';
import type { MatchRepository, SaveMatchResult } from './types';

interface MatchRow {
  id: string;
  pool_key: MatchSnapshot['poolKey'];
  status: MatchSnapshot['status'];
  snapshot: MatchSnapshot;
  rated: boolean;
  version: number;
}

export const createSupabaseMatchRepository = (supabase: SupabaseClient): MatchRepository => ({
  async get(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select('snapshot, version')
      .eq('id', matchId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as Pick<MatchRow, 'snapshot' | 'version'>;
    return { snapshot: row.snapshot, version: row.version };
  },

  async save(snapshot, expectedVersion): Promise<SaveMatchResult> {
    if (expectedVersion === 0) {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          id: snapshot.id,
          pool_key: snapshot.poolKey,
          status: snapshot.status,
          snapshot,
          rated: snapshot.rated,
          version: 1,
          updated_at: new Date().toISOString(),
        })
        .select('version')
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          return { ok: false, reason: 'version_conflict' };
        }
        throw new Error(`Failed to create match: ${error.message}`);
      }

      return { ok: true, version: (data as { version: number }).version };
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        pool_key: snapshot.poolKey,
        status: snapshot.status,
        snapshot,
        rated: snapshot.rated,
        version: expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', snapshot.id)
      .eq('version', expectedVersion)
      .select('version')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to save match: ${error.message}`);
    }

    if (!data) {
      const existing = await supabase.from('matches').select('id').eq('id', snapshot.id).maybeSingle();
      if (!existing.data) {
        return { ok: false, reason: 'not_found' };
      }
      return { ok: false, reason: 'version_conflict' };
    }

    return { ok: true, version: (data as { version: number }).version };
  },

  async appendEvent(matchId, event: MatchEvent) {
    const { error } = await supabase.from('match_events').insert({
      match_id: matchId,
      event_type: event.type,
      payload: event,
    });

    if (error) {
      throw new Error(`Failed to append match event: ${error.message}`);
    }
  },
});
