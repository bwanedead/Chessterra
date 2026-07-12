'use client';

import { AuthProvider, useAuth } from '@/features/auth';
import { EndgameNav, MatchHistoryPanel } from '@/features/endgame';

const HistoryContent = () => {
  const { playerId, loading } = useAuth();

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <header className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Endgame</p>
        <h1 className="text-lg font-semibold text-slate-100">Match history</h1>
      </header>
      {loading ? (
        <p className="text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <MatchHistoryPanel playerId={playerId} />
      )}
    </div>
  );
};

export const HistoryClient = () => (
  <AuthProvider>
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mb-8 flex justify-center">
        <EndgameNav />
      </div>
      <HistoryContent />
    </main>
  </AuthProvider>
);
