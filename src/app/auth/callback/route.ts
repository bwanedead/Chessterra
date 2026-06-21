import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/platform/supabase/server';

/** OAuth and magic-link redirect handler — exchanges auth code for session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/play';

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
