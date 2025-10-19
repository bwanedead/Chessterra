import { memo, useMemo } from 'react';
import type { CanvasOverlayDescriptor } from '@/features/chessboard/overlays/schemes';

interface ExpandedHeatmapOverlayProps {
  canvasOverlays: CanvasOverlayDescriptor[];
  orientation: 'white' | 'black';
  squareSize: number;
  coreOffset: number;
  extendedSize: number;
  boardSize: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const colorWithAlpha = (color: string, alpha: number) => {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((c) => `${c}${c}`).join('') : hex;
    const bigint = Number.parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
  }
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+)\)/, (_, values) => {
      const parts = values.split(',').map((value: string) => value.trim());
      return `rgba(${parts.slice(0, 3).join(', ')}, ${clamp01(alpha)})`;
    });
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\(([^)]+)\)/, (_, values) => `rgba(${values}, ${clamp01(alpha)})`);
  }
  return color;
};

const composeGlow = (entry: CanvasOverlayDescriptor, intensity: number) => {
  const glow = entry.style.glow;
  if (!glow) {
    return undefined;
  }
  const base = clamp01((glow.strength ?? 0.5) * intensity);
  const primary = colorWithAlpha(glow.color, 0.4 + base * 0.35);
  const secondary = colorWithAlpha(glow.color, 0.25 + base * 0.2);
  return `0 0 16px ${primary}, 0 0 34px ${secondary}`;
};

const computePosition = (
  fileIndex: number,
  rankIndex: number,
  squareSize: number,
  orientation: 'white' | 'black',
  borderSquares: number,
  totalSquares: number,
) => {
  const boardMaxIndex = 7;
  const whiteCol = borderSquares + fileIndex;
  const whiteRow = borderSquares + (boardMaxIndex - rankIndex);

  const col = orientation === 'white' ? whiteCol : totalSquares - 1 - whiteCol;
  const row = orientation === 'white' ? whiteRow : totalSquares - 1 - whiteRow;

  return {
    left: col * squareSize,
    top: row * squareSize,
  };
};

const renderOverlay = (entry: CanvasOverlayDescriptor) => {
  const style = entry.style;
  const intensity = clamp01(style.intensity ?? 0);
  if (intensity <= 0) {
    return null;
  }
  const glow = composeGlow(entry, intensity);

  if (style.kind === 'solid' || style.kind === 'flag') {
    return {
      element: (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: style.color,
            opacity: intensity,
            boxShadow: glow,
          }}
        />
      ),
    };
  }

  if (style.kind === 'segmented') {
    const orientation = style.orientation ?? 'horizontal';
    const dividerColor = style.dividerColor ? colorWithAlpha(style.dividerColor, 0.9) : undefined;

    return {
      element: (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            opacity: intensity,
            boxShadow: glow,
          }}
        >
          {style.segments.map((segment, index) => (
            <div
              key={`${entry.id}-${index}`}
              style={{
                flexGrow: Math.max(segment.proportion, 0.01),
                backgroundColor: segment.color,
                ...(dividerColor && index < style.segments.length - 1
                  ? {
                      marginRight: orientation === 'horizontal' ? '1px' : 0,
                      marginBottom: orientation === 'horizontal' ? 0 : '1px',
                      boxShadow:
                        orientation === 'horizontal'
                          ? `1px 0 0 ${dividerColor}`
                          : `0 1px 0 ${dividerColor}`,
                    }
                  : null),
              }}
            />
          ))}
        </div>
      ),
    };
  }

  return null;
};

export const ExpandedHeatmapOverlay = memo(
  ({ canvasOverlays, orientation, squareSize, coreOffset, extendedSize, boardSize }: ExpandedHeatmapOverlayProps) => {
    const items = useMemo(() => canvasOverlays, [canvasOverlays]);
    if (items.length === 0) {
      return null;
    }

    const borderSquares = Math.round(coreOffset / squareSize);
    const totalSquares = borderSquares * 2 + 8;
    const expectedExtended = squareSize * totalSquares;

    if (process.env.NODE_ENV === 'development' && Math.abs(expectedExtended - extendedSize) > 0.5) {
      console.warn('expanded-heatmap/geometry-mismatch', {
        squareSize,
        coreOffset,
        expectedExtended,
        extendedSize,
        boardSize,
        borderSquares,
      });
    }

    return (
      <div className="pointer-events-none absolute inset-0">
        {items.map((entry) => {
          const { left, top } = computePosition(
            entry.fileIndex,
            entry.rankIndex,
            squareSize,
            orientation,
            borderSquares,
            totalSquares,
          );

          const overlayVisual = renderOverlay(entry);
          if (!overlayVisual) {
            return null;
          }

          return (
            <div
              key={`canvas-overlay-${entry.id}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: squareSize,
                height: squareSize,
                overflow: 'hidden',
                borderRadius: 0,
              }}
            >
              {overlayVisual.element}
            </div>
          );
        })}
      </div>
    );
  },
);

ExpandedHeatmapOverlay.displayName = 'ExpandedHeatmapOverlay';
