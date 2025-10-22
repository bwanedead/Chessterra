import { useMemo } from 'react';
import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapTray } from '@/features/chessboard/components/heatmap/HeatmapTray';
import { HeatmapToggleColumn } from '@/features/chessboard/components/heatmap/HeatmapToggleColumn';
import { HeatmapOptionSwitch } from '@/features/chessboard/components/heatmap/HeatmapOptionSwitch';
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
  checkHighlightsEnabled: boolean;
  onCheckHighlightsChange: (value: boolean) => void;
  showIntensityLabels: boolean;
  onShowIntensityLabelsChange: (value: boolean) => void;
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
  checkHighlightsEnabled,
  onCheckHighlightsChange,
  showIntensityLabels,
  onShowIntensityLabelsChange,
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3">
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

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contested Scheme
            </p>
            <div className="flex flex-wrap gap-2">
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
                        ? 'bg-blue-500 text-white border-blue-300 shadow-[0_8px_18px_rgba(59,130,246,0.35)] ring-2 ring-blue-200/70'
                        : 'bg-slate-800/60 text-slate-200 border-transparent hover:bg-slate-700/70 hover:border-slate-600/60',
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

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Influence Fill
            </p>
            <div className="flex gap-2">
              {(['gradient', 'flat'] as const).map((mode) => {
                const active = influenceIntensityMode === mode;
                const label = mode === 'gradient' ? 'Gradient' : 'Flat';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onInfluenceIntensityModeChange(mode)}
                    className={[
                      'flex-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors transition-shadow border',
                      active
                        ? 'bg-blue-500 text-white border-blue-300 shadow-[0_6px_14px_rgba(59,130,246,0.32)] ring-2 ring-blue-200/60'
                        : 'bg-slate-800/60 text-slate-200 border-transparent hover:bg-slate-700/70 hover:border-slate-600/60',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Trace Mode</p>
            <div className="flex gap-2">
              {supportedSubSchemes.map((mode) => {
                const active = mode === subScheme;
                const label = mode === 'line-of-sight' ? 'Line of Sight' : 'Absolute';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSubSchemeChange(mode)}
                    className={[
                      'flex-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      active ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700/70',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <HeatmapOptionSwitch
              label="Check highlights"
              checked={checkHighlightsEnabled}
              onChange={onCheckHighlightsChange}
            />
            <HeatmapOptionSwitch
              label="Show intensity numbers"
              checked={showIntensityLabels}
              onChange={onShowIntensityLabelsChange}
            />
          </div>
        </div>
      </div>
    </HeatmapTray>
  );
};
