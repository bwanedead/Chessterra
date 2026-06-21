'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  BoardSession,
  buildBoardViewModel,
  createBoardSession,
  type BoardSessionConfig,
  type BoardSessionState,
  type ProgressMessage,
} from '@/domain/board-session';

export const useBoardSession = (config: BoardSessionConfig) => {
  const sessionRef = useRef<BoardSession | null>(null);

  if (!sessionRef.current) {
    sessionRef.current = createBoardSession(config);
  }

  const session = sessionRef.current;

  const subscribe = useCallback(
    (listener: () => void) => session.subscribe(() => listener()),
    [session],
  );

  const getSnapshot = useCallback(() => session.getState(), [session]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const apply = useCallback(
    (message: ProgressMessage) => session.apply(message),
    [session],
  );

  const reload = useCallback(
    (nextConfig: Partial<BoardSessionConfig>) => {
      sessionRef.current = createBoardSession({
        rulesetId: nextConfig.rulesetId ?? config.rulesetId,
        fen: nextConfig.fen ?? config.fen,
        snapshot: nextConfig.snapshot ?? config.snapshot,
      });
    },
    [config],
  );

  return { session, state, apply, reload };
};

export const useBoardViewModel = (
  state: BoardSessionState,
  perspective: 'w' | 'b' | null = null,
) => useMemo(() => buildBoardViewModel(state, perspective), [state, perspective]);
