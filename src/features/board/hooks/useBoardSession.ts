'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  BoardSession,
  buildBoardViewModel,
  createBoardSession,
  type BoardSessionConfig,
  type BoardSessionState,
  type ProgressMessage,
} from '@/domain/board-session';

export const useBoardSession = (config: BoardSessionConfig) => {
  const configRef = useRef(config);
  const sessionRef = useRef<BoardSession | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  if (!sessionRef.current) {
    sessionRef.current = createBoardSession(configRef.current);
  }

  const subscribe = useCallback(
    (listener: () => void) => sessionRef.current!.subscribe(() => listener()),
    [sessionKey],
  );

  const getSnapshot = useCallback(() => sessionRef.current!.getState(), [sessionKey]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const apply = useCallback(
    (message: ProgressMessage) => sessionRef.current!.apply(message),
    [sessionKey],
  );

  const resetSession = useCallback((nextConfig: BoardSessionConfig) => {
    configRef.current = nextConfig;
    sessionRef.current = createBoardSession(nextConfig);
    setSessionKey((value) => value + 1);
  }, []);

  const getSession = useCallback(() => sessionRef.current!, [sessionKey]);

  return { state, apply, resetSession, getSession };
};

export const useBoardViewModel = (
  state: BoardSessionState,
  perspective: 'w' | 'b' | null = null,
) => useMemo(() => buildBoardViewModel(state, perspective), [state, perspective]);
