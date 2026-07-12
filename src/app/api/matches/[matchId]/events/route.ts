import { requireRequestActor } from '@/server/auth';
import { matchErrorResponse, matchErrorStatus, matchService } from '@/server/match';
import { createMatchRouteResponder } from '@/server/observability/matchRoute';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

/**
 * Audit event replay for debugging a match.
 * Participant-only: events contain FENs and move detail, which participants
 * already see on the board. Not a public surface.
 */
export async function GET(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const respond = createMatchRouteResponder('events', matchId);
  try {
    const resolved = await requireRequestActor(request);
    if ('error' in resolved) {
      return respond.fail(resolved.status, { error: resolved.error });
    }

    const result = await matchService.listMatchEvents(matchId, resolved.actor.userId);
    if (!result.ok) {
      return respond.fail(
        matchErrorStatus(result.error.code),
        matchErrorResponse(result.error),
        resolved.actor,
      );
    }

    return respond.ok({ events: result.value }, resolved.actor);
  } catch (error) {
    return respond.exception(error);
  }
}
