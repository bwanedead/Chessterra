import { ReactNode } from 'react';

interface ChessboardSquareProps {
  square: string;
  color: 'light' | 'dark';
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  highlight?: boolean;
  className?: string;
  overlayColor?: string | null;
  overlayOpacity?: number;
  showContent?: boolean;
}

const LIGHT_COLOR = '#f5deab';
const DARK_COLOR = '#8b5a2b';
const HIGHLIGHT_COLOR = 'rgba(59, 130, 246, 0.25)';

export const ChessboardSquare = ({
  color,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  children,
  highlight,
  className,
  overlayColor,
  overlayOpacity = 0,
  showContent = true,
}: ChessboardSquareProps) => {
  const backgroundColor = color === 'light' ? LIGHT_COLOR : DARK_COLOR;

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      className={[
        'relative flex items-center justify-center transition-colors duration-150',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ backgroundColor }}
    >
      {highlight && (
        <div className="absolute inset-0 rounded-md pointer-events-none" style={{ backgroundColor: HIGHLIGHT_COLOR }} />
      )}
      {overlayColor ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        />
      ) : null}
      <div className="relative z-10 flex items-center justify-center w-full h-full select-none pointer-events-none">
        {showContent ? children : null}
      </div>
    </div>
  );
};
