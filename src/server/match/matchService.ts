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
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { ChessMove } from '@/domain/play/chess/types';
import type { PromotionPieceType } from '@/features/chessboard/types';
import type { MatchmakingPoolKey } from '@/domain/play/matchmaking/types';
import { asUserId, type UserId } from '@/platform/ids';
import { err, ok, type Result } from '@/platform/result';
import { assertActorCanPlayRated } from '@/server/auth/policy';
import { assertActorIsParticipant } from './access';
import { memoryMatchRepository } from './memoryRepository';
import { getMatchRepository } from './getMatchRepository';
import type { MatchRepository } from './types';
import { processCompletedRatedMatch } from '../rating/ratingService';

export interface CreateMatchInput {
  hostUserId: string;
  hostIsGuest: boolean;
  gameModeId?: string;
  timeControlId?: string;
  rated?: boolean;
}

const VERSION_CONFLICT_ERROR = 'Match state changed; please retry';

export class MatchService {
  constructor(private readonly repository: MatchRepository = memoryMatchRepository) {}

  private async appendAuditEvent(matchId: string, event: MatchEvent): Promise<void> {
    if (this.repository.appendEvent) {
      await this.repository.appendEvent(matchId, event);
    }
  }

  private async persist(
    snapshot: MatchSnapshot,
    expectedVersion: number,
    auditEvent: MatchEvent | undefined,
    previousStatus: MatchSnapshot['status'],
  ): Promise<Result<MatchSnapshot, string>> {
    const saveResult = await this.repository.save(snapshot, expectedVersion);
    if (!saveResult.ok) {
      if (saveResult.reason === 'version_conflict') {
        return err(VERSION_CONFLICT_ERROR);
      }
      return err('Match not found');
    }

    if (auditEvent) {
      await this.appendAuditEvent(snapshot.id, auditEvent);
    }

    const justCompleted = snapshot.status === 'completed' && previousStatus !== 'completed';
    if (justCompleted) {
      await this.appendAuditEvent(snapshot.id, {
        type: 'MATCH_COMPLETED',
        outcome: snapshot.outcome,
        endedAt: snapshot.endedAt ?? new Date().toISOString(),
      });

      await processCompletedRatedMatch(snapshot, async (ratingEvent) => {
        await this.appendAuditEvent(snapshot.id, ratingEvent);
      });
    }

    return ok(snapshot);
  }

  async createInviteMatch(input: CreateMatchInput): Promise<Result<MatchSnapshot, string>> {
    const poolKey: MatchmakingPoolKey = {
      gameModeId: input.gameModeId ?? 'endgame-standard',
      timeControlId: input.timeControlId ?? 'blitz_3_2',
      rated: input.rated ?? false,
    };

    if (poolKey.rated && input.hostIsGuest) {
      return err(assertActorCanPlayRated({ userId: asUserId(input.hostUserId), isGuest: true }, true)!);
    }

    const picked = pickPoolPositionForMatch();
    if (!picked) {
      return err('Position pool is empty');
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

    return this.persist(snapshot, 0, auditEvent, 'pending');
  }

  async getMatch(matchId: string): Promise<MatchSnapshot | null> {
    const record = await this.repository.get(matchId);
    return record?.snapshot ?? null;
  }

  async joinMatch(
    matchId: string,
    guestUserId: string,
    joinerIsGuest: boolean,
  ): Promise<Result<MatchSnapshot, string>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err('Match not found');
    }

    if (record.snapshot.rated && joinerIsGuest) {
      return err(assertActorCanPlayRated({ userId: asUserId(guestUserId), isGuest: true }, true)!);
    }

    const hostId = record.snapshot.players.find((p) => p.slot === 'white')?.userId;
    if (hostId && hostId === asUserId(guestUserId)) {
      return err('Host cannot join as opponent');
    }

    try {
      const joined = joinMatchAsBlack(record.snapshot, asUserId(guestUserId));
      const started = startJoinedMatch(joined);

      const saveResult = await this.persist(started, record.version, undefined, record.snapshot.status);
      if (!saveResult.ok) {
        return saveResult;
      }

      await this.appendAuditEvent(matchId, {
        type: 'PLAYER_JOINED',
        userId: guestUserId,
        slot: 'black',
      });
      await this.appendAuditEvent(matchId, {
        type: 'MATCH_STARTED',
        at: started.startedAt ?? new Date().toISOString(),
      });

      return ok(started);
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Unable to join match');
    }
  }

  async commitMove(
    matchId: string,
    actorUserId: string,
    move: { from: string; to: string; promotion?: string },
  ): Promise<Result<MatchSnapshot, string>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err('Match not found');
    }

    const participantError = assertActorIsParticipant(record.snapshot, asUserId(actorUserId));
    if (participantError) {
      return err(participantError);
    }

    const chessMove: ChessMove = {
      from: move.from,
      to: move.to,
      promotion: move.promotion as PromotionPieceType | undefined,
    };

    const result = applyMatchMove(record.snapshot, asUserId(actorUserId), chessMove, Date.now());
    if (!result.ok) {
      return result;
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

    return this.persist(result.value, record.version, auditEvent, record.snapshot.status);
  }

  async resign(matchId: string, actorUserId: string): Promise<Result<MatchSnapshot, string>> {
    const record = await this.repository.get(matchId);
    if (!record) {
      return err('Match not found');
    }

    const participantError = assertActorIsParticipant(record.snapshot, asUserId(actorUserId));
    if (participantError) {
      return err(participantError);
    }

    const result = applyMatchResign(record.snapshot, asUserId(actorUserId));
    if (!result.ok) {
      return result;
    }

    const player = findPlayerByUserId(record.snapshot, asUserId(actorUserId));
    const auditEvent: MatchEvent = {
      type: 'RESIGN',
      color: player?.color ?? 'w',
    };

    return this.persist(result.value, record.version, auditEvent, record.snapshot.status);
  }
}

export const matchService = new MatchService(getMatchRepository());

export const resolvePlayerId = (headerValue: string | null): UserId | null => {
  if (!headerValue || headerValue.trim().length === 0) {
    return null;
  }
  return asUserId(headerValue.trim());
};
