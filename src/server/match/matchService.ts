import '@/domain/play/time-control';
import { pickPoolPositionForMatch } from '@/domain/endgame/pool';
import {
  applyMatchMove,
  applyMatchResign,
  createPendingMatch,
  findPlayerByUserId,
  joinMatchAsBlack,
  startJoinedMatch,
} from '@/domain/play/match';
import type { MatchEvent } from '@/domain/play/match/events';
import { toMatchHistoryEntry, type MatchHistoryEntry } from '@/domain/play/match/history';
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { ChessMove } from '@/domain/play/chess/types';
import type { PromotionPieceType } from '@/features/chessboard/types';
import type { MatchmakingPoolKey } from '@/domain/play/matchmaking/types';
import { asUserId, type UserId } from '@/platform/ids';
import { err, ok, type Result } from '@/platform/result';
import { assertActorCanPlayRated } from '@/server/auth/policy';
import { assertActorIsParticipant } from './access';
import { matchServiceError, type MatchServiceError } from './errors';
import { memoryMatchRepository } from './memoryRepository';
import { getMatchRepository } from './getMatchRepository';
import type { MatchEventRecord, MatchRepository } from './types';
import {
  buildCompletedRatedMatchUpdate,
  persistCompletedRatingUpdate,
} from '../rating/ratingService';

export interface CreateMatchInput {
  hostUserId: string;
  hostIsGuest: boolean;
  gameModeId?: string;
  timeControlId?: string;
  rated?: boolean;
}

const saveError = (reason: 'not_found' | 'version_conflict'): MatchServiceError =>
  reason === 'version_conflict'
    ? matchServiceError('version_conflict', 'Match state changed; please retry')
    : matchServiceError('not_found', 'Match not found');

export class MatchService {
  constructor(private readonly repository: MatchRepository = memoryMatchRepository) {}

  private async persist(
    snapshot: MatchSnapshot,
    expectedVersion: number,
    auditEvents: MatchEvent[],
    previousStatus: MatchSnapshot['status'],
  ): Promise<Result<MatchSnapshot, MatchServiceError>> {
    const events = [...auditEvents];
    let ratingUpdate = null;

    const justCompleted = snapshot.status === 'completed' && previousStatus !== 'completed';
    if (justCompleted) {
      events.push({
        type: 'MATCH_COMPLETED',
        outcome: snapshot.outcome,
        endedAt: snapshot.endedAt ?? new Date().toISOString(),
      });

      ratingUpdate = await buildCompletedRatedMatchUpdate(snapshot);
      if (ratingUpdate) {
        events.push(...ratingUpdate.events);
      }
    }

    const saveResult = await this.repository.commit(snapshot, expectedVersion, events);
    if (!saveResult.ok) {
      return err(saveError(saveResult.reason));
    }

    await persistCompletedRatingUpdate(ratingUpdate);

    return ok(snapshot);
  }

  async createInviteMatch(input: CreateMatchInput): Promise<Result<MatchSnapshot, MatchServiceError>> {
    const poolKey: MatchmakingPoolKey = {
      gameModeId: input.gameModeId ?? 'endgame-standard',
      timeControlId: input.timeControlId ?? 'blitz_3_2',
      rated: input.rated ?? false,
    };

    if (poolKey.rated && input.hostIsGuest) {
      return err(matchServiceError(
        'rated_requires_auth',
        assertActorCanPlayRated({ userId: asUserId(input.hostUserId), isGuest: true }, true)!,
      ));
    }

    const picked = pickPoolPositionForMatch();
    if (!picked) {
      return err(matchServiceError('invalid_request', 'Position pool is empty'));
    }

    const matchId = crypto.randomUUID();
    const snapshot = createPendingMatch({
      id: matchId,
      hostUserId: input.hostUserId,
      startingFen: picked.fen,
      positionId: picked.positionId,
      poolKey,
      rated: poolKey.rated,
    });

    const auditEvent: MatchEvent = {
      type: 'MATCH_CREATED',
      startingFen: picked.fen,
      positionId: picked.positionId ?? undefined,
    };

    return this.persist(snapshot, 0, [auditEvent], 'pending');
  }

  async getMatch(matchId: string): Promise<MatchSnapshot | null> {
    const record = await this.repository.get(matchId);
    return record?.snapshot ?? null;
  }

