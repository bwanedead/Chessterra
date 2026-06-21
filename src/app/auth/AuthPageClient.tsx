'use client';

import { AuthPanel, AuthProvider } from '@/features/auth';
import { EndgameNav } from '@/features/endgame';

export const AuthPageClient = () => (
  <AuthProvider>
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mb-8 flex justify-center">
        <EndgameNav />
      </div>
      <AuthPanel />
    </main>
  </AuthProvider>
);
