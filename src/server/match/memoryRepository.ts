import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchRepository } from './types';

const store = new Map<string, MatchSnapshot>();

export const memoryMatchRepository: MatchRepository = {
  async get(matchId) {
    return store.get(matchId) ?? null;
  },
  async save(snapshot) {
    store.set(snapshot.id, snapshot);
  },
};

export const clearMemoryMatchStore = (): void => {
  store.clear();
};
