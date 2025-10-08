import { memo, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChessboardSquare } from './ChessboardSquare';
import { ChessPieceSprite } from './ChessPieceSprite';
import type { BoardSquare, ChessPieceDescriptor } from '@/features/chessboard/types';
import { createScopedLogger } from '@/shared/utils/logger';

interface ChessboardSurfaceProps {
  squares: BoardSquare[];
  piecePixelSize: number;
  dragSourceSquare?: string;
  onSquarePointerDown: (
    squareId: string,
    piece: ChessPieceDescriptor,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}

export const ChessboardSurface = memo(
  ({ squares, piecePixelSize, dragSourceSquare, onSquarePointerDown }: ChessboardSurfaceProps) => {
    const surfaceLogger = useMemo(() => createScopedLogger('chessboard/surface'), []);

    return (
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
        }}
      >
        {squares.map((square) => {
          const isDraggingSource = dragSourceSquare === square.id;
          return (
            <ChessboardSquare
              key={square.id}
              square={square.id}
              color={square.color}
              highlight={isDraggingSource}
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
