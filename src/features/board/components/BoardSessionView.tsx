'use client';

import { useCallback, useMemo, useState } from 'react';
import '@/domain/board-rules';
import { getFenFromSnapshot } from '@/domain/board-core/fenCodec';
import type { ProgressMessage } from '@/domain/board-session';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';
import {
  buildInteractionHighlights,
  type LastMove,
} from '@/features/chessboard/interaction';
import type { PieceColor } from '@/features/chessboard/types';
import type { BoardSessionState } from '@/domain/board-session';
import type { ApplyResult } from '@/domain/board-core/types';
import { useBoardViewModel } from '../hooks/useBoardSession';

export interface BoardSessionViewProps {
  state: BoardSessionState;
  apply: (message: ProgressMessage) => ApplyResult;
  boardSize: number;
  orientation?: 'white' | 'black';
  playerColor?: PieceColor | null;
  themeId?: string;
  moveMode?: boolean;
  onProgress?: (payload: {
    message: ProgressMessage;
    fen: string | null;
    lastMove?: { from: string; to: string };
  }) => void;
}

export const BoardSessionView = ({
  state,
  apply,
  boardSize,
  orientation = 'white',
  playerColor = 'w',
  themeId = 'endgame-slate',
  moveMode = true,
  onProgress,
}: BoardSessionViewProps) => {
  const viewModel = useBoardViewModel(state, playerColor ?? null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const displayFen = viewModel.fen ?? getFenFromSnapshot(state.snapshot) ?? '';
  const lastMove: LastMove | null = viewModel.lastMove;

  const legalTargets = useMemo(() => {
    if (!selectedSquare) {
      return [];
    }
    return viewModel.legalTargetsByFrom[selectedSquare] ?? [];
  }, [selectedSquare, viewModel.legalTargetsByFrom]);

  const interactionHighlights = useMemo(
    () => buildInteractionHighlights(selectedSquare, legalTargets, lastMove, null),
    [lastMove, legalTargets, selectedSquare],
  );

  const commitMove = useCallback(
    (from: string, to: string): boolean => {
      const message: ProgressMessage = { type: 'move', from, to };
      const result = apply(message);
      if (result.ok) {
        setSelectedSquare(null);
        const nextFen = result.snapshot ? getFenFromSnapshot(result.snapshot) : null;
        onProgress?.({ message, fen: nextFen, lastMove: { from, to } });
      }
      return result.ok;
    },
    [apply, onProgress],
  );

  const handleSquareActivate = useCallback(
    (square: string, pieceColor?: PieceColor) => {
      if (viewModel.terminal) {
        return;
      }
      if (selectedSquare && legalTargets.includes(square)) {
        commitMove(selectedSquare, square);
        return;
      }
      if (pieceColor && (playerColor === null || pieceColor === playerColor)) {
        setSelectedSquare((current) => (current === square ? null : square));
        return;
      }
      if (selectedSquare) {
        setSelectedSquare(null);
      }
    },
    [commitMove, legalTargets, playerColor, selectedSquare, viewModel.terminal],
  );

  return (
    <CustomChessboard
      fen={displayFen}
      orientation={orientation}
      moveMode={moveMode && !viewModel.terminal}
      boardSize={boardSize}
      onMove={commitMove}
      themeId={themeId}
      interactionHighlights={interactionHighlights}
      onSquareActivate={handleSquareActivate}
    />
  );
};
