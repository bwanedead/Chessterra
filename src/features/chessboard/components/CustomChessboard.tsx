'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ChessboardSurface } from './ChessboardSurface';
import { DragPreviewLayer } from './DragPreviewLayer';
import type { BoardAppearance } from '@/features/chessboard/components/ChessboardSurface';
import { useBoardSquares } from '@/features/chessboard/hooks/useBoardSquares';
import { usePieceDrag } from '@/features/chessboard/hooks/usePieceDrag';
import { createScopedLogger } from '@/shared/utils/logger';

interface CustomChessboardProps {
  fen: string;
  orientation: 'white' | 'black';
  moveMode: boolean;
  boardSize: number;
  onMove: (from: string, to: string) => boolean;
  squareOverlays?: Record<string, { color: string; magnitude: number; maxWeight: number; strength: number }>;
  showPieces?: boolean;
  normalizedBoard?: boolean;
}

const CLASSIC_APPEARANCE: BoardAppearance = {
  mode: 'classic',
  lightSquare: '#f5deab',
  darkSquare: '#8b5a2b',
};

const NORMALIZED_APPEARANCE: BoardAppearance = {
  mode: 'normalized',
  lightSquare: '#000000',
  darkSquare: '#000000',
  wireframeColor: '#ffffff',
  backgroundColor: '#000000',
};

export const CustomChessboard = ({
  fen,
  orientation,
  moveMode,
  boardSize,
  onMove,
  squareOverlays,
  showPieces = true,
  normalizedBoard = false,
}: CustomChessboardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { squares, piecePixelSize } = useBoardSquares({ fen, orientation, boardSize });
  const { dragVisual, beginDrag } = usePieceDrag({
    boardRef,
    orientation,
    moveMode,
    onMove,
  });
  const renderLogger = useMemo(() => createScopedLogger('chessboard/render'), []);
  const layoutLogger = useMemo(() => createScopedLogger('chessboard/layout'), []);
  const activePreviewRef = useRef<string | null>(null);
  const previewIssueLoggedRef = useRef(false);
  const appearance = normalizedBoard ? NORMALIZED_APPEARANCE : CLASSIC_APPEARANCE;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const overlayCount = squareOverlays ? Object.keys(squareOverlays).length : 0;
      renderLogger.debug('square-overlays', { count: overlayCount });
    }

    const boardElement = boardRef.current;
    if (!boardElement) {
      return;
    }

    if (!dragVisual) {
      if (activePreviewRef.current) {
        renderLogger.debug('preview-cleared', { square: activePreviewRef.current });
      }
      activePreviewRef.current = null;
      previewIssueLoggedRef.current = false;
      return;
    }

    if (!activePreviewRef.current) {
      activePreviewRef.current = dragVisual.square;
      renderLogger.debug('preview-activated', { square: dragVisual.square });
    }

    const previewElement = boardElement.querySelector('[data-preview-layer="true"]') as HTMLDivElement | null;
    if (!previewElement) {
      if (!previewIssueLoggedRef.current) {
        previewIssueLoggedRef.current = true;
        renderLogger.warn('preview-dom-missing', { square: dragVisual.square });
      }
      return;
    }

    requestAnimationFrame(() => {
      const boardRect = boardElement.getBoundingClientRect();
      const previewRect = previewElement.getBoundingClientRect();
      const computedZ = window.getComputedStyle(previewElement).zIndex;

      const outsideBoard =
        previewRect.left < boardRect.left - 1 ||
        previewRect.top < boardRect.top - 1 ||
        previewRect.right > boardRect.right + 1 ||
        previewRect.bottom > boardRect.bottom + 1;

      const zIndexValue = Number.isNaN(Number(computedZ)) ? null : Number(computedZ);
      const lowZ = computedZ === 'auto' || (typeof zIndexValue === 'number' && zIndexValue < 100);

      if ((outsideBoard || lowZ) && !previewIssueLoggedRef.current) {
        previewIssueLoggedRef.current = true;
        renderLogger.warn('preview-visibility-risk', {
          square: dragVisual.square,
          position: dragVisual.position,
          previewRect,
          boardRect,
          computedZ,
        });
      }
    });
  }, [boardSize, dragVisual, orientation, renderLogger, squareOverlays]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const boardElement = boardRef.current;
    if (!boardElement) {
      layoutLogger.warn('container-missing');
      return;
    }

    const rect = boardElement.getBoundingClientRect();
    const style = window.getComputedStyle(boardElement);

    layoutLogger.debug('container-metrics', {
      normalizedBoard,
      boardSize,
      boundingClientRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      style: {
        position: style.position,
        overflow: style.overflow,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        zIndex: style.zIndex,
        mixBlendMode: style.mixBlendMode,
        backgroundColor: style.backgroundColor,
      },
    });
  }, [boardSize, layoutLogger, normalizedBoard]);

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
        squareOverlays={squareOverlays}
        showPieces={showPieces}
        appearance={appearance}
        boardSize={boardSize}
      />
      <DragPreviewLayer dragVisual={dragVisual} piecePixelSize={piecePixelSize} appearance={appearance} />
    </div>
  );
};





