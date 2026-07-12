import { NextResponse } from 'next/server';
import { requireRequestActor } from '@/server/auth';
import { matchService } from '@/server/match/matchService';

/**
 * Completed match history for the requesting user.
 * Participant-scoped by construction: results are filtered to matches
 * where the resolved actor was a player.
 */
export async function GET(request: Request) {
  const resolved = await requireRequestActor(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 50;

  const matches = await matchService.listMatchHistory(resolved.actor.userId, limit);
  return NextResponse.json({ matches });
}
