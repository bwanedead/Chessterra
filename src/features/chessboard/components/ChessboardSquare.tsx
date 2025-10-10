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

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const parseRgba = (value: string | null | undefined) => {
  if (!value) {
    return null;
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
  overlayOpacity = 0,
  showContent = true,
}: ChessboardSquareProps) => {
  const backgroundColor = color === 'light' ? LIGHT_COLOR : DARK_COLOR;
  const baseRgb = hexToRgb(backgroundColor);
  const overlayRgb = parseRgba(overlayColor);
  const normalizedOpacity = Math.min(1, Math.max(overlayOpacity ?? 0, 0));
  const blendedRgb =
    overlayRgb && normalizedOpacity > 0 ? blendColor(baseRgb, overlayRgb, normalizedOpacity) : baseRgb;
  const tintedBackground = `rgb(${blendedRgb.r}, ${blendedRgb.g}, ${blendedRgb.b})`;
  const glow =
    overlayRgb && normalizedOpacity > 0
      ? `0 0 0 1px rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${0.35 * normalizedOpacity}), 0 0 18px rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${0.45 * normalizedOpacity})`
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
      style={{ backgroundColor: tintedBackground, boxShadow: glow }}
    >
      {highlight && (
        <div className="absolute inset-0 rounded-md pointer-events-none" style={{ backgroundColor: HIGHLIGHT_COLOR }} />
      )}
      <div className="relative z-10 flex h-full w-full items-center justify-center select-none pointer-events-none">
        {showContent ? children : null}
      </div>
    </div>
  );
};
