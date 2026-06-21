'use client';

import { useEffect, useRef } from 'react';
import type { LocalMatchEvent, LocalMatchState } from '@/domain/endgame/play';

const TICK_INTERVAL_MS = 100;

/** Mechanical clock driver — dispatches domain CLOCK_TICK events while the match is active. */
export const useGameClock = (
  matchState: LocalMatchState,
  dispatch: (event: LocalMatchEvent) => void,
): void => {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (matchState.phase !== 'active' || !matchState.clock.running) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      dispatchRef.current({ type: 'CLOCK_TICK', at: Date.now() });
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [matchState.phase, matchState.clock.running, matchState.clock.activeColor]);
};
