'use client';

import { useEffect, useState } from 'react';
import { UniversalBoard } from '@/features/board';
import type { FenString } from '@/domain/play/chess/types';
import type { LastMove } from '@/features/chessboard/interaction/types';

export interface PlayBoardProps {
  fen: FenString;
  orientation?: 'white' | 'black';
  boardSize: number;
  playerColor?: 'w' | 'b' | null;
  themeId?: string;
  rulesetId?: string;
  moveMode?: boolean;
  onFenChange?: (fen: FenString, lastMove: LastMove) => void;
}

/** Thin Phase 0 wrapper — prefer UniversalBoard for ruleset/message APIs. */
export const PlayBoard = ({
  fen: fenProp,
  orientation = 'white',
  boardSize,
  playerColor = 'w',
  themeId = 'endgame-slate',
  rulesetId = 'standard-fide',
  moveMode = true,
  onFenChange,
}: PlayBoardProps) => {
  const [fen, setFen] = useState(fenProp);

  useEffect(() => {
    setFen(fenProp);
  }, [fenProp]);

  return (
    <UniversalBoard
      rulesetId={rulesetId}
      fen={fen}
      boardSize={boardSize}
      orientation={orientation}
      playerColor={playerColor}
      themeId={themeId}
      moveMode={moveMode}
      onProgress={({ fen: nextFen, lastMove }) => {
        if (nextFen) {
          setFen(nextFen);
          onFenChange?.(nextFen, lastMove ?? { from: '', to: '' });
        }
      }}
    />
  );
};
