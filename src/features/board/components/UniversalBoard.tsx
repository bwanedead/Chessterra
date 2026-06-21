'use client';

import { useEffect, useRef } from 'react';
import '@/domain/board-rules';
import { graphFromFen } from '@/domain/board-core/fenCodec';
import type { RulesetId } from '@/domain/board-core/types';
import type { ProgressMessage } from '@/domain/board-session';
import { useBoardSession } from '../hooks/useBoardSession';
import { BoardSessionView } from './BoardSessionView';

export interface UniversalBoardProps {
  rulesetId?: string;
  fen: string;
  boardSize: number;
  orientation?: 'white' | 'black';
  playerColor?: 'w' | 'b' | null;
  themeId?: string;
  moveMode?: boolean;
  onProgress?: (payload: {
    message: ProgressMessage;
    fen: string | null;
    lastMove?: { from: string; to: string };
  }) => void;
}

export const UniversalBoard = ({
  rulesetId = 'standard-fide',
  fen,
  boardSize,
  orientation = 'white',
  playerColor = 'w',
  themeId = 'endgame-slate',
  moveMode = true,
  onProgress,
}: UniversalBoardProps) => {
  const { state, apply } = useBoardSession({ rulesetId, fen });
  const externalFenRef = useRef(fen);

  useEffect(() => {
    if (externalFenRef.current === fen) {
      return;
    }
    externalFenRef.current = fen;
    apply({
      type: 'load',
      snapshot: graphFromFen(fen, rulesetId as RulesetId),
    });
  }, [apply, fen, rulesetId]);

  return (
    <BoardSessionView
      state={state}
      apply={apply}
      boardSize={boardSize}
      orientation={orientation}
      playerColor={playerColor}
      themeId={themeId}
      moveMode={moveMode}
      onProgress={onProgress}
    />
  );
};
