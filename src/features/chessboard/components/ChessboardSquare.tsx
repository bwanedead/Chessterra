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
      <div className="relative z-10 flex items-center justify-center w-full h-full select-none pointer-events-none">
        {children}
      </div>
    </div>
  );
};
