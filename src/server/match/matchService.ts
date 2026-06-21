import '@/domain/play/time-control';
import { pickPoolPositionForMatch } from '@/domain/endgame/pool';
import {
  applyMatchMove,
  applyMatchResign,
  createPendingMatch,
  joinMatchAsBlack,
  startJoinedMatch,
} from '@/domain/play/match';
import type { MatchSnapshot } from '@/domain/play/match/types';
import type { ChessMove } from '@/domain/play/chess/types';
import type { PromotionPieceType } from '@/features/chessboard/types';
import type { MatchmakingPoolKey } from '@/domain/play/matchmaking/types';
import { asUserId, type UserId } from '@/platform/ids';
import { err, ok, type Result } from '@/platform/result';
import { memoryMatchRepository } from './memoryRepository';
import type { MatchRepository } from './types';
import { processCompletedRatedMatch } from '../rating/ratingService';

export interface CreateMatchInput {
  hostUserId: string;
  gameModeId?: string;
  timeControlId?: string;
  rated?: boolean;
}

export class MatchService {
  constructor(private readonly repository: MatchRepository = memoryMatchRepository) {}

  private async persist(snapshot: MatchSnapshot): Promise<void> {
    await this.repository.save(snapshot);
    if (snapshot.status === 'completed') {
      processCompletedRatedMatch(snapshot);
    }
  }

  async createInviteMatch(input: CreateMatchInput): Promise<Result<MatchSnapshot, string>> {
    const poolKey: MatchmakingPoolKey = {
      gameModeId: input.gameModeId ?? 'endgame-standard',
      timeControlId: input.timeControlId ?? 'blitz_3_2',
      rated: input.rated ?? false,
    };

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

    await this.persist(snapshot);
    return ok(snapshot);
  }

  async getMatch(matchId: string): Promise<MatchSnapshot | null> {
    return this.repository.get(matchId);
  }

  async joinMatch(matchId: string, guestUserId: string): Promise<Result<MatchSnapshot, string>> {
    const snapshot = await this.repository.get(matchId);
    if (!snapshot) {
      return err('Match not found');
    }

    try {
      const joined = joinMatchAsBlack(snapshot, asUserId(guestUserId));
      const started = startJoinedMatch(joined);
      await this.persist(started);
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
    const snapshot = await this.repository.get(matchId);
    if (!snapshot) {
      return err('Match not found');
    }

    const chessMove: ChessMove = {
      from: move.from,
      to: move.to,
      promotion: move.promotion as PromotionPieceType | undefined,
    };

    const result = applyMatchMove(snapshot, asUserId(actorUserId), chessMove, Date.now());
    if (!result.ok) {
      return result;
    }

    await this.persist(result.value);
    return result;
  }

  async resign(matchId: string, actorUserId: string): Promise<Result<MatchSnapshot, string>> {
    const snapshot = await this.repository.get(matchId);
    if (!snapshot) {
      return err('Match not found');
    }

    const result = applyMatchResign(snapshot, asUserId(actorUserId));
    if (!result.ok) {
      return result;
    }

    await this.persist(result.value);
    return result;
  }
}

export const matchService = new MatchService();

export const resolvePlayerId = (headerValue: string | null): UserId | null => {
  if (!headerValue || headerValue.trim().length === 0) {
    return null;
  }
  return asUserId(headerValue.trim());
};
