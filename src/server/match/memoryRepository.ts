import type { MatchEvent } from '@/domain/play/match/events';
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { MatchRepository, MatchRecord, SaveMatchResult } from './types';

interface MemoryEntry {
  snapshot: MatchSnapshot;
  version: number;
  events: MatchEvent[];
}

const store = new Map<string, MemoryEntry>();

export const memoryMatchRepository: MatchRepository = {
  async get(matchId) {
    const entry = store.get(matchId);
    if (!entry) {
      return null;
    }
    return { snapshot: entry.snapshot, version: entry.version };
  },

  async commit(snapshot, expectedVersion, events): Promise<SaveMatchResult> {
    const existing = store.get(snapshot.id);

    if (!existing) {
      if (expectedVersion !== 0) {
        return { ok: false, reason: 'not_found' };
      }
      store.set(snapshot.id, { snapshot, version: 1, events: [...events] });
      return { ok: true, version: 1 };
    }

    if (existing.version !== expectedVersion) {
      return { ok: false, reason: 'version_conflict' };
    }

    const nextVersion = expectedVersion + 1;
    store.set(snapshot.id, {
      snapshot,
      version: nextVersion,
      events: [...existing.events, ...events],
    });
    return { ok: true, version: nextVersion };
  },
};

export const clearMemoryMatchStore = (): void => {
  store.clear();
};

export const getMemoryMatchRecord = (matchId: string): MatchRecord | null => {
  const entry = store.get(matchId);
  if (!entry) {
    return null;
  }
  return { snapshot: entry.snapshot, version: entry.version };
};

export const getMemoryMatchEvents = (matchId: string): MatchEvent[] => {
  const entry = store.get(matchId);
  return entry ? [...entry.events] : [];
};
