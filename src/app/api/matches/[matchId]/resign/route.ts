import { NextResponse } from 'next/server';
import { requireRequestActor } from '@/server/auth';
import { matchErrorResponse, matchErrorStatus, matchService } from '@/server/match';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const resolved = await requireRequestActor(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await matchService.resign(matchId, resolved.actor.userId);
  if (!result.ok) {
    return NextResponse.json(
      matchErrorResponse(result.error),
      { status: matchErrorStatus(result.error.code) },
    );
  }

  return NextResponse.json({ match: result.value });
}
