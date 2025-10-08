'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ChessboardSurface } from './ChessboardSurface';
import { DragPreviewLayer } from './DragPreviewLayer';
import { useBoardSquares } from '@/features/chessboard/hooks/useBoardSquares';
import { usePieceDrag } from '@/features/chessboard/hooks/usePieceDrag';
import { createScopedLogger } from '@/shared/utils/logger';

interface CustomChessboardProps {
  fen: string;
  orientation: 'white' | 'black';
  moveMode: boolean;
  boardSize: number;
  onMove: (from: string, to: string) => boolean;
}

export const CustomChessboard = ({ fen, orientation, moveMode, boardSize, onMove }: CustomChessboardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { squares, piecePixelSize } = useBoardSquares({ fen, orientation, boardSize });
  const { dragVisual, beginDrag } = usePieceDrag({
    boardRef,
    orientation,
    moveMode,
    onMove,
  });
  const renderLogger = useMemo(() => createScopedLogger('chessboard/render'), []);

  useEffect(() => {
    renderLogger.debug('render-state', {
      hasDragVisual: Boolean(dragVisual),
      dragSquare: dragVisual?.square ?? null,
      dragPosition: dragVisual?.position ?? null,
    });
  }, [dragVisual, renderLogger]);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) {
      renderLogger.debug('board-rect-missing-element');
      return;
    }

    const rect = boardElement.getBoundingClientRect();
    renderLogger.debug('board-rect', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });

    const previewElement = boardElement.querySelector('[data-preview-layer="true"]') as HTMLDivElement | null;
    if (previewElement) {
      const previewRect = previewElement.getBoundingClientRect();
      renderLogger.debug('board-preview-dom', {
        left: previewRect.left,
        top: previewRect.top,
        width: previewRect.width,
        height: previewRect.height,
      });
    } else {
      renderLogger.debug('board-preview-dom-missing', {
        hasDragVisual: Boolean(dragVisual),
      });
    }
  }, [boardSize, orientation, dragVisual, renderLogger]);

  return (
    <div
      ref={boardRef}
      className={`relative h-full w-full select-none overflow-hidden ${dragVisual ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ touchAction: 'none', userSelect: 'none' }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <ChessboardSurface
        squares={squares}
        piecePixelSize={piecePixelSize}
        dragSourceSquare={dragVisual?.square}
        onSquarePointerDown={beginDrag}
      />
      <DragPreviewLayer dragVisual={dragVisual} piecePixelSize={piecePixelSize} />
    </div>
  );
};





