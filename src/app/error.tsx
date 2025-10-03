"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-8">
      <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
      <p className="mb-6 text-sm opacity-80">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
