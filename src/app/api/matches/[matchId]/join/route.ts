import { requireRequestActor } from '@/server/auth';
import { matchErrorResponse, matchErrorStatus, matchService } from '@/server/match';
import { createMatchRouteResponder } from '@/server/observability/matchRoute';
import { checkMatchRateLimit } from '@/server/security/matchRateLimits';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const respond = createMatchRouteResponder('join', matchId);
  try {
    const resolved = await requireRequestActor(request);
    if ('error' in resolved) {
      return respond.fail(resolved.status, { error: resolved.error });
    }

    const rate = checkMatchRateLimit('join', resolved.actor.userId);
    if (!rate.allowed) {
      return respond.rateLimited(rate.retryAfterSeconds, resolved.actor);
    }

    const result = await matchService.joinMatch(
      matchId,
      resolved.actor.userId,
      resolved.actor.isGuest,
    );
    if (!result.ok) {
      return respond.fail(
        matchErrorStatus(result.error.code),
        matchErrorResponse(result.error),
        resolved.actor,
      );
    }

    return respond.ok({ match: result.value }, resolved.actor);
  } catch (error) {
    return respond.exception(error);
  }
}
