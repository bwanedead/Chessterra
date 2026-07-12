import { requireRequestActor } from '@/server/auth';
import { matchService } from '@/server/match/matchService';
import { createMatchRouteResponder } from '@/server/observability/matchRoute';

/**
 * Completed match history for the requesting user.
 * Participant-scoped by construction: results are filtered to matches
 * where the resolved actor was a player.
 */
export async function GET(request: Request) {
  const respond = createMatchRouteResponder('history');
  try {
    const resolved = await requireRequestActor(request);
    if ('error' in resolved) {
      return respond.fail(resolved.status, { error: resolved.error });
    }

    const url = new URL(request.url);
    const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 50;

    const matches = await matchService.listMatchHistory(resolved.actor.userId, limit);
    return respond.ok({ matches }, resolved.actor);
  } catch (error) {
    return respond.exception(error);
  }
}
