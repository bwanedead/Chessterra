'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/platform/supabase/client';
import { isSupabaseConfigured } from '@/platform/supabase/env';
import { getOrCreateGuestId } from './guest';

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  playerId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          displayName:
            (sessionUser.user_metadata?.display_name as string | undefined) ??
            sessionUser.email?.split('@')[0] ??
            'Player',
          isGuest: false,
        });
      } else {
        hydrateGuest();
      }
      setLoading(false);
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          displayName:
            (sessionUser.user_metadata?.display_name as string | undefined) ??
            sessionUser.email?.split('@')[0] ??
            'Player',
          isGuest: false,
        });
      } else {
        hydrateGuest();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateGuest, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return 'Supabase is not configured';
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signUp = useCallback(
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
      signIn,
      signUp,
      signOut,
      playerId: user?.id ?? null,
    }),
    [loading, signIn, signOut, signUp, supabaseEnabled, user],
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