  /**
   * Ordered audit event log for debugging/replay.
   * Participants only — events include FENs and move detail.
   */
  async listMatchEvents(
    matchId: string,
    actorUserId: string,
  ): Promise<Result<MatchEventRecord[], MatchServiceError>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err(matchServiceError('not_found', 'Match not found'));
    }

    const participantError = assertActorIsParticipant(record.snapshot, asUserId(actorUserId));
    if (participantError) {
      return err(matchServiceError('forbidden', participantError));
    }

    const events = await this.repository.listEvents(matchId);
    return ok(events);
  }

  /** Completed matches for the requesting user, summarised from their perspective. */
  async listMatchHistory(userId: string, limit = 50): Promise<MatchHistoryEntry[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), 100);
    const snapshots = await this.repository.listCompletedForUser(userId, boundedLimit);
    const entries: MatchHistoryEntry[] = [];
    for (const snapshot of snapshots) {
      const entry = toMatchHistoryEntry(snapshot, asUserId(userId));
      if (entry) {
        entries.push(entry);
      }
    }
    return entries;
  }

  async joinMatch(
    matchId: string,
    guestUserId: string,
    joinerIsGuest: boolean,
  ): Promise<Result<MatchSnapshot, MatchServiceError>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err(matchServiceError('not_found', 'Match not found'));
    }

    if (record.snapshot.rated && joinerIsGuest) {
      return err(matchServiceError(
        'rated_requires_auth',
        assertActorCanPlayRated({ userId: asUserId(guestUserId), isGuest: true }, true)!,
      ));
    }

    const hostId = record.snapshot.players.find((p) => p.slot === 'white')?.userId;
    if (hostId && hostId === asUserId(guestUserId)) {
      return err(matchServiceError('forbidden', 'Host cannot join as opponent'));
    }

    try {
      const joined = joinMatchAsBlack(record.snapshot, asUserId(guestUserId));
      const started = startJoinedMatch(joined);

      return this.persist(
        started,
        record.version,
        [
          {
            type: 'PLAYER_JOINED',
            userId: guestUserId,
            slot: 'black',
          },
          {
            type: 'MATCH_STARTED',
            at: started.startedAt ?? new Date().toISOString(),
          },
        ],
        record.snapshot.status,
      );
    } catch (error) {
      return err(matchServiceError(
        'illegal_state',
        error instanceof Error ? error.message : 'Unable to join match',
      ));
    }
  }

  async commitMove(
    matchId: string,
    actorUserId: string,
    move: { from: string; to: string; promotion?: string },
  ): Promise<Result<MatchSnapshot, MatchServiceError>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err(matchServiceError('not_found', 'Match not found'));
    }

    const participantError = assertActorIsParticipant(record.snapshot, asUserId(actorUserId));
    if (participantError) {
      return err(matchServiceError('forbidden', participantError));
    }

    const chessMove: ChessMove = {
      from: move.from,
      to: move.to,
      promotion: move.promotion as PromotionPieceType | undefined,
    };

    const result = applyMatchMove(record.snapshot, asUserId(actorUserId), chessMove, Date.now());
    if (!result.ok) {
      return err(matchServiceError('illegal_state', result.error));
    }

    const lastMove = result.value.moves[result.value.moves.length - 1];
    const player = findPlayerByUserId(record.snapshot, asUserId(actorUserId));
    const auditEvent: MatchEvent = {
      type: 'MOVE_COMMITTED',
      move: chessMove,
      san: lastMove.san,
      fen: result.value.currentFen,
      mover: player?.color ?? 'w',
      clock: result.value.clock,
    };

    return this.persist(result.value, record.version, [auditEvent], record.snapshot.status);
  }

  async resign(matchId: string, actorUserId: string): Promise<Result<MatchSnapshot, MatchServiceError>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err(matchServiceError('not_found', 'Match not found'));
    }

    const participantError = assertActorIsParticipant(record.snapshot, asUserId(actorUserId));
    if (participantError) {
      return err(matchServiceError('forbidden', participantError));
    }

    const result = applyMatchResign(record.snapshot, asUserId(actorUserId));
    if (!result.ok) {
      return err(matchServiceError('illegal_state', result.error));
    }

    const player = findPlayerByUserId(record.snapshot, asUserId(actorUserId));
    const auditEvent: MatchEvent = {
      type: 'RESIGN',
      color: player?.color ?? 'w',
    };

    return this.persist(result.value, record.version, [auditEvent], record.snapshot.status);
  }
}

export const matchService = new MatchService(getMatchRepository());

export const resolvePlayerId = (headerValue: string | null): UserId | null => {
  if (!headerValue || headerValue.trim().length === 0) {
    return null;
  }
  return asUserId(headerValue.trim());
};
