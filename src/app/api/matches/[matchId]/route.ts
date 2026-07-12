import { resolveRequestActor } from '@/server/auth';
import { canViewMatch } from '@/server/match/access';
import { matchService } from '@/server/match';
import { createMatchRouteResponder } from '@/server/observability/matchRoute';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const respond = createMatchRouteResponder('get', matchId);
  try {
    const match = await matchService.getMatch(matchId);
    if (!match) {
      return respond.fail(404, { error: 'Match not found', code: 'not_found' });
    }

    const actor = await resolveRequestActor(request);
    if (!canViewMatch(match, actor?.userId ?? null)) {
      return respond.fail(403, { error: 'Forbidden', code: 'forbidden' }, actor ?? undefined);
    }

    return respond.ok({ match }, actor ?? undefined);
  } catch (error) {
    return respond.exception(error);
  }
}
