import { memo, useMemo } from 'react';
import type { CanvasHeatmapOverlayEntry } from '@/features/chessboard/hooks/useHeatmapOverlay';

interface ExpandedHeatmapOverlayProps {
  canvasOverlays: CanvasHeatmapOverlayEntry[];
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

export const ExpandedHeatmapOverlay = memo(
  ({ canvasOverlays, orientation, squareSize, coreOffset, extendedSize, boardSize }: ExpandedHeatmapOverlayProps) => {
    const items = useMemo(() => canvasOverlays, [canvasOverlays]);
    if (items.length === 0) {
      return null;
    }

    const maxAlpha = 0.85;
    const minAlpha = 0.25;
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
          const alpha = Math.min(maxAlpha, minAlpha + entry.strength * 0.6);
          const backgroundColor = colorWithAlpha(entry.color, alpha);

          return (
            <div
              key={`canvas-overlay-${entry.id}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: squareSize,
                height: squareSize,
                backgroundColor,
                borderRadius: 0,
                boxShadow: 'none',
              }}
            />
          );
        })}
      </div>
    );
  },
);

ExpandedHeatmapOverlay.displayName = 'ExpandedHeatmapOverlay';
