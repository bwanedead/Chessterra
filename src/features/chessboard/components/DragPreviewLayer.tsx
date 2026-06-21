import { memo, useEffect, useMemo, useRef } from 'react';
import { ChessPieceSprite } from './ChessPieceSprite';
import type { DragVisual } from '@/features/chessboard/hooks/usePieceDrag';
import type { BoardAppearance } from '@/features/chessboard/themes/types';
import { createScopedLogger } from '@/shared/utils/logger';

interface DragPreviewLayerProps {
  dragVisual: DragVisual | null;
  piecePixelSize: number;
  appearance?: BoardAppearance;
}

export const DragPreviewLayer = memo(({ dragVisual, piecePixelSize, appearance }: DragPreviewLayerProps) => {
  const previewLogger = useMemo(() => createScopedLogger('chessboard/preview'), []);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasLoggedActiveRef = useRef(false);

  useEffect(() => {
    if (!dragVisual) {
      if (hasLoggedActiveRef.current) {
        hasLoggedActiveRef.current = false;
        previewLogger.debug('preview-hidden');
      }
      return;
    }

    if (hasLoggedActiveRef.current) {
      return;
    }

    hasLoggedActiveRef.current = true;
    requestAnimationFrame(() => {
      const element = elementRef.current;
      if (!element) {
        previewLogger.warn('preview-missing-element', { square: dragVisual.square });
        return;
      }

      const rect = element.getBoundingClientRect();
      const computedZ = window.getComputedStyle(element).zIndex;
      previewLogger.debug('preview-mounted', {
        square: dragVisual.square,
        position: dragVisual.position,
        pieceSize: piecePixelSize,
        boundingRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        zIndex: computedZ,
      });
    });
  }, [dragVisual, piecePixelSize, previewLogger]);

  if (!dragVisual) {
    return null;
  }

  return (
    <div
      ref={elementRef}
      className="pointer-events-none absolute z-50"
      style={{
        left: 0,
        top: 0,
        width: `${piecePixelSize}px`,
        height: `${piecePixelSize}px`,
        transform: `translate3d(${dragVisual.position.x}px, ${dragVisual.position.y}px, 0)`,
        zIndex: 512,
      }}
      data-preview-layer="true"
    >
      <ChessPieceSprite
        piece={dragVisual.piece}
        size={piecePixelSize}
        className={appearance?.mode === 'normalized' ? undefined : 'drop-shadow-2xl'}
        appearance={appearance}
      />
    </div>
  );
});

DragPreviewLayer.displayName = 'DragPreviewLayer';
