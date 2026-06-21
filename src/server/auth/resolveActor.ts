import { asUserId } from '@/platform/ids';
import { createSupabaseServerClient } from '@/platform/supabase/server';
import { isSupabaseConfigured } from '@/platform/supabase/env';
import type { RequestActor } from './types';
import { ensureUserProfile } from './profile';

const mapAuthUser = (user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): RequestActor => {
  const meta = user.user_metadata ?? {};
  const displayName =
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Player';

  return {
    userId: asUserId(user.id),
    isGuest: false,
    email: user.email,
    displayName,
  };
};

const actorFromGuestHeader = (headerValue: string | null): RequestActor | null => {
  if (!headerValue || headerValue.trim().length === 0) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (isSupabaseConfigured() && !trimmed.startsWith('guest-')) {
    return null;
  }
  return {
    userId: asUserId(trimmed),
    isGuest: trimmed.startsWith('guest-'),
    displayName: trimmed.startsWith('guest-') ? 'Guest' : 'Player',
  };
};

/**
 * Resolves the caller for API routes.
 * Priority: verified Supabase session cookie → guest X-Player-Id (dev / bot play).
 */
export const resolveRequestActor = async (request: Request): Promise<RequestActor | null> => {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        const actor = mapAuthUser(data.user);
        await ensureUserProfile(supabase, data.user);
        return actor;
      }
    }
  }

  return actorFromGuestHeader(request.headers.get('x-player-id'));
};

export const requireRequestActor = async (
  request: Request,
): Promise<{ actor: RequestActor } | { error: string; status: number }> => {
  const actor = await resolveRequestActor(request);
  if (!actor) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { actor };
};
