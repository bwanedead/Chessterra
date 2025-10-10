import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import { FILES } from '@/lib/chessboard/boardState';
import { createScopedLogger } from '@/shared/utils/logger';

interface UsePieceDragParams {
  boardRef: RefObject<HTMLDivElement | null>;
  orientation: 'white' | 'black';
  moveMode: boolean;
  onMove: (from: string, to: string) => boolean;
}

export interface DragVisual {
  square: string;
  piece: ChessPieceDescriptor;
  position: { x: number; y: number };
}

interface ActiveDrag {
  piece: ChessPieceDescriptor;
  from: string;
  offset: { x: number; y: number };
  boardRect: DOMRect;
}

const interactionLogger = createScopedLogger('chessboard/interaction');

const getSquareFromCoordinates = (
  clientX: number,
  clientY: number,
  boardRect: DOMRect,
  orientation: 'white' | 'black',
): string | null => {
  const squareSize = boardRect.width / 8;
  const relativeX = clientX - boardRect.left;
  const relativeY = clientY - boardRect.top;

  if (relativeX < 0 || relativeY < 0 || relativeX > boardRect.width || relativeY > boardRect.height) {
    return null;
  }

  const fileIndex = Math.floor(relativeX / squareSize);
  const rankIndex = Math.floor(relativeY / squareSize);

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null;
  }

  const file = orientation === 'white' ? FILES[fileIndex] : FILES[7 - fileIndex];
  const rank = orientation === 'white' ? 8 - rankIndex : rankIndex + 1;
  return `${file}${rank}`;
};

const computePreviewPosition = (clientX: number, clientY: number, dragMeta: ActiveDrag) => ({
  x: clientX - dragMeta.boardRect.left - dragMeta.offset.x,
  y: clientY - dragMeta.boardRect.top - dragMeta.offset.y,
});

const dragTraceEnabled = process.env.NEXT_PUBLIC_DEBUG_DRAG === 'true';

const logInteraction = (eventName: string, payload: Record<string, unknown>) => {
  if (!dragTraceEnabled) {
    return;
  }
  interactionLogger.debug(eventName, payload);
};

export const usePieceDrag = ({ boardRef, orientation, moveMode, onMove }: UsePieceDragParams) => {
  const pointerIdRef = useRef<number | null>(null);
  const latestPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragMetaRef = useRef<ActiveDrag | null>(null);
  const orientationRef = useRef(orientation);
  const onMoveRef = useRef(onMove);
  const moveModeRef = useRef(moveMode);

  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);

  orientationRef.current = orientation;
  onMoveRef.current = onMove;
  moveModeRef.current = moveMode;

  const flushPreviewPosition = useCallback(() => {
    animationFrameRef.current = null;
    const nextPosition = pendingPositionRef.current;
    pendingPositionRef.current = null;
    if (!nextPosition) {
      return;
    }

    setDragVisual((current) => {
      if (!current) {
        return current;
      }
      const nextVisual = {
        ...current,
        position: nextPosition,
      };
      return nextVisual;
    });
  }, []);

  const schedulePreviewSync = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(flushPreviewPosition);
    }
  }, [flushPreviewPosition]);

  const clearAnimationFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      latestPositionRef.current = { x: event.clientX, y: event.clientY };

      const dragMeta = dragMetaRef.current;
      if (!dragMeta) {
        return;
      }

      const nextPosition = computePreviewPosition(event.clientX, event.clientY, dragMeta);
      pendingPositionRef.current = nextPosition;
      schedulePreviewSync();

      logInteraction('drag-position', {
        from: dragMeta.from,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        transform: nextPosition,
      });
    };

    const finalizeDrag = (event: PointerEvent, resetMeta: boolean) => {
      pointerIdRef.current = null;
      latestPositionRef.current = null;
      if (resetMeta) {
        dragMetaRef.current = null;
      }

      clearAnimationFrame();
      pendingPositionRef.current = null;
      setDragVisual(null);

      logInteraction('drag-visual-cleared', {
        pointerId: event.pointerId,
        resetMeta,
      });

      return resetMeta;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      const dragMeta = dragMetaRef.current;
      finalizeDrag(event, true);

      if (!dragMeta) {
        logInteraction('drag-end-without-meta', { pointerId: event.pointerId });
        return;
      }

      const targetSquare = getSquareFromCoordinates(
        event.clientX,
        event.clientY,
        dragMeta.boardRect,
        orientationRef.current,
      );

      if (!targetSquare) {
        logInteraction('drag-drop-ignored', {
          reason: 'target-out-of-board',
          from: dragMeta.from,
        });
        return;
      }

      if (moveModeRef.current && targetSquare && targetSquare !== dragMeta.from) {
        const moved = onMoveRef.current(dragMeta.from, targetSquare);
        if (!moved) {
          logInteraction('drop-rejected-by-game', { from: dragMeta.from, targetSquare });
        } else {
          logInteraction('drop-accepted', { from: dragMeta.from, targetSquare });
        }
        return;
      }

      if (!moveModeRef.current) {
        logInteraction('drop-canceled-move-mode-disabled', { from: dragMeta.from, targetSquare });
        return;
      }

      logInteraction('drop-canceled-same-square', { from: dragMeta.from });
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      finalizeDrag(event, true);
    };

    window.addEventListener('pointermove', handlePointerMove, { capture: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerCancel, { capture: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handlePointerCancel, { capture: true });
    };
  }, [clearAnimationFrame, schedulePreviewSync]);

  const beginDrag = useCallback(
    (squareId: string, piece: ChessPieceDescriptor, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        logInteraction('drag-start-blocked', {
          reason: 'non-primary-button',
          pointerId: event.pointerId,
          squareId,
        });
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      pointerIdRef.current = event.pointerId;

      const squareRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const boardElement = boardRef.current;
      if (!boardElement) {
        return;
      }
      const boardRect = boardElement.getBoundingClientRect();
      const offset = {
        x: event.clientX - squareRect.left,
        y: event.clientY - squareRect.top,
      };

      latestPositionRef.current = { x: event.clientX, y: event.clientY };
      const dragMeta: ActiveDrag = { piece, from: squareId, offset, boardRect };
      dragMetaRef.current = dragMeta;

      const position = computePreviewPosition(event.clientX, event.clientY, dragMeta);
      pendingPositionRef.current = position;
      setDragVisual({ square: squareId, piece, position });

      logInteraction('drag-begin', {
        pointerId: event.pointerId,
        square: squareId,
        piece,
        boardRect: {
          left: boardRect.left,
          top: boardRect.top,
          width: boardRect.width,
          height: boardRect.height,
        },
        offset,
        initialPosition: position,
        moveModeEnabled: moveModeRef.current,
      });
    },
    [boardRef],
  );

  const cancelDrag = useCallback(() => {
    pointerIdRef.current = null;
    latestPositionRef.current = null;
    dragMetaRef.current = null;
    pendingPositionRef.current = null;
    clearAnimationFrame();
    setDragVisual(null);
    logInteraction('drag-cancelled', {});
  }, [clearAnimationFrame]);

  return {
    dragVisual,
    beginDrag,
    cancelDrag,
  };
};
