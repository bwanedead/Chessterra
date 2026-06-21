import { NextResponse } from 'next/server';
import { matchService, resolvePlayerId } from '@/server/match';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const playerId = resolvePlayerId(request.headers.get('x-player-id'));
  if (!playerId) {
    return NextResponse.json({ error: 'Missing X-Player-Id header' }, { status: 401 });
  }

  const result = await matchService.joinMatch(matchId, playerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ match: result.value });
}
