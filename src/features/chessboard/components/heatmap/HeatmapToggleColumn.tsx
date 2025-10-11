import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapToggleButton } from './HeatmapToggleButton';

interface HeatmapToggleColumnProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  label?: string;
}

export const HeatmapToggleColumn = ({
  toggles,
  onToggle,
  onSelectAll,
  allSelected = false,
  label,
}: HeatmapToggleColumnProps) => (
  <div className="flex flex-shrink-0 flex-col items-center gap-2">
    {label ? <span className="mb-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</span> : null}
    {toggles.map((toggle) => (
      <HeatmapToggleButton key={toggle.id} toggle={toggle} onToggle={onToggle} />
    ))}
    {onSelectAll ? (
      <button
        type="button"
        onClick={onSelectAll}
        className={`mt-1 flex h-7 w-14 items-center justify-center rounded-full border px-2 text-[9px] font-semibold uppercase tracking-[0.3em] transition ${
          allSelected
            ? 'border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
            : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
        }`}
        aria-pressed={allSelected}
      >
        All
      </button>
    ) : null}
  </div>
);
