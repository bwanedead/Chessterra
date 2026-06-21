'use client';

import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { OAUTH_PROVIDERS } from '../providers';

export const AuthPanel = () => {
  const {
    user,
    supabaseEnabled,
    signInWithOAuth,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  const handleOAuth = async (provider: (typeof OAUTH_PROVIDERS)[number]['id']) => {
    setPending(true);
    setError(null);
    setNotice(null);
    const message = await signInWithOAuth(provider);
    if (message) {
      setError(message);
    }
    setPending(false);
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const message = await signInWithMagicLink(email);
    if (message) {
      setError(message);
    } else {
      setNotice('Check your email for a sign-in link.');
    }
    setPending(false);
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const message =
      passwordMode === 'sign-in'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, displayName);
    if (message) {
      setError(message);
    }
    setPending(false);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h1 className="text-xl font-semibold text-slate-100">Account</h1>
      <p className="mt-2 text-sm text-slate-400">
        {supabaseEnabled
          ? 'Sign in with a parent account or email link — we do not store your password for OAuth.'
          : 'Supabase is not configured — playing as a guest with a local player id.'}
      </p>

      {user && !user.isGuest ? (
        <div className="mt-6 space-y-3 text-sm text-slate-300">
          <p>
            Signed in as <span className="font-medium text-slate-100">{user.displayName}</span>
          </p>
          {user.email ? <p className="text-slate-400">{user.email}</p> : null}
          {user.authProvider ? (
            <p className="text-xs text-slate-500 capitalize">via {user.authProvider}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      ) : null}

      {user?.isGuest ? (
        <p className="mt-4 text-xs text-amber-300/90">Guest mode — sign in to save rating and history.</p>
      ) : null}

      {supabaseEnabled && (!user || user.isGuest) ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                disabled={pending}
                onClick={() => void handleOAuth(provider.id)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-60"
              >
                Continue with {provider.label}
              </button>
            ))}
          </div>

          <div className="relative text-center text-xs text-slate-500">
            <span className="bg-slate-900/70 px-2">or email magic link</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-800" />
          </div>

          <form onSubmit={handleMagicLink} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowPasswordForm((value) => !value)}
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-400 hover:underline"
          >
            {showPasswordForm ? 'Hide password sign-in' : 'Use password instead (optional)'}
          </button>

          {showPasswordForm ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPasswordMode('sign-in')}
                  className={passwordMode === 'sign-in' ? 'text-sky-400' : 'text-slate-500'}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordMode('sign-up')}
                  className={passwordMode === 'sign-up' ? 'text-sky-400' : 'text-slate-500'}
                >
                  Sign up
                </button>
              </div>
              {passwordMode === 'sign-up' ? (
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
              ) : null}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                {passwordMode === 'sign-in' ? 'Sign in with password' : 'Create account with password'}
              </button>
            </form>
          ) : null}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
        </div>
      ) : null}
    </div>
  );
};
