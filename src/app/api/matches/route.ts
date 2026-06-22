import { NextResponse } from 'next/server';
import { assertActorCanPlayRated, requireRequestActor } from '@/server/auth';
import { matchService } from '@/server/match';

export async function POST(request: Request) {
  const resolved = await requireRequestActor(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
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
    return NextResponse.json({ error: ratedError }, { status: 403 });
  }

  const result = await matchService.createInviteMatch({
    hostUserId: actor.userId,
    hostIsGuest: actor.isGuest,
    gameModeId: body.gameModeId,
    timeControlId: body.timeControlId,
    rated,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    match: result.value,
    invitePath: `/match/${result.value.id}`,
  });
}
