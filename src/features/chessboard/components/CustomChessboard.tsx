'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ChessboardSurface } from './ChessboardSurface';
import { DragPreviewLayer } from './DragPreviewLayer';
import { ChessPieceSprite } from './ChessPieceSprite';
import type { BoardAppearance } from '@/features/chessboard/components/ChessboardSurface';
import { useBoardSquares } from '@/features/chessboard/hooks/useBoardSquares';
import { usePieceDrag } from '@/features/chessboard/hooks/usePieceDrag';
import { createScopedLogger, layoutDebugEnabled } from '@/shared/utils/logger';
import { FILES } from '@/lib/chessboard/boardState';
import type { PieceColor, PromotionPieceType } from '@/features/chessboard/types';
import type { SquareOverlayDescriptor } from '@/features/chessboard/overlays/schemes';

interface PromotionOverlayConfig {
  square: string;
  color: PieceColor;
  onSelect: (piece: PromotionPieceType) => void;
  onCancel?: () => void;
}

interface CustomChessboardProps {
  fen: string;
  orientation: 'white' | 'black';
  moveMode: boolean;
  boardSize: number;
  onMove: (from: string, to: string) => boolean;
  squareOverlays?: Record<string, SquareOverlayDescriptor>;
  showPieces?: boolean;
  normalizedBoard?: boolean;
  showIntensityLabels?: boolean;
  promotionRequest?: PromotionOverlayConfig;
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

type PromotionOptionConfig = {
  value: PromotionPieceType;
  label: string;
  hotkeys: string[];
  shortcut: string;
};

const PROMOTION_OPTIONS: PromotionOptionConfig[] = [
  { value: 'q', label: 'Queen', hotkeys: ['q', '1'], shortcut: '1' },
  { value: 'r', label: 'Rook', hotkeys: ['r', '2'], shortcut: '2' },
  { value: 'n', label: 'Knight', hotkeys: ['n', 'k', '3'], shortcut: '3' },
  { value: 'b', label: 'Bishop', hotkeys: ['b', '4'], shortcut: '4' },
];

interface PromotionSelectionOverlayProps extends PromotionOverlayConfig {
  boardSize: number;
  orientation: 'white' | 'black';
}

const PromotionSelectionOverlay = ({
  square,
  color,
  boardSize,
  orientation,
  onSelect,
  onCancel,
}: PromotionSelectionOverlayProps) => {
  const normalizedSquare = square.toLowerCase();
  const fileChar = normalizedSquare[0];
  const fileIndex = FILES.indexOf(fileChar as (typeof FILES)[number]);
  const rank = Number.parseInt(normalizedSquare.slice(1), 10);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        event.preventDefault();
        onCancel?.();
        return;
      }

      const match = PROMOTION_OPTIONS.find((option) => option.hotkeys.includes(key));
      if (match) {
        event.preventDefault();
        onSelect(match.value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onSelect]);

  if (fileIndex === -1 || Number.isNaN(rank)) {
    return null;
  }

  const squareSize = boardSize / 8;
  const column = orientation === 'white' ? fileIndex : 7 - fileIndex;
  const row = orientation === 'white' ? 8 - rank : rank - 1;
  const left = column * squareSize + squareSize / 2;
  const top = row * squareSize;
  const showAbove =
    (orientation === 'white' && color === 'w') || (orientation === 'black' && color === 'b');
  const transform = showAbove
    ? 'translate(-50%, calc(-100% - 12px))'
    : 'translate(-50%, calc(100% + 12px))';

