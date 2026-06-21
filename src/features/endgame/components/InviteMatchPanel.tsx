'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { createInviteMatch } from '@/features/endgame/api/matchApi';

export const InviteMatchPanel = () => {
  const { playerId } = useAuth();
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleCreate = async () => {
    if (!playerId) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await createInviteMatch(playerId, { rated: false, timeControlId: 'blitz_3_2' });
      setInvitePath(result.invitePath);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create match');
    } finally {
      setPending(false);
    }
  };

  const fullUrl =
    typeof window !== 'undefined' && invitePath ? `${window.location.origin}${invitePath}` : invitePath;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
      <p className="font-medium text-slate-100">Online invite match</p>
      <p className="mt-1 text-xs text-slate-500">Create a link and open it in another tab or send to a friend.</p>
      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={pending || !playerId}
        className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
      >
        {pending ? 'Creating…' : 'Create invite link'}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
      {fullUrl ? (
        <div className="mt-3 space-y-2">
          <p className="break-all font-mono text-xs text-sky-300">{fullUrl}</p>
          <a href={invitePath ?? '#'} className="text-xs text-sky-400 underline">
            Open match room
          </a>
        </div>
      ) : null}
    </div>
  );
};
