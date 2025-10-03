"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-8">
        <h1 className="text-2xl font-semibold mb-4">Critical error</h1>
        <p className="mb-6 text-sm opacity-80">
          {error.message || 'The application encountered a fatal error.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
        >
          Reload app
        </button>
      </body>
    </html>
  );
}
