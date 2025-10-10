import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapToggleButton } from './HeatmapToggleButton';

interface HeatmapToggleColumnProps {
  label: string;
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
}

export const HeatmapToggleColumn = ({ label, toggles, onToggle }: HeatmapToggleColumnProps) => (
  <div className="flex flex-col items-center gap-3">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
    <div className="flex flex-col items-center gap-3">
      {toggles.map((toggle) => (
        <HeatmapToggleButton key={toggle.id} toggle={toggle} onToggle={onToggle} />
      ))}
    </div>
  </div>
);
