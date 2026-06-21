import { NextResponse } from 'next/server';
import { requireRequestActor } from '@/server/auth';
import { matchService } from '@/server/match';

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
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ match: result.value });
}
