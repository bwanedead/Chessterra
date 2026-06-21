'use client';

import { EndgameNav, PlayShell } from '@/features/endgame';

const BOARD_SIZE = 480;

export const PlayPageClient = () => (
  <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
    <div className="mb-8 flex justify-center">
      <EndgameNav />
    </div>
    <PlayShell boardSize={BOARD_SIZE} />
  </main>
);
