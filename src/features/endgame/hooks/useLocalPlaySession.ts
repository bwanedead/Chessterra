'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import '@/domain/board-rules';
import '@/domain/play/time-control';
import { getFenFromSnapshot } from '@/domain/board-core/fenCodec';
import type { ApplyResult } from '@/domain/board-core/types';
import {
  buildBoardViewModel,
  type BoardSessionConfig,
  type BoardSessionState,
  type ProgressMessage,
} from '@/domain/board-session';
import {
  createLocalMatchState,
  createPhase0PlayConfig,
  reduceLocalMatch,
  type LocalMatchEvent,
  type LocalMatchState,
  type LocalPlayConfig,
} from '@/domain/endgame/play';
import { useBoardSession } from '@/features/board/hooks/useBoardSession';
import type { PieceColor } from '@/features/chessboard/types';
import { useGameClock } from './useGameClock';

export interface LocalPlaySessionOptions {
  config?: Partial<LocalPlayConfig>;
}

export interface BoardProgressPayload {
  message: ProgressMessage;
  fen: string | null;
  lastMove?: { from: string; to: string };
}

export interface LocalPlaySession {
  config: LocalPlayConfig;
  matchState: LocalMatchState;
  boardState: BoardSessionState;
  apply: (message: ProgressMessage) => ApplyResult;
  commitMove: (from: string, to: string, promotion?: string) => ApplyResult;
  dispatchMatch: (event: LocalMatchEvent) => void;
  handleBoardProgress: (payload: BoardProgressPayload) => void;
  reset: () => void;
  resign: () => void;
  canPlayerMove: boolean;
  activeColor: PieceColor;
  isTerminal: boolean;
  orientation: 'white' | 'black';
}

const boardConfigFromPlay = (config: LocalPlayConfig): BoardSessionConfig => ({
  rulesetId: config.rulesetId,
  fen: config.fen,
});

const readActiveColor = (boardState: BoardSessionState): PieceColor => {
  const metaColor = boardState.snapshot.graph.meta.activeColor;
  return metaColor === 'b' ? 'b' : 'w';
};

export const useLocalPlaySession = (
  options: LocalPlaySessionOptions = {},
): LocalPlaySession => {
  const config = useMemo(() => createPhase0PlayConfig(options.config), [options.config]);
  const boardConfig = useMemo(() => boardConfigFromPlay(config), [config]);

  const { state: boardState, apply, resetSession, getSession } = useBoardSession(boardConfig);
  const [matchState, dispatchMatch] = useReducer(
    reduceLocalMatch,
    config,
    (playConfig) => createLocalMatchState(playConfig, 'w'),
  );

  const matchRef = useRef(matchState);
  matchRef.current = matchState;

  useGameClock(matchState, dispatchMatch);

  const activeColor = readActiveColor(boardState);
  const isTerminal = boardState.outcome.kind === 'terminal' || matchState.phase === 'completed';
  const isPlayersTurn = activeColor === config.playerColor;
  const canPlayerMove =
    !isTerminal && isPlayersTurn && (matchState.phase === 'ready' || matchState.phase === 'active');

  const syncMoveToMatch = useCallback(
    (mover: PieceColor) => {
      const now = Date.now();
      const outcome = getSession().getState().outcome;

      if (matchRef.current.phase === 'ready') {
        dispatchMatch({ type: 'START', at: now, activeColor: mover });
      }

      dispatchMatch({
        type: 'MOVE_COMMITTED',
        mover,
        at: now,
        outcome,
      });
    },
    [getSession],
  );

  const commitMove = useCallback(
    (from: string, to: string, promotion?: string): ApplyResult => {
      const mover = matchRef.current.clock.activeColor;
      const result = apply({ type: 'move', from, to, promotion });
      if (result.ok) {
        syncMoveToMatch(mover);
      }
      return result;
    },
    [apply, syncMoveToMatch],
  );

  const handleBoardProgress = useCallback(
    (payload: BoardProgressPayload) => {
      if (payload.message.type !== 'move') {
        return;
      }
      syncMoveToMatch(matchRef.current.clock.activeColor);
    },
    [syncMoveToMatch],
  );

  const reset = useCallback(() => {
    const excludeIds = matchRef.current.positionId ? [matchRef.current.positionId] : [];
    const nextConfig = createPhase0PlayConfig(options.config, excludeIds);
    resetSession(boardConfigFromPlay(nextConfig));
    dispatchMatch({
      type: 'RESET',
      config: nextConfig,
      at: Date.now(),
      activeColor: 'w',
    });
  }, [options.config, resetSession]);

  const resign = useCallback(() => {
    if (matchRef.current.phase === 'completed') {
      return;
    }
    dispatchMatch({ type: 'RESIGN', color: config.playerColor });
  }, [config.playerColor]);

  const orientation = config.playerColor === 'b' ? 'black' : 'white';

  return {
    config,
    matchState,
    boardState,
    apply,
    commitMove,
    dispatchMatch,
    handleBoardProgress,
    reset,
    resign,
    canPlayerMove,
    activeColor,
    isTerminal,
    orientation,
  };
};

export const useLocalPlayBoardView = (
  boardState: BoardSessionState,
  playerColor: PieceColor,
  canPlayerMove: boolean,
) =>
  useMemo(() => {
    const perspective = canPlayerMove ? playerColor : null;
    return buildBoardViewModel(boardState, perspective);
  }, [boardState, canPlayerMove, playerColor]);

export const getBoardDisplayFen = (boardState: BoardSessionState): string =>
  getFenFromSnapshot(boardState.snapshot) ?? '';
