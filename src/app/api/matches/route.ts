import { assertActorCanPlayRated, requireRequestActor } from '@/server/auth';
import { matchErrorResponse, matchErrorStatus, matchService } from '@/server/match';
import { createMatchRouteResponder } from '@/server/observability/matchRoute';

export async function POST(request: Request) {
  const respond = createMatchRouteResponder('create');
  try {
    const resolved = await requireRequestActor(request);
    if ('error' in resolved) {
      return respond.fail(resolved.status, { error: resolved.error });
    }

    const { actor } = resolved;

    let body: { gameModeId?: string; timeControlId?: string; rated?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const rated = body.rated ?? false;
    const ratedError = assertActorCanPlayRated(actor, rated);
    if (ratedError) {
      return respond.fail(403, { error: ratedError, code: 'rated_requires_auth' }, actor);
    }

    const result = await matchService.createInviteMatch({
      hostUserId: actor.userId,
      hostIsGuest: actor.isGuest,
      gameModeId: body.gameModeId,
      timeControlId: body.timeControlId,
      rated,
    });

    if (!result.ok) {
      return respond.fail(
        matchErrorStatus(result.error.code),
        matchErrorResponse(result.error),
        actor,
      );
    }

    respond.setMatchId(result.value.id);
    return respond.ok(
      {
        match: result.value,
        invitePath: `/match/${result.value.id}`,
      },
      actor,
    );
  } catch (error) {
    return respond.exception(error);
  }
}
