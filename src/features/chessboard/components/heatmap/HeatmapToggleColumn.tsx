import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapToggleButton } from './HeatmapToggleButton';

interface HeatmapToggleColumnProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
}

export const HeatmapToggleColumn = ({ toggles, onToggle }: HeatmapToggleColumnProps) => (
  <div className="flex flex-shrink-0 flex-col items-center gap-2">
    {toggles.map((toggle) => (
      <HeatmapToggleButton key={toggle.id} toggle={toggle} onToggle={onToggle} />
    ))}
  </div>
);
