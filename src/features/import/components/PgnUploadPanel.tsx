'use client';

import { useState } from 'react';
import { parseTimelineFromPgn, PGN_SOURCE_ID } from '@/domain/imports/pgn';
import { useGameStore } from '@/shared/state/gameStore';

export const PgnUploadPanel = () => {
  const pgn = useGameStore((state) => state.pgn);
  const setPgn = useGameStore((state) => state.setPgn);
  const setTimeline = useGameStore((state) => state.setTimeline);
  const setIsImporting = useGameStore((state) => state.setIsImporting);
  const isImporting = useGameStore((state) => state.isImporting);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    try {
      setError(null);
      setIsImporting(true);
      const timeline = await Promise.resolve(parseTimelineFromPgn(pgn));
      setTimeline(timeline);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load PGN.';
      setError(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
        <span className="icon-sm text-blue-400 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H5.5z" />
          </svg>
        </span>
        Game Import
      </h3>
      <textarea
        value={pgn}
        onChange={(event) => setPgn(event.target.value)}
        placeholder="Paste your PGN notation here..."
        rows={5}
        className="w-full p-4 bg-gray-700/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        disabled={isImporting}
      />
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-start">
          <span className="icon-sm text-red-400 mr-2 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span>{error}</span>
        </div>
      )}
      <button
        onClick={handleLoad}
        disabled={isImporting || pgn.trim().length === 0}
        className="btn w-full py-3 bg-blue-600/90 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50"
      >
        {isImporting ? 'Loading...' : 'Load PGN'}
      </button>
      <p className="text-xs text-gray-400 mt-3">
        Source: {PGN_SOURCE_ID}
      </p>
    </div>
  );
};
