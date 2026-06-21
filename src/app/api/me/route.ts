import { NextResponse } from 'next/server';
import { requireRequestActor } from '@/server/auth';
import { createSupabaseServerClient } from '@/platform/supabase/server';
import { isSupabaseConfigured } from '@/platform/supabase/env';
import { getUserProfile } from '@/server/auth/profile';

export async function GET(request: Request) {
  const resolved = await requireRequestActor(request);
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { actor } = resolved;
  let profile = null;

  if (!actor.isGuest && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      profile = await getUserProfile(supabase, actor.userId);
    }
  }

  return NextResponse.json({
    actor: {
      id: actor.userId,
      isGuest: actor.isGuest,
      email: actor.email,
      displayName: profile?.displayName ?? actor.displayName,
      avatarUrl: profile?.avatarUrl ?? null,
    },
    profile,
  });
}
