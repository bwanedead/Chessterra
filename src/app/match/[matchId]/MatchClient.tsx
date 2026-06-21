'use client';

import { AuthProvider, useAuth } from '@/features/auth';
import { EndgameNav, OnlinePlayShell } from '@/features/endgame';

const MatchRoom = ({ matchId }: { matchId: string }) => {
  const { playerId } = useAuth();
  return <OnlinePlayShell matchId={matchId} playerId={playerId} />;
};

export const MatchClient = ({ matchId }: { matchId: string }) => (
  <AuthProvider>
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mb-8 flex justify-center">
        <EndgameNav />
      </div>
      <MatchRoom matchId={matchId} />
    </main>
  </AuthProvider>
);
