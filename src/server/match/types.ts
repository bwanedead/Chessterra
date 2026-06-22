import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchEvent } from '@/domain/play/match/events';

export interface MatchRecord {
  snapshot: MatchSnapshot;
  version: number;
}

export type SaveMatchResult =
  | { ok: true; version: number }
  | { ok: false; reason: 'not_found' | 'version_conflict' };

export interface MatchRepository {
  get(matchId: string): Promise<MatchRecord | null>;
  commit(snapshot: MatchSnapshot, expectedVersion: number, events: MatchEvent[]): Promise<SaveMatchResult>;
}
