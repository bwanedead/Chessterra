import { useMemo } from 'react';
import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapTray } from '@/features/chessboard/components/heatmap/HeatmapTray';
import { HeatmapToggleColumn } from '@/features/chessboard/components/heatmap/HeatmapToggleColumn';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';

interface HeatmapControlsPanelProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export const HeatmapControlsPanel = ({
  toggles,
  onToggle,
  onClear,
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

  return (
    <HeatmapTray title="Influence">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
        Pieces
        <button
          type="button"
          onClick={onClear}
          className="text-blue-300 transition hover:text-blue-200"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 items-start gap-x-6">
        <HeatmapToggleColumn toggles={ordered.black} onToggle={onToggle} />
        <HeatmapToggleColumn toggles={ordered.white} onToggle={onToggle} />
      </div>
    </HeatmapTray>
  );
};
