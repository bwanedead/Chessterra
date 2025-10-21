import { memo, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChessboardSquare } from './ChessboardSquare';
import { ChessPieceSprite } from './ChessPieceSprite';
import { BoardLayerStack } from './layers/BoardLayerStack';
import { BoardLayer } from './layers/BoardLayer';
import { NormalizedGridOverlay } from './layers/NormalizedGridOverlay';
import type { BoardSquare, ChessPieceDescriptor } from '@/features/chessboard/types';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { createScopedLogger, layoutDebugEnabled } from '@/shared/utils/logger';
import type { SquareOverlayDescriptor } from '@/features/chessboard/overlays/schemes';

export interface BoardAppearance {
  mode: 'classic' | 'normalized';
  lightSquare: string;
  darkSquare: string;
  wireframeColor?: string;
  backgroundColor?: string;
}

interface ChessboardSurfaceProps {
  squares: BoardSquare[];
  piecePixelSize: number;
  dragSourceSquare?: string;
  boardSize: number;
  onSquarePointerDown: (
    squareId: string,
    piece: ChessPieceDescriptor,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  squareOverlays?: Record<string, SquareOverlayDescriptor>;
  showPieces?: boolean;
  appearance: BoardAppearance;
  showIntensityLabels?: boolean;
}

export const ChessboardSurface = memo(
  ({
    squares,
    piecePixelSize,
    dragSourceSquare,
    onSquarePointerDown,
    squareOverlays,
    showPieces = true,
    appearance,
    boardSize,
    showIntensityLabels = false,
  }: ChessboardSurfaceProps) => {
    const surfaceLogger = useMemo(() => createScopedLogger('chessboard/surface'), []);
    const stackRef = useRef<HTMLDivElement | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const lastLoggedModeRef = useRef<string | null>(null);
    const normalized = appearance.mode === 'normalized';
    const wireframeColor = appearance.wireframeColor ?? '#ffffff';
    const boardBackground = appearance.backgroundColor ?? (normalized ? '#000000' : undefined);
    const estimatedSquareSize = normalized ? Math.max(1, Math.round((piecePixelSize || 1) / 0.9)) : 0;
    const innerLineThickness = normalized ? Math.max(1, Math.round(estimatedSquareSize * 0.02)) : 0;
    const edgeThickness = normalized ? Math.max(2, innerLineThickness * 2) : 0;

    const toRgba = (color: string, alpha: number) => {
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const normalizedHex =
          hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex;
        const bigint = parseInt(normalizedHex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      return color;
    };

    const gridColor = toRgba(wireframeColor, normalized ? 0.22 : 0.28);
    const edgeColor = toRgba(wireframeColor, normalized ? 0.4 : 0.6);
    const diagnosticsEnabled = layoutDebugEnabled;

    useLayerDiagnostics({
      ref: stackRef,
      logger: surfaceLogger,
      label: 'layer-stack',
      enabled: diagnosticsEnabled,
      dependencies: [normalized, boardBackground],
    });

    useLayerDiagnostics({
      ref: gridRef,
      logger: surfaceLogger,
      label: 'grid-layer',
      enabled: diagnosticsEnabled,
      dependencies: [squares.length, piecePixelSize, appearance.mode],
    });

    useEffect(() => {
      if (!layoutDebugEnabled || !normalized) {
        return;
      }

      surfaceLogger.debug('normalized-grid-metrics', {
        piecePixelSize,
        estimatedSquareSize,
        innerLineThickness,
        edgeThickness,
        gridColor,
        edgeColor,
      });
    }, [
      layoutDebugEnabled,
      normalized,
      piecePixelSize,
      estimatedSquareSize,
      innerLineThickness,
      edgeThickness,
      gridColor,
      edgeColor,
      surfaceLogger,
    ]);

    useEffect(() => {
      if (!layoutDebugEnabled) {
        return;
      }

      const mode = appearance.mode;
      if (lastLoggedModeRef.current === mode) {
        return;
      }

      lastLoggedModeRef.current = mode;

      requestAnimationFrame(() => {
        const gridElement = gridRef.current;
        if (!gridElement) {
          surfaceLogger.warn('grid-missing-for-square-log', { mode });
          return;
        }

        const firstSquare = gridElement.firstElementChild as HTMLElement | null;
        if (!firstSquare) {
          surfaceLogger.warn('first-square-missing', { mode });
          return;
        }

        const rect = firstSquare.getBoundingClientRect();
        const style = window.getComputedStyle(firstSquare);

        surfaceLogger.debug('first-square-style', {
          mode,
          rect: {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top,
          },
          style: {
            position: style.position,
            zIndex: style.zIndex,
            backgroundColor: style.backgroundColor,
            opacity: style.opacity,
            mixBlendMode: style.mixBlendMode,
            border: style.border,
          },
          className: firstSquare.className,
          dataAttributes: {
            square: firstSquare.getAttribute('data-square') ?? null,
          },
        });
      });
    }, [appearance.mode, layoutDebugEnabled, surfaceLogger]);

    return (
      <BoardLayerStack
        ref={stackRef}
        style={{
          backgroundColor: boardBackground,
          width: `${boardSize}px`,
          height: `${boardSize}px`,
        }}
      >
        <BoardLayer zIndex={2} pointerEvents="auto">
          <div
            ref={gridRef}
            className="grid h-full w-full"
            style={{
              width: '100%',
              height: '100%',
              gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
            }}
          >
            {squares.map((square) => {
              const isDraggingSource = dragSourceSquare === square.id;
              const overlay = squareOverlays?.[square.id];
              return (
                <ChessboardSquare
                  key={square.id}
                  square={square.id}
                  color={square.color}
                  highlight={isDraggingSource}
                  overlay={overlay}
                  showContent={showPieces}
                  appearance={appearance}
                  showIntensityLabel={showIntensityLabels}
                  onPointerDown={(event) => {
                    if (layoutDebugEnabled) {
                      surfaceLogger.debug('square-pointer-down', {
                        squareId: square.id,
                        hasPiece: Boolean(square.piece),
                        pointerId: event.pointerId,
                        button: event.button,
                      });
                    }
                    if (square.piece) {
                      onSquarePointerDown(square.id, square.piece, event);
                    }
                  }}
                >
                  {square.piece ? (
                    <ChessPieceSprite
                      piece={square.piece}
                      size={piecePixelSize}
                      className={isDraggingSource ? 'opacity-30' : undefined}
                      appearance={appearance}
                    />
                  ) : null}
                </ChessboardSquare>
              );
            })}
          </div>
        </BoardLayer>
        {normalized ? (
          <NormalizedGridOverlay
            innerLineThickness={innerLineThickness}
            edgeLineThickness={edgeThickness}
            gridColor={gridColor}
            edgeColor={edgeColor}
            logger={surfaceLogger}
          />
        ) : null}
      </BoardLayerStack>
    );
  },
);

ChessboardSurface.displayName = 'ChessboardSurface';
