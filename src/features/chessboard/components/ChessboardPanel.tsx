'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { appendMoveToTimeline } from '@/domain/game/timeline';
import { useGameStore } from '@/shared/state/gameStore';
import { usePreferencesStore } from '@/shared/state/preferencesStore';
import { createPieceComponents } from './createPieceComponents';
import { useBoardSize } from '@/features/chessboard/hooks/useBoardSize';
import { useActiveFen } from '@/features/chessboard/hooks/useActiveGame';
import { ChessboardStage } from '@/features/chessboard/components/ChessboardStage';
import { VisualizationToolbar } from '@/features/chessboard/components/VisualizationToolbar';
import '@/features/analysis/overlays/heatmapOverlayRegistration';

const Chessboard = dynamic(() => import('react-chessboard').then((mod) => mod.Chessboard), {
  ssr: false,
}) as typeof import('react-chessboard').Chessboard;

export const ChessboardPanel = () => {
  const fen = useActiveFen();
  const timeline = useGameStore((state) => state.timeline);
  const currentPly = useGameStore((state) => state.currentPly);
  const setTimeline = useGameStore((state) => state.setTimeline);
  const moveMode = usePreferencesStore((state) => state.moveMode);
  const boardOrientation = usePreferencesStore((state) => state.boardOrientation);
  const boardWidth = useBoardSize();

  const customPieces = useMemo(() => createPieceComponents(), []);

  const handleDrop = (sourceSquare: string, targetSquare: string) => {
    if (!moveMode) {
      return false;
    }

    const game = new Chess(fen);
    const piece = game.get(sourceSquare as Square);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare.endsWith('8')) ||
        (piece.color === 'b' && targetSquare.endsWith('1')));

    let move;
    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare,
        ...(isPromotion ? { promotion: 'q' as const } : {}),
      });
    } catch (error) {
      console.warn('Ignoring invalid move attempt', error);
      return false;
    }

    if (!move) {
      return false;
    }

    const updatedTimeline = appendMoveToTimeline(timeline, move, game.fen(), currentPly);
    setTimeline(updatedTimeline);
    return true;
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="flex w-full justify-center lg:w-auto">
        <ChessboardStage fen={fen} orientation={boardOrientation} boardSize={boardWidth}>
          <Chessboard
            id="ChessterraChessboard"
            position={fen}
            boardWidth={boardWidth}
            customBoardStyle={{
              borderRadius: '1rem',
              boxShadow: '0 4px 24px -3px rgba(0, 0, 0, 0.4)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#8B5A2B' }}
            customLightSquareStyle={{ backgroundColor: '#F5DEB3' }}
            customPieces={customPieces}
            arePiecesDraggable={moveMode}
            boardOrientation={boardOrientation}
            onPieceDrop={handleDrop}
            animationDuration={180}
            snapToCursor
          />
        </ChessboardStage>
      </div>
      <VisualizationToolbar />
    </div>
  );
};
