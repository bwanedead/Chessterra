import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearMemoryMatchStore, getMemoryMatchEvents, memoryMatchRepository } from './memoryRepository';
import { MatchService } from './matchService';
import type { MatchRepository } from './types';

const HOST_ID = 'user-host-11111111-1111-1111-1111-111111111111';
const JOINER_ID = 'user-join-22222222-2222-2222-2222-222222222222';
const OUTSIDER_ID = 'user-outsider-33333333-3333-3333-3333-333333333333';
const GUEST_ID = 'guest-abc123';

const createService = (repository: MatchRepository = memoryMatchRepository) =>
  new MatchService(repository);

const activeColor = (fen: string): 'w' | 'b' => (fen.split(' ')[1] === 'b' ? 'b' : 'w');

const playerForColor = (snapshot: { players: { userId: string | null; color: 'w' | 'b' }[] }, color: 'w' | 'b') => {
  const player = snapshot.players.find((entry) => entry.color === color);
  if (!player?.userId) {
    throw new Error(`No player for color ${color}`);
  }
  return player.userId;
};

const firstLegalMove = (fen: string): { from: string; to: string } => {
  const chess = new Chess(fen);
  const move = chess.moves({ verbose: true })[0];
  if (!move) {
    throw new Error(`No legal moves for FEN: ${fen}`);
  }
  return { from: move.from, to: move.to };
};

const setupActiveMatch = async (service: MatchService, rated = false) => {
  const created = await service.createInviteMatch({
    hostUserId: HOST_ID,
    hostIsGuest: false,
    rated,
  });
  if (!created.ok) {
    throw new Error(created.error.message);
  }

  const joined = await service.joinMatch(created.value.id, JOINER_ID, false);
  if (!joined.ok) {
    throw new Error(joined.error.message);
  }

  return joined.value;
};

