'use client';

import { usePreferencesStore } from '@/shared/state/preferencesStore';
import { useGameStore } from '@/shared/state/gameStore';

export const BoardModePanel = () => {
  const moveMode = usePreferencesStore((state) => state.moveMode);
  const toggleMoveMode = usePreferencesStore((state) => state.toggleMoveMode);
  const resetTimeline = useGameStore((state) => state.resetTimeline);

  return (
    <div className="glass-effect p-4 rounded-lg w-full max-w-[480px] mb-4">
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-3 text-gray-200 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={moveMode}
            onChange={toggleMoveMode}
            className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
          />
          <span>Play Mode{moveMode ? ' (Pieces are draggable)' : ' (Analysis only)'}</span>
        </label>
        <button
          onClick={resetTimeline}
          className="btn px-3 py-2 bg-blue-600/80 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg"
        >
          Reset Board
        </button>
      </div>
    </div>
  );
};
