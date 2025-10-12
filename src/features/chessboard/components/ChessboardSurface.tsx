import { memo, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChessboardSquare } from './ChessboardSquare';
import { ChessPieceSprite } from './ChessPieceSprite';
import type { BoardSquare, ChessPieceDescriptor } from '@/features/chessboard/types';
import { createScopedLogger } from '@/shared/utils/logger';

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
  onSquarePointerDown: (
    squareId: string,
    piece: ChessPieceDescriptor,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  squareOverlays?: Record<string, { color: string; magnitude: number; maxWeight: number; strength: number }>;
  showPieces?: boolean;
  appearance: BoardAppearance;
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
  }: ChessboardSurfaceProps) => {
    const surfaceLogger = useMemo(() => createScopedLogger('chessboard/surface'), []);
    const normalized = appearance.mode === 'normalized';
    const wireframeColor = appearance.wireframeColor ?? '#ffffff';

    return (
      <div
        className={[
          'grid h-full w-full',
          normalized ? 'box-border gap-px' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
          backgroundColor: normalized ? wireframeColor : undefined,
          boxShadow: normalized ? `0 0 0 1px ${wireframeColor}` : undefined,
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
              overlayColor={overlay?.color}
              overlayStrength={overlay?.strength}
              showContent={showPieces}
              appearance={appearance}
              onPointerDown={(event) => {
                surfaceLogger.debug('square-pointer-down', {
                  squareId: square.id,
                  hasPiece: Boolean(square.piece),
                  pointerId: event.pointerId,
                  button: event.button,
                });
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
                />
              ) : null}
            </ChessboardSquare>
          );
        })}
      </div>
    );
  },
);

ChessboardSurface.displayName = 'ChessboardSurface';
