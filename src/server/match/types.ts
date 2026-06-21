import type { MatchSnapshot } from '@/domain/play/match/types';

export interface MatchRepository {
  get(matchId: string): Promise<MatchSnapshot | null>;
  save(snapshot: MatchSnapshot): Promise<void>;
  appendEvent?(matchId: string, eventType: string, payload: unknown): Promise<void>;
}
