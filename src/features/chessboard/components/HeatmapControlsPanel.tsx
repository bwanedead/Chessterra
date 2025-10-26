import { useMemo } from 'react';
import styles from './HeatmapControlsPanel.module.css';
import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapTray } from '@/features/chessboard/components/heatmap/HeatmapTray';
import { HeatmapToggleColumn } from '@/features/chessboard/components/heatmap/HeatmapToggleColumn';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { HeatmapSchemeId } from '@/features/chessboard/overlays/schemes';
import { listHeatmapSchemes } from '@/features/chessboard/overlays/schemes';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';

interface HeatmapControlsPanelProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
  onClear: () => void;
  schemeId: HeatmapSchemeId;
  onSchemeChange: (id: HeatmapSchemeId) => void;
  subScheme: HeatmapTraceMode;
  onSubSchemeChange: (mode: HeatmapTraceMode) => void;
  influenceIntensityMode: 'gradient' | 'flat';
  onInfluenceIntensityModeChange: (mode: 'gradient' | 'flat') => void;
}

export const HeatmapControlsPanel = ({
  toggles,
  onToggle,
  onClear,
  schemeId,
  onSchemeChange,
  subScheme,
  onSubSchemeChange,
  influenceIntensityMode,
  onInfluenceIntensityModeChange,
}: HeatmapControlsPanelProps) => {
  const ordered = useMemo(() => {
    const order: ChessPieceDescriptor['type'][] = ['p', 'b', 'n', 'r', 'q', 'k'];
    const selectBy = (color: 'w' | 'b') =>
      order
        .map((type) => toggles.find((toggle) => toggle.piece.color === color && toggle.piece.type === type))
        .filter((toggle): toggle is HeatmapToggle => Boolean(toggle));

    return {
      white: selectBy('w'),
      black: selectBy('b'),
    };
  }, [toggles]);

  const schemes = useMemo(() => listHeatmapSchemes(), []);
  const schemeMap = useMemo(() => new Map(schemes.map((scheme) => [scheme.id, scheme])), [schemes]);
  const selectedScheme = schemeMap.get(schemeId) ?? schemes[0];
  const supportedSubSchemes = selectedScheme?.supportedSubSchemes ?? ['line-of-sight'];


  return (
    <HeatmapTray>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-start justify-center gap-[0.6rem]">
            <HeatmapToggleColumn
              toggles={ordered.black}
              onToggle={onToggle}
              onSelectAll={() => {
                ordered.black.forEach((toggle) => {
                  if (!toggle.active) {
                    onToggle(toggle.id);
                  }
                });
              }}
              allSelected={ordered.black.length > 0 && ordered.black.every((toggle) => toggle.active)}
            />
            <HeatmapToggleColumn
              toggles={ordered.white}
              onToggle={onToggle}
              onSelectAll={() => {
                ordered.white.forEach((toggle) => {
                  if (!toggle.active) {
                    onToggle(toggle.id);
                  }
                });
              }}
              allSelected={ordered.white.length > 0 && ordered.white.every((toggle) => toggle.active)}
            />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-slate-700 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Clear
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Contested Scheme
            </p>
            <div className={styles.schemes}>
              {schemes.map((scheme) => {
                const active = scheme.id === schemeId;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => onSchemeChange(scheme.id)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors transition-shadow border',
                      active
                        ? 'bg-blue-500 text-white border-blue-200 shadow-[0_8px_20px_rgba(59,130,246,0.35)] outline outline-2 outline-blue-100 ring-2 ring-blue-200/80'
                        : 'bg-slate-800/60 text-slate-200 border-slate-700/40 hover:bg-slate-700/70 hover:border-slate-500/60',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={scheme.description}
                  >
                    {scheme.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Influence Fill
            </p>
            <button
              type="button"
              onClick={() =>
                onInfluenceIntensityModeChange(influenceIntensityMode === 'gradient' ? 'flat' : 'gradient')
              }
              className={[
                'w-full rounded-full border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/70',
              ].join(' ')}
            >
              Use {influenceIntensityMode === 'gradient' ? 'Flat' : 'Gradient'}
            </button>
          </div>

          <div className={styles.section}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Trace Mode</p>
            {supportedSubSchemes.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  onSubSchemeChange(subScheme === 'line-of-sight' ? 'absolute' : 'line-of-sight')
                }
                className="w-full rounded-full border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/70"
              >
                Switch to {subScheme === 'line-of-sight' ? 'Absolute' : 'Line of Sight'}
              </button>
            ) : (
              <div className="rounded-full border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Mode: {subScheme === 'line-of-sight' ? 'Line of Sight' : 'Absolute'}
              </div>
            )}
          </div>
        </div>
      </div>
    </HeatmapTray>
  );
};
