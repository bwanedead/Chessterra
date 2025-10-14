import { memo, useMemo } from 'react';

interface ExpandedHeatmapOverlayProps {
  overlays: Record<string, { color: string; strength: number }>;
  orientation: 'white' | 'black';
  squareSize: number;
  coreOffset: number;
  extendedSize: number;
  boardSize: number;
}

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const normalized = sanitized.length === 3 ? sanitized.split('').map((c) => `${c}${c}`).join('') : sanitized;
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const colorWithAlpha = (color: string, alpha: number) => {
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+)\)/, (_, values) => `rgba(${values.split(',').slice(0, 3).join(',')}, ${alpha})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\(([^)]+)\)/, (_, values) => `rgba(${values}, ${alpha})`);
  }
  if (color.startsWith('#')) {
    const { r, g, b } = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const getSquarePosition = (square: string, orientation: 'white' | 'black') => {
  const file = square.charCodeAt(0) - 97; // a -> 0
  const rank = Number(square[1]) - 1; // 1 -> 0

  if (orientation === 'white') {
    return {
      col: file,
      row: 7 - rank,
    };
  }

  return {
    col: 7 - file,
    row: rank,
  };
};

export const ExpandedHeatmapOverlay = memo(
  ({ overlays, orientation, squareSize, coreOffset, extendedSize, boardSize }: ExpandedHeatmapOverlayProps) => {
    const items = useMemo(() => Object.entries(overlays), [overlays]);
    if (items.length === 0) {
      return null;
    }

    const radiusMultiplier = 3.5;
    const radius = squareSize * radiusMultiplier;
    const boardRadius = boardSize / 2;
    const clampToExtended = (value: number) => Math.max(0, Math.min(extendedSize, value));

    return (
      <div className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ opacity: 0.9 }}>
        {items.map(([square, overlay]) => {
          const { col, row } = getSquarePosition(square, orientation);
          const centerX = coreOffset + col * squareSize + squareSize / 2;
          const centerY = coreOffset + row * squareSize + squareSize / 2;
          const left = clampToExtended(centerX - radius);
          const top = clampToExtended(centerY - radius);
          const size = radius * 2;
          const distanceFromBoardCenter = Math.sqrt(
            Math.pow(centerX - (extendedSize / 2), 2) + Math.pow(centerY - (extendedSize / 2), 2),
          );
          const falloff = Math.max(0, 1 - distanceFromBoardCenter / (boardRadius * 1.65));
          const baseStrength = Math.max(0, Math.min(overlay.strength ?? 0, 1));
          const intensity = baseStrength * 0.75 * falloff;
          const innerAlpha = 0.35 + intensity * 0.5;
          const outerAlpha = 0.08 + intensity * 0.25;
          const coreColor = colorWithAlpha(overlay.color, Math.min(innerAlpha, 0.85));
          const midColor = colorWithAlpha(overlay.color, Math.min(outerAlpha, 0.45));

          return (
            <div
              key={`expanded-heatmap-${square}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: size,
                height: size,
                pointerEvents: 'none',
                backgroundImage: `radial-gradient(circle at center, ${coreColor} 0%, ${midColor} 45%, rgba(15, 23, 42, 0) 100%)`,
                filter: `blur(${squareSize * 0.65}px)`,
                opacity: Math.min(0.9, 0.45 + intensity * 0.5),
              }}
            />
          );
        })}
      </div>
    );
  },
);

ExpandedHeatmapOverlay.displayName = 'ExpandedHeatmapOverlay';
