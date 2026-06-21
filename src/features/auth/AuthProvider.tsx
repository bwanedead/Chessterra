'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/platform/supabase/client';
import { isSupabaseConfigured } from '@/platform/supabase/env';
import { getOrCreateGuestId } from './guest';
import { getAuthCallbackUrl, type OAuthProvider } from './providers';

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  isGuest: boolean;
  avatarUrl?: string;
  authProvider?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signInWithOAuth: (provider: OAuthProvider) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  playerId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const mapSessionUser = (sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: { provider?: string };
}): AuthUser => {
  const meta = sessionUser.user_metadata ?? {};
  const displayName =
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    sessionUser.email?.split('@')[0] ??
    'Player';

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName,
    isGuest: false,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined),
    authProvider: sessionUser.app_metadata?.provider,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseEnabled = isSupabaseConfigured();
  const supabase = useMemo(() => (supabaseEnabled ? createSupabaseBrowserClient() : null), [supabaseEnabled]);

  const hydrateGuest = useCallback(() => {
    const guestId = getOrCreateGuestId();
    setUser({
      id: guestId,
      displayName: 'Guest',
      isGuest: true,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      hydrateGuest();
      return undefined;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user;
      if (sessionUser) {
        setUser(mapSessionUser(sessionUser));
      } else {
        hydrateGuest();
      }
      setLoading(false);
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        setUser(mapSessionUser(sessionUser));
      } else {
        hydrateGuest();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateGuest, supabase]);

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!supabase) {
        return 'Supabase is not configured';
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) {
        return 'Supabase is not configured';
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return 'Supabase is not configured';
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) {
        return 'Supabase is not configured';
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    hydrateGuest();
  }, [hydrateGuest, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      supabaseEnabled,
      signInWithOAuth,
      signInWithMagicLink,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      playerId: user?.id ?? null,
    }),
    [
      loading,
      signInWithMagicLink,
      signInWithOAuth,
      signInWithPassword,
      signOut,
      signUpWithPassword,
      supabaseEnabled,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
