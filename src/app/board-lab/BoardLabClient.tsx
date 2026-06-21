'use client';

import { EditableBoard } from '@/features/board';

export const BoardLabClient = () => (
  <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Board Lab</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Design game variants via the board CLI. Agents can emit{' '}
          <code className="text-sky-300">BoardVariantConfig</code> JSON and apply with{' '}
          <code className="text-sky-300">config apply</code>. Edit the graph directly with{' '}
          <code className="text-sky-300">piece</code>, <code className="text-sky-300">node</code>, and{' '}
          <code className="text-sky-300">meta</code> commands.
        </p>
      </header>
      <EditableBoard boardSize={480} playerColor={null} />
    </div>
  </main>
);
