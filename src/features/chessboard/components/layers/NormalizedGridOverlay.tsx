import { memo, useMemo, useRef } from 'react';
import { BoardLayer } from './BoardLayer';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { layoutDebugEnabled } from '@/shared/utils/logger';
import type { LoggerApi } from '@/shared/utils/logger';

interface NormalizedGridOverlayProps {
  innerLineThickness: number;
  edgeLineThickness: number;
  gridColor: string;
  edgeColor: string;
  logger: LoggerApi;
  diagnosticsKey?: string;
}

export const NormalizedGridOverlay = memo(
  ({
    innerLineThickness,
    edgeLineThickness,
    gridColor,
    edgeColor,
    logger,
    diagnosticsKey = 'normalized-overlay',
  }: NormalizedGridOverlayProps) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const diagnosticsEnabled = layoutDebugEnabled;

    useLayerDiagnostics({
      ref: overlayRef,
      logger,
      label: `${diagnosticsKey}-dom`,
      enabled: diagnosticsEnabled,
      sampleChildren: true,
      sampleLimit: 18,
      dependencies: [innerLineThickness, edgeLineThickness, gridColor, edgeColor],
      extra: () => ({
        innerLineThickness,
        edgeLineThickness,
        gridColor,
        edgeColor,
      }),
    });

    const columnLines = useMemo(
      () =>
        Array.from({ length: 9 }).map((_, index) => {
          const isEdge = index === 0 || index === 8;
          const thickness = isEdge ? edgeLineThickness : innerLineThickness;
          const color = isEdge ? edgeColor : gridColor;
          const left =
            index === 0
              ? '0'
              : index === 8
                ? `calc(100% - ${thickness}px)`
                : `calc(${(index / 8) * 100}% - ${thickness / 2}px)`;

          return (
            <div
              key={`normalized-grid-col-${index}`}
              className="absolute top-0 h-full"
              style={{
                left,
                width: `${thickness}px`,
                backgroundColor: color,
              }}
            />
          );
        }),
      [edgeColor, edgeLineThickness, gridColor, innerLineThickness],
    );

    const rowLines = useMemo(
      () =>
        Array.from({ length: 9 }).map((_, index) => {
          const isEdge = index === 0 || index === 8;
          const thickness = isEdge ? edgeLineThickness : innerLineThickness;
          const color = isEdge ? edgeColor : gridColor;
          const top =
            index === 0
              ? '0'
              : index === 8
                ? `calc(100% - ${thickness}px)`
                : `calc(${(index / 8) * 100}% - ${thickness / 2}px)`;

          return (
            <div
              key={`normalized-grid-row-${index}`}
              className="absolute left-0 w-full"
              style={{
                top,
                height: `${thickness}px`,
                backgroundColor: color,
              }}
            />
          );
        }),
      [edgeColor, edgeLineThickness, gridColor, innerLineThickness],
    );

    return (
      <BoardLayer zIndex={3} pointerEvents="none" className="mix-blend-normal">
        <div
          ref={overlayRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{
            boxSizing: 'border-box',
            border: `${edgeLineThickness}px solid ${edgeColor}`,
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}
        >
          {columnLines}
          {rowLines}
        </div>
      </BoardLayer>
    );
  },
);

NormalizedGridOverlay.displayName = 'NormalizedGridOverlay';