  return (
    <div className="pointer-events-none absolute z-[120]" style={{ left, top }}>
      <div
        className="pointer-events-auto rounded-full border border-slate-500/70 bg-slate-900/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.65)] backdrop-blur-sm"
        style={{ transform }}
        role="dialog"
        aria-label="Select promotion piece"
      >
        <div className="flex items-center gap-3">
          {PROMOTION_OPTIONS.map((option) => {
            const shortcutHint = option.shortcut;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/70 pb-2 transition hover:border-sky-300 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label={`Promote to ${option.label} (press ${shortcutHint})`}
              >
                <ChessPieceSprite
                  piece={{ color, type: option.value }}
                  size={32}
                  className="pointer-events-none"
                />
                <span className="pointer-events-none absolute -bottom-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400 transition group-hover:text-sky-200">
                  {shortcutHint}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  showIntensityLabels = false,
  promotionRequest,
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
    if (!layoutDebugEnabled) {
      return;
    }

    renderLogger.debug('board-size-props', {
      boardSize,
      normalizedBoard,
    });
  }, [boardSize, normalizedBoard, renderLogger, layoutDebugEnabled]);
  useEffect(() => {
    if (layoutDebugEnabled) {
      const overlayCount = squareOverlays ? Object.keys(squareOverlays).length : 0;
      renderLogger.debug('square-overlays', { count: overlayCount });
    }

    const boardElement = boardRef.current;
    if (!boardElement) {
      return;
    }

    if (!dragVisual) {
      if (activePreviewRef.current && layoutDebugEnabled) {
        renderLogger.debug('preview-cleared', { square: activePreviewRef.current });
      }
      activePreviewRef.current = null;
      previewIssueLoggedRef.current = false;
      return;
    }

    if (!activePreviewRef.current) {
      activePreviewRef.current = dragVisual.square;
      if (layoutDebugEnabled) {
        renderLogger.debug('preview-activated', { square: dragVisual.square });
      }
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
    const overlayEntries = squareOverlays ? Object.entries(squareOverlays) : [];
    const overlayCount = overlayEntries.length;
    const segmentedEntries = overlayEntries.filter(([, descriptor]) => descriptor.style.kind === 'segmented');
    const segmentedSample = segmentedEntries
      .slice(0, 3)
      .map(([square, descriptor]) => {
        if (descriptor.style.kind !== 'segmented') {
          return square;
        }
        const [whiteSegment, blackSegment] = descriptor.style.segments;
        return `${square}:${whiteSegment.label}/${blackSegment.label}:${descriptor.style.label ?? ''}`;
      })
      .join(', ');
    const sample = overlayEntries
      .slice(0, 5)
      .map(([square, descriptor]) => {
        const { style } = descriptor;
        const intensity = style.kind === 'segmented' ? style.intensity : style.intensity;
        const contributors = descriptor.meta?.count ?? descriptor.meta?.contested?.totalContributors ?? 'n/a';
        return `${square}:${style.kind}:${contributors}@${intensity?.toFixed?.(2) ?? 'n/a'}`;
      })
      .join(', ');
    console.log(
      `custom-chessboard-overlays count=${overlayCount} segmented=${segmentedEntries.length} segSample=${segmentedSample || '(none)'} sample=${sample}`,
    );
  }, [squareOverlays]);

  useEffect(() => {
    if (!layoutDebugEnabled) {
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
  }, [boardSize, layoutDebugEnabled, layoutLogger, normalizedBoard]);

  return (
    <div
      className={`relative h-full w-full select-none ${dragVisual ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ touchAction: 'none', userSelect: 'none' }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={boardRef} className="relative h-full w-full overflow-hidden">
        <ChessboardSurface
          squares={squares}
          piecePixelSize={piecePixelSize}
          dragSourceSquare={dragVisual?.square}
          onSquarePointerDown={beginDrag}
          squareOverlays={squareOverlays}
          showPieces={showPieces}
          appearance={appearance}
          boardSize={boardSize}
          showIntensityLabels={showIntensityLabels}
        />
        <DragPreviewLayer dragVisual={dragVisual} piecePixelSize={piecePixelSize} appearance={appearance} />
      </div>
      {promotionRequest ? (
        <PromotionSelectionOverlay
          square={promotionRequest.square}
          color={promotionRequest.color}
          boardSize={boardSize}
          orientation={orientation}
          onSelect={promotionRequest.onSelect}
          onCancel={promotionRequest.onCancel}
        />
      ) : null}
    </div>
  );
};





