'use client';

import { ReactNode } from 'react';
import { getOverlayRegistrations } from '@/features/chessboard/overlays/registry';
import { useVisualizationInitialization, useVisualizationStore } from '@/shared/state/visualizationStore';

interface ChessboardStageProps {
  fen: string;
  orientation: 'white' | 'black';
  boardSize: number;
  className?: string;
  children: ReactNode;
}

export const ChessboardStage = ({
  fen,
  orientation,
  boardSize,
  className,
  children,
}: ChessboardStageProps) => {
  useVisualizationInitialization();
  const overlays = useVisualizationStore((state) => state.overlays);
  const registrations = getOverlayRegistrations();

  const activeOverlays = (
    registrations
      .map((registration) => {
        const state = overlays[registration.id];
        if (!state?.active) {
          return undefined;
        }
        return { registration, state };
      })
      .filter(Boolean) as Array<{ registration: typeof registrations[number]; state: typeof overlays[string] }>
  ).sort((a, b) => (a.registration.order ?? 0) - (b.registration.order ?? 0));

  const squareSize = boardSize / 8;

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.65)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
    >
      <div className="relative z-10 h-full w-full">{children}</div>
      {activeOverlays.map(({ registration, state }) => {
        const pointerEventsClass = registration.pointerEvents === 'auto' ? 'pointer-events-auto' : 'pointer-events-none';
        const zIndex = registration.zIndex ?? 10;
        return (
          <div
            key={registration.id}
            className={['absolute inset-0', pointerEventsClass].filter(Boolean).join(' ')}
            style={{ zIndex }}
          >
            {registration.render({
              fen,
              orientation,
              boardSize,
              squareSize,
              options: state.options,
            })}
          </div>
        );
      })}
    </div>
  );
};
