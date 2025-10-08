import { memo, useEffect, useMemo, useRef } from 'react';
import { ChessPieceSprite } from './ChessPieceSprite';
import type { DragVisual } from '@/features/chessboard/hooks/usePieceDrag';
import { createScopedLogger } from '@/shared/utils/logger';

interface DragPreviewLayerProps {
  dragVisual: DragVisual | null;
  piecePixelSize: number;
}

export const DragPreviewLayer = memo(({ dragVisual, piecePixelSize }: DragPreviewLayerProps) => {
  const previewLogger = useMemo(() => createScopedLogger('chessboard/preview'), []);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dragVisual) {
      previewLogger.debug('preview-hidden');
      return;
    }

    const element = elementRef.current;
    if (!element) {
      previewLogger.debug('preview-missing-element', { dragVisual });
      return;
    }

    const rect = element.getBoundingClientRect();
    previewLogger.debug('preview-render', {
      square: dragVisual.square,
      position: dragVisual.position,
      pieceSize: piecePixelSize,
      boundingRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
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
      }}
      data-preview-layer="true"
    >
      <ChessPieceSprite piece={dragVisual.piece} size={piecePixelSize} className="drop-shadow-2xl" />
    </div>
  );
});

DragPreviewLayer.displayName = 'DragPreviewLayer';
