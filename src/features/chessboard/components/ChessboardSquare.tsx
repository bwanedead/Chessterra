import { ReactNode } from 'react';
import type { BoardAppearance } from '@/features/chessboard/components/ChessboardSurface';

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
  overlayStrength?: number;
  showContent?: boolean;
  appearance: BoardAppearance;
}

const HIGHLIGHT_COLOR = 'rgba(59, 130, 246, 0.25)';

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const parseToRgb = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value.startsWith('#')) {
    return { ...hexToRgb(value), a: 1 };
  }

  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i);
  if (!match) {
    return null;
  }

  const [, r, g, b, a = '1'] = match;
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: Number(a),
  };
};

const blendColor = (
  base: { r: number; g: number; b: number },
  overlay: { r: number; g: number; b: number },
  alpha: number,
) => ({
  r: Math.round(base.r * (1 - alpha) + overlay.r * alpha),
  g: Math.round(base.g * (1 - alpha) + overlay.g * alpha),
  b: Math.round(base.b * (1 - alpha) + overlay.b * alpha),
});

export const ChessboardSquare = ({
  color,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  children,
  highlight,
  className,
  overlayColor,
  overlayStrength = 0,
  showContent = true,
  appearance,
}: ChessboardSquareProps) => {
  const normalized = appearance.mode === 'normalized';
  const backgroundColor = color === 'light' ? appearance.lightSquare : appearance.darkSquare;
  const baseRgb = hexToRgb(backgroundColor);
  const overlayRgb = parseToRgb(overlayColor);
  const weight = Math.min(1, Math.max(overlayStrength, 0));
  const blendAmount = overlayRgb ? weight : 0;
  const blended = overlayRgb
    ? blendColor(baseRgb, overlayRgb, Math.min(1, blendAmount))
    : baseRgb;
  const tintedBackground = `rgb(${blended.r}, ${blended.g}, ${blended.b})`;
  const glow =
    overlayRgb && weight > 0
      ? `0 0 0 2px rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${0.45 + weight * 0.4}), 0 0 28px rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${0.55 + weight * 0.35})`
      : undefined;

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      className={[
        'relative flex items-center justify-center overflow-hidden transition-colors duration-150',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: tintedBackground,
        boxShadow: glow,
      }}
    >
      {highlight && (
        <div
          className={[
            'absolute inset-0 pointer-events-none',
            normalized ? '' : 'rounded-md',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ backgroundColor: HIGHLIGHT_COLOR }}
        />
      )}
      <div className="relative z-10 flex h-full w-full items-center justify-center select-none pointer-events-none">
        {showContent ? children : null}
      </div>
    </div>
  );
};
