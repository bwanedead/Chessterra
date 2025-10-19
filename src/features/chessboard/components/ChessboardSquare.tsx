import { Fragment, type ReactNode } from 'react';
import type { BoardAppearance } from '@/features/chessboard/components/ChessboardSurface';
import type { SquareOverlayDescriptor } from '@/features/chessboard/overlays/schemes';

interface ChessboardSquareProps {
  square: string;
  color: 'light' | 'dark';
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  highlight?: boolean;
  className?: string;
  overlay?: SquareOverlayDescriptor | null;
  showContent?: boolean;
  appearance: BoardAppearance;
}

const HIGHLIGHT_COLOR = 'rgba(59, 130, 246, 0.25)';

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = Number.parseInt(sanitized.length === 3 ? sanitized.repeat(2) : sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const parseColor = (color: string) => {
  if (color.startsWith('#')) {
    const { r, g, b } = hexToRgb(color);
    return { r, g, b, a: 1 };
  }
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }
  const parts = match[1].split(',').map((value) => value.trim());
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a: parts[3] ? Number(parts[3]) : 1,
  };
};

const colorWithAlpha = (color: string, alpha: number) => {
  const parsed = parseColor(color);
  if (!parsed) {
    return color;
  }
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Math.min(1, Math.max(0, alpha))})`;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const composeGlow = (glow: SquareOverlayDescriptor['style']['glow'], intensity: number) => {
  if (!glow) {
    return undefined;
  }
  const strength = glow.strength ?? 0.5;
  const base = clamp01(intensity * strength);
  const primary = colorWithAlpha(glow.color, 0.45 + base * 0.35);
  const secondary = colorWithAlpha(glow.color, 0.3 + base * 0.25);
  return `0 0 14px ${primary}, 0 0 36px ${secondary}`;
};

const renderOverlay = (overlay: SquareOverlayDescriptor | null | undefined) => {
  if (!overlay) {
    return null;
  }

  const { style } = overlay;
  const intensity = clamp01(style.intensity ?? 0);
  if (intensity <= 0) {
    return null;
  }

  const glow = composeGlow(style.glow, intensity);

  if (style.kind === 'solid' || style.kind === 'flag') {
    return (
      <div
        className="absolute inset-0 pointer-events-none rounded-md transition-all duration-150"
        style={{
          opacity: intensity,
          backgroundColor: style.color,
          boxShadow: glow,
        }}
      />
    );
  }

  if (style.kind === 'segmented') {
    const segments = style.segments;
    const orientation = style.orientation ?? 'horizontal';
    const dividerColor = style.dividerColor ? colorWithAlpha(style.dividerColor, 0.9) : undefined;

    return (
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-150"
        style={{
          opacity: intensity,
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          boxShadow: glow,
        }}
      >
        {segments.map((segment, index) => (
          <Fragment key={`${segment.color}-${index}`}>
            <div
              className="h-full w-full"
              style={{
                flexGrow: Math.max(segment.proportion, 0.01),
                backgroundColor: segment.color,
              }}
            />
            {dividerColor && index < segments.length - 1 ? (
              <div
                style={{
                  width: orientation === 'horizontal' ? '2px' : '100%',
                  height: orientation === 'horizontal' ? '100%' : '2px',
                  backgroundColor: dividerColor,
                  opacity: clamp01(intensity + 0.2),
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    );
  }

  return null;
};

export const ChessboardSquare = ({
  square,
  color,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  children,
  highlight,
  className,
  overlay,
  showContent = true,
  appearance,
}: ChessboardSquareProps) => {
  const normalized = appearance.mode === 'normalized';
  let backgroundColor = color === 'light' ? appearance.lightSquare : appearance.darkSquare;
  let overlayNode: ReactNode = null;

  if (overlay) {
    const { style } = overlay;
    if (style.kind === 'solid' || style.kind === 'flag') {
      const alpha = Math.min(0.95, Math.max(0.35, style.intensity ?? 0.75));
      backgroundColor = colorWithAlpha(style.color, alpha);
      overlayNode = renderOverlay(overlay);
    } else {
      overlayNode = renderOverlay(overlay);
    }
  }

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      data-square={square}
      className={[
        'relative flex items-center justify-center overflow-hidden transition-colors duration-150',
        normalized ? '' : 'rounded-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor,
      }}
    >
      {overlayNode}
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
      <div className="relative z-10 flex h-full w-full select-none items-center justify-center pointer-events-none">
        {showContent ? children : null}
      </div>
    </div>
  );
};
