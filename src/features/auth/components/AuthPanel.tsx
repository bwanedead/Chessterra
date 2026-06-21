'use client';

import { useState } from 'react';
import { useAuth } from '../AuthProvider';

export const AuthPanel = () => {
  const { user, supabaseEnabled, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const message =
      mode === 'sign-in'
        ? await signIn(email, password)
        : await signUp(email, password, displayName);

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
          ? 'Sign in for persistent identity across devices.'
          : 'Supabase is not configured — playing as a guest with a local player id.'}
      </p>

      {user ? (
        <div className="mt-6 space-y-3 text-sm text-slate-300">
          <p>
            Signed in as <span className="font-medium text-slate-100">{user.displayName}</span>
          </p>
          <p className="font-mono text-xs text-slate-500 break-all">{user.id}</p>
          {user.isGuest ? <p className="text-amber-300/90">Guest mode</p> : null}
          {supabaseEnabled ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
            >
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}

      {supabaseEnabled ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className={mode === 'sign-in' ? 'text-sky-400' : 'text-slate-500'}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className={mode === 'sign-up' ? 'text-sky-400' : 'text-slate-500'}
            >
              Sign up
            </button>
          </div>
          {mode === 'sign-up' ? (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          ) : null}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {pending ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      ) : null}
    </div>
  );
};
