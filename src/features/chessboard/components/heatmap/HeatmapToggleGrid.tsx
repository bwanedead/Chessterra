import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapToggleButton } from './HeatmapToggleButton';

interface HeatmapToggleGridProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export const HeatmapToggleGrid = ({ toggles, onToggle, onClear }: HeatmapToggleGridProps) => {
  return (
    <section>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Pieces</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-blue-300 transition hover:text-blue-200"
        >
          Clear
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {toggles.map((toggle) => (
          <HeatmapToggleButton key={toggle.id} toggle={toggle} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
};

