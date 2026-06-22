import { NextResponse } from 'next/server';
import { requireRequestActor } from '@/server/auth';
import { matchErrorStatus, matchService } from '@/server/match';

interface RouteContext {
  params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const resolved = await requireRequestActor(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  let body: { from: string; to: string; promotion?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.from || !body.to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  const result = await matchService.commitMove(matchId, resolved.actor.userId, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: matchErrorStatus(result.error) });
  }

  return NextResponse.json({ match: result.value });
}