describe('MatchService', () => {
  beforeEach(() => {
    clearMemoryMatchStore();
  });

  it('rejects rated invite creation for guests', async () => {
    const service = createService();
    const result = await service.createInviteMatch({
      hostUserId: GUEST_ID,
      hostIsGuest: true,
      rated: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('rated_requires_auth');
    }
  });

  it('rejects guest join on rated matches', async () => {
    const service = createService();
    const created = await service.createInviteMatch({
      hostUserId: HOST_ID,
      hostIsGuest: false,
      rated: true,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const joined = await service.joinMatch(created.value.id, GUEST_ID, true);
    expect(joined.ok).toBe(false);
    if (!joined.ok) {
      expect(joined.error.code).toBe('rated_requires_auth');
    }
  });

  it('prevents host from joining own invite as opponent', async () => {
    const service = createService();
    const created = await service.createInviteMatch({
      hostUserId: HOST_ID,
      hostIsGuest: false,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const joined = await service.joinMatch(created.value.id, HOST_ID, false);
    expect(joined.ok).toBe(false);
    if (!joined.ok) {
      expect(joined.error.code).toBe('forbidden');
    }
  });

  it('rejects moves and resign from non-participants', async () => {
    const service = createService();
    const snapshot = await setupActiveMatch(service);
    const move = firstLegalMove(snapshot.currentFen);
    const mover = playerForColor(snapshot, activeColor(snapshot.currentFen));

    const outsiderMove = await service.commitMove(snapshot.id, OUTSIDER_ID, move);
    expect(outsiderMove.ok).toBe(false);
    if (!outsiderMove.ok) {
      expect(outsiderMove.error.code).toBe('forbidden');
    }

    const outsiderResign = await service.resign(snapshot.id, OUTSIDER_ID);
    expect(outsiderResign.ok).toBe(false);
    if (!outsiderResign.ok) {
      expect(outsiderResign.error.code).toBe('forbidden');
    }

    expect(mover).toBeTruthy();
  });

  it('rejects wrong-turn moves', async () => {
    const service = createService();
    const snapshot = await setupActiveMatch(service);
    const turn = activeColor(snapshot.currentFen);
    const wrongColor = turn === 'w' ? 'b' : 'w';
    const wrongPlayer = playerForColor(snapshot, wrongColor);
    const move = firstLegalMove(snapshot.currentFen);

    const result = await service.commitMove(snapshot.id, wrongPlayer, move);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('illegal_state');
      expect(result.error.message).toContain('Not your turn');
    }
  });

  it('rejects illegal moves', async () => {
    const service = createService();
    const snapshot = await setupActiveMatch(service);
    const mover = playerForColor(snapshot, activeColor(snapshot.currentFen));

    const result = await service.commitMove(snapshot.id, mover, { from: 'a1', to: 'a8' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('illegal_state');
      expect(result.error.message).toContain('Illegal move');
    }
  });

  it('returns typed version_conflict when repository detects stale version', async () => {
    let staleRead = false;
    const staleRepository: MatchRepository = {
      async get(matchId) {
        const record = await memoryMatchRepository.get(matchId);
        if (!record) {
          return null;
        }
        if (staleRead) {
          return { snapshot: record.snapshot, version: Math.max(0, record.version - 1) };
        }
        return record;
      },
      async commit(snapshot, expectedVersion, events) {
        return memoryMatchRepository.commit(snapshot, expectedVersion, events);
      },
      async listCompletedForUser(userId, limit) {
        return memoryMatchRepository.listCompletedForUser(userId, limit);
      },
    };

    const service = createService(staleRepository);
    const snapshot = await setupActiveMatch(service);
    staleRead = true;

    const mover = playerForColor(snapshot, activeColor(snapshot.currentFen));
    const move = firstLegalMove(snapshot.currentFen);
    const result = await service.commitMove(snapshot.id, mover, move);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('version_conflict');
    }
  });

  it('emits MATCH_COMPLETED on resign', async () => {
    const service = createService();
    const snapshot = await setupActiveMatch(service);
    const resigner = playerForColor(snapshot, activeColor(snapshot.currentFen));

    const result = await service.resign(snapshot.id, resigner);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe('completed');
    const events = getMemoryMatchEvents(snapshot.id);
    expect(events.some((event) => event.type === 'MATCH_COMPLETED')).toBe(true);
  });

  it('emits RATING_UPDATED for rated completions', async () => {
    const service = createService();
    const snapshot = await setupActiveMatch(service, true);
    const resigner = playerForColor(snapshot, activeColor(snapshot.currentFen));

    const result = await service.resign(snapshot.id, resigner);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const events = getMemoryMatchEvents(snapshot.id);
    const ratingEvents = events.filter((event) => event.type === 'RATING_UPDATED');
    expect(ratingEvents).toHaveLength(2);
    expect(events.some((event) => event.type === 'MATCH_COMPLETED')).toBe(true);
  });

  it('lists completed matches only for participants, newest first', async () => {
    const service = createService();

    const first = await setupActiveMatch(service);
    const firstResign = await service.resign(first.id, playerForColor(first, activeColor(first.currentFen)));
    expect(firstResign.ok).toBe(true);

    // endedAt has millisecond precision; ensure distinct ordering timestamps.
    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = await setupActiveMatch(service);
    const secondResign = await service.resign(second.id, playerForColor(second, activeColor(second.currentFen)));
    expect(secondResign.ok).toBe(true);

    const hostHistory = await service.listMatchHistory(HOST_ID);
    expect(hostHistory).toHaveLength(2);
    expect(hostHistory.every((entry) => entry.result === 'win' || entry.result === 'loss' || entry.result === 'draw')).toBe(true);
    expect(hostHistory[0]?.matchId).toBe(second.id);
    expect(hostHistory[1]?.matchId).toBe(first.id);
    expect(hostHistory[0]?.opponentUserId).toBe(JOINER_ID);

    const outsiderHistory = await service.listMatchHistory(OUTSIDER_ID);
    expect(outsiderHistory).toHaveLength(0);
  });

  it('excludes pending and active matches from history', async () => {
    const service = createService();
    const created = await service.createInviteMatch({ hostUserId: HOST_ID, hostIsGuest: false });
    expect(created.ok).toBe(true);

    const active = await setupActiveMatch(service);
    expect(active.status).toBe('active');

    const history = await service.listMatchHistory(HOST_ID);
    expect(history).toHaveLength(0);
  });

  it('commits snapshot and audit events atomically through the repository', async () => {
    const service = createService();
    const created = await service.createInviteMatch({
      hostUserId: HOST_ID,
      hostIsGuest: false,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const createEvents = getMemoryMatchEvents(created.value.id);
    expect(createEvents).toHaveLength(1);
    expect(createEvents[0]?.type).toBe('MATCH_CREATED');

    const joined = await service.joinMatch(created.value.id, JOINER_ID, false);
    expect(joined.ok).toBe(true);
    if (!joined.ok) {
      return;
    }

    const allEvents = getMemoryMatchEvents(created.value.id);
    expect(allEvents.map((event) => event.type)).toEqual([
      'MATCH_CREATED',
      'PLAYER_JOINED',
      'MATCH_STARTED',
    ]);
    expect(joined.value.status).toBe('active');
  });
});
