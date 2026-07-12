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

  async commit(snapshot, expectedVersion, events: MatchEvent[]): Promise<SaveMatchResult> {
    const { data, error } = await supabase
      .rpc('commit_match_update', {
        p_match_id: snapshot.id,
        p_expected_version: expectedVersion,
        p_pool_key: snapshot.poolKey,
        p_status: snapshot.status,
        p_snapshot: snapshot,
        p_rated: snapshot.rated,
        p_events: events,
      })
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to commit match: ${error.message}`);
    }

    const result = data as { ok: boolean; reason: string | null; version: number | null } | null;
    if (!result) {
      throw new Error('Failed to commit match: empty RPC result');
    }

    if (!result.ok) {
      if (result.reason === 'not_found' || result.reason === 'version_conflict') {
        return { ok: false, reason: result.reason };
      }
      throw new Error(`Failed to commit match: ${result.reason ?? 'unknown error'}`);
    }

    return { ok: true, version: result.version ?? expectedVersion + 1 };
  },

  async listCompletedForUser(userId, limit) {
    const { data, error } = await supabase
      .from('matches')
      .select('snapshot')
      .eq('status', 'completed')
      .contains('snapshot->players', JSON.stringify([{ userId }]))
      .order('snapshot->>endedAt', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return (data as Pick<MatchRow, 'snapshot'>[]).map((row) => row.snapshot);
  },
});
