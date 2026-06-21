'use client';

import { AuthProvider } from '@/features/auth';
import { EndgameNav, InviteMatchPanel, PlayShell } from '@/features/endgame';

const BOARD_SIZE = 480;

const PlayContent = () => (
  <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
    <InviteMatchPanel />
    <PlayShell boardSize={BOARD_SIZE} />
  </div>
);

export const PlayPageClient = () => (
  <AuthProvider>
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mb-8 flex justify-center">
        <EndgameNav />
      </div>
      <PlayContent />
    </main>
  </AuthProvider>
);
