import { NextResponse } from 'next/server';
import { matchService } from '@/server/match';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const match = await matchService.getMatch(matchId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }
  return NextResponse.json({ match });
}
