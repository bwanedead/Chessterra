import { NextResponse } from 'next/server';
import { resolveRequestActor } from '@/server/auth';
import { canViewMatch } from '@/server/match/access';
import { matchService } from '@/server/match';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const match = await matchService.getMatch(matchId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const actor = await resolveRequestActor(request);
  if (!canViewMatch(match, actor?.userId ?? null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ match });
}
