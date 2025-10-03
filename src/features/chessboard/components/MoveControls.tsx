'use client';

import { useGameStore } from '@/shared/state/gameStore';

export const MoveControls = () => {
  const currentPly = useGameStore((state) => state.currentPly);
  const timelineLength = useGameStore((state) => state.timeline.positions.length);
  const setCurrentPly = useGameStore((state) => state.setCurrentPly);
  const hasTimeline = timelineLength > 1;
  const lastIndex = Math.max(timelineLength - 1, 0);

  const goToStart = () => setCurrentPly(0);
  const goToPrevious = () => setCurrentPly(Math.max(currentPly - 1, 0));
  const goToNext = () => setCurrentPly(Math.min(currentPly + 1, lastIndex));
  const goToEnd = () => setCurrentPly(lastIndex);

  return (
    <div className="flex gap-4 w-full max-w-[480px] justify-center mb-8">
      <button
        onClick={goToStart}
        disabled={!hasTimeline || currentPly === 0}
        className="p-2 bg-gray-700/70 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        </svg>
      </button>
      <button
        onClick={goToPrevious}
        disabled={!hasTimeline || currentPly === 0}
        className="btn px-5 py-3 bg-blue-600/80 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
      >
        Previous Move
      </button>
      <button
        onClick={goToNext}
        disabled={!hasTimeline || currentPly === lastIndex}
        className="btn px-5 py-3 bg-blue-600/80 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
      >
        Next Move
      </button>
      <button
        onClick={goToEnd}
        disabled={!hasTimeline || currentPly === lastIndex}
        className="p-2 bg-gray-700/70 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
      </button>
    </div>
  );
};
