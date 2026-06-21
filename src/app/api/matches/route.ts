import { NextResponse } from 'next/server';
import { matchService, resolvePlayerId } from '@/server/match';

export async function POST(request: Request) {
  const playerId = resolvePlayerId(request.headers.get('x-player-id'));
  if (!playerId) {
    return NextResponse.json({ error: 'Missing X-Player-Id header' }, { status: 401 });
  }

  let body: { gameModeId?: string; timeControlId?: string; rated?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await matchService.createInviteMatch({
    hostUserId: playerId,
    gameModeId: body.gameModeId,
    timeControlId: body.timeControlId,
    rated: body.rated,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    match: result.value,
    invitePath: `/match/${result.value.id}`,
  });
}
