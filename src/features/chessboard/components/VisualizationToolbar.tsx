'use client';

import { ReactNode } from 'react';
import { getOverlayRegistrations, getOverlayToolbar } from '@/features/chessboard/overlays/registry';
import { OverlayOptionsRecord } from '@/features/chessboard/overlays/types';
import { useVisualizationInitialization, useVisualizationStore } from '@/shared/state/visualizationStore';
import { usePreferencesStore } from '@/shared/state/preferencesStore';
import { useGameStore } from '@/shared/state/gameStore';
import '@/features/analysis/overlays/heatmapOverlayRegistration';

const PanelSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{title}</h3>
    <div className="rounded-xl border border-white/5 bg-gray-900/40 p-3 shadow-inner shadow-black/30">
      {children}
    </div>
  </div>
);

interface VisualizationToolbarProps {
  className?: string;
  asPanel?: boolean;
}

export const VisualizationToolbar = ({ className, asPanel = true }: VisualizationToolbarProps = {}) => {
  useVisualizationInitialization();
  const overlays = useVisualizationStore((state) => state.overlays);
  const setOverlayActive = useVisualizationStore((state) => state.setOverlayActive);
  const updateOverlayOptions = useVisualizationStore((state) => state.updateOverlayOptions);
  const registrations = getOverlayRegistrations();

  const moveMode = usePreferencesStore((state) => state.moveMode);
  const toggleMoveMode = usePreferencesStore((state) => state.toggleMoveMode);
  const boardOrientation = usePreferencesStore((state) => state.boardOrientation);
  const setBoardOrientation = usePreferencesStore((state) => state.setBoardOrientation);
  const resetTimeline = useGameStore((state) => state.resetTimeline);

  const rootClasses = [
    'flex w-full flex-col gap-6 text-gray-100',
    asPanel
      ? 'glass-effect rounded-2xl border border-white/10 bg-gray-900/70 p-6 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.6)]'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={rootClasses}>
      <PanelSection title="Board Settings">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-300">Play mode</span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-gray-200">
              <input
                type="checkbox"
                checked={moveMode}
                onChange={toggleMoveMode}
                className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-xs uppercase tracking-wide text-blue-200">
                {moveMode ? 'Interactive' : 'Locked'}
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-gray-400">Orientation</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'white' as const, label: 'White bottom' },
                  { id: 'black' as const, label: 'Black bottom' },
                ]
              ).map((option) => {
                const isActive = boardOrientation === option.id;
                return (
                  <button
                    key={`orientation-${option.id}`}
                    type="button"
                    onClick={() => setBoardOrientation(option.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-medium uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActive
                        ? 'border-blue-500/80 bg-blue-500/10 text-white'
                        : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-900/70'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={resetTimeline}
            className="rounded-lg bg-gradient-to-r from-blue-600/90 to-blue-500/80 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:from-blue-600 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Reset board
          </button>
        </div>
      </PanelSection>

      <PanelSection title="Visual Overlays">
        <div className="flex flex-col gap-6">
          {registrations.map((registration) => {
            const state = overlays[registration.id];
            if (!state) {
              return null;
            }

            const toolbar = getOverlayToolbar(registration.id);

            if (toolbar) {
              const updateOptions = <TOptions extends OverlayOptionsRecord>(partial: Partial<TOptions>) => {
                updateOverlayOptions(registration.id, (options) => ({
                  ...options,
                  ...partial,
                }) as TOptions);
              };

              return (
                <div key={registration.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-100">{registration.label}</span>
                    {registration.description && (
                      <span className="text-xs text-gray-400">{registration.description}</span>
                    )}
                  </div>
                  {toolbar.render({
                    overlayId: registration.id,
                    options: state.options,
                    active: state.active,
                    setActive: (active) => setOverlayActive(registration.id, active),
                    updateOptions,
                  })}
                </div>
              );
            }

            return (
              <div key={registration.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-200">{registration.label}</span>
                  {registration.description && <span className="text-xs text-gray-400">{registration.description}</span>}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.active}
                    onChange={(event) => setOverlayActive(registration.id, event.target.checked)}
                    className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs uppercase tracking-wide text-blue-200">
                    {state.active ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </PanelSection>
    </aside>
  );
};
