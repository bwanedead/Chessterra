import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from './types';

const readDisplayName = (user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string => {
  const meta = user.user_metadata ?? {};
  return (
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Player'
  );
};

/** Ensures a profiles row exists for authenticated users (belt-and-suspenders with DB trigger). */
export const ensureUserProfile = async (
  supabase: SupabaseClient,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
): Promise<void> => {
  const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (data) {
    return;
  }

  await supabase.from('profiles').insert({
    id: user.id,
    display_name: readDisplayName(user),
    avatar_url:
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null,
  });
};

export const getUserProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
};
